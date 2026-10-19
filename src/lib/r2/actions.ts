"use server";

import { serverEnv } from "@/lib/env/server-env";
import { createClient } from "@/lib/supabase/server";
import { isR2Configured } from "./client";
import {
	ASSET_LIMITS,
	type AssetKind,
	buildStorageKey,
	DOWNLOAD_URL_TTL_SECONDS,
	isAllowedMimeType,
	isAllowedSize,
} from "./constants";
import {
	createDownloadUrl,
	createUploadUrl,
	deleteObject,
	headObject,
} from "./presign";

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

// ─── Request an upload slot ────────────────────────────────────────────────
//
// Only a course manager (instructor/admin/school editor) may request an
// upload URL — enforced twice: once explicitly here (before we ever talk to
// R2, which has no concept of RLS) and again by the `course_assets` insert
// policy when the metadata row is written.

export interface RequestAssetUploadInput {
	courseId: string;
	blockId: string;
	kind: AssetKind;
	filename: string;
	mimeType: string;
	sizeBytes: number;
}

export async function requestAssetUpload(
	input: RequestAssetUploadInput
): Promise<Result<{ assetId: string; uploadUrl: string; storageKey: string }>> {
	if (!isR2Configured()) {
		return {
			success: false,
			error:
				"File storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.",
		};
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	if (!isAllowedMimeType(input.kind, input.mimeType)) {
		return { success: false, error: "This file type is not supported." };
	}
	if (!isAllowedSize(input.kind, input.sizeBytes)) {
		const maxMb = Math.round(
			ASSET_LIMITS[input.kind].maxSizeBytes / (1024 * 1024)
		);
		return { success: false, error: `File is too large (max ${maxMb}MB).` };
	}

	const { data: canManage, error: rpcError } = await supabase.rpc(
		"can_manage_course",
		{ p_course_id: input.courseId }
	);
	if (rpcError) return { success: false, error: rpcError.message };
	if (!canManage) {
		return {
			success: false,
			error: "Not authorized to upload to this course.",
		};
	}

	const storageKey = buildStorageKey(
		input.courseId,
		input.kind,
		input.filename
	);

	const { data: asset, error: insertError } = await supabase
		.from("course_assets")
		.insert({
			course_id: input.courseId,
			block_id: input.blockId,
			kind: input.kind,
			storage_key: storageKey,
			original_filename: input.filename,
			mime_type: input.mimeType,
			size_bytes: input.sizeBytes,
			status: "pending",
			uploaded_by: user.id,
		})
		.select("id")
		.single();
	if (insertError || !asset) {
		return {
			success: false,
			error: insertError?.message ?? "Could not start upload.",
		};
	}

	try {
		const uploadUrl = await createUploadUrl(storageKey, input.mimeType);
		return {
			success: true,
			data: { assetId: asset.id, uploadUrl, storageKey },
		};
	} catch (err) {
		await supabase.from("course_assets").delete().eq("id", asset.id);
		return {
			success: false,
			error:
				err instanceof Error ? err.message : "Could not create upload URL.",
		};
	}
}

// ─── Finalize an upload ────────────────────────────────────────────────────
//
// The presigned PUT can't fully enforce size/type on its own, so this HEADs
// the object straight from R2 — the only source of truth for what actually
// landed in the bucket — and rejects (deleting the object) anything outside
// the declared limits before the asset is ever marked "ready" and made
// visible to enrolled students.

export async function finalizeAssetUpload(
	assetId: string
): Promise<Result<{ storageKey: string }>> {
	if (!isR2Configured()) {
		return { success: false, error: "File storage is not configured." };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data: asset, error } = await supabase
		.from("course_assets")
		.select("id, course_id, kind, storage_key, uploaded_by")
		.eq("id", assetId)
		.single();
	if (error || !asset) return { success: false, error: "Upload not found." };
	if (asset.uploaded_by !== user.id) {
		return { success: false, error: "Not authorized to finalize this upload." };
	}

	let meta: Awaited<ReturnType<typeof headObject>>;
	try {
		meta = await headObject(asset.storage_key);
	} catch {
		await supabase
			.from("course_assets")
			.update({ status: "failed" })
			.eq("id", assetId);
		return {
			success: false,
			error: "Upload could not be verified. Try again.",
		};
	}

	const kind = asset.kind as AssetKind;
	const validSize = isAllowedSize(kind, meta.sizeBytes);
	const validType = meta.contentType
		? isAllowedMimeType(kind, meta.contentType)
		: false;

	if (!validSize || !validType) {
		await deleteObject(asset.storage_key).catch(() => {});
		await supabase
			.from("course_assets")
			.update({ status: "failed" })
			.eq("id", assetId);
		return { success: false, error: "Uploaded file failed validation." };
	}

	const { error: updateError } = await supabase
		.from("course_assets")
		.update({
			status: "ready",
			size_bytes: meta.sizeBytes,
			mime_type: meta.contentType ?? undefined,
		})
		.eq("id", assetId);
	if (updateError) return { success: false, error: updateError.message };

	return { success: true, data: { storageKey: asset.storage_key } };
}

// ─── Signed read access ─────────────────────────────────────────────────────
//
// The only path from an R2 object key to a usable URL. Relies entirely on
// `course_assets` RLS (can_manage_course OR is_enrolled) to decide who gets
// a signed URL — this function does no authorization of its own.

export async function getAssetSignedUrl(
	storageKey: string
): Promise<Result<{ url: string; expiresAt: string }>> {
	if (!isR2Configured()) {
		return { success: false, error: "File storage is not configured." };
	}

	const supabase = await createClient();
	const { data: asset, error } = await supabase
		.from("course_assets")
		.select("storage_key")
		.eq("storage_key", storageKey)
		.eq("status", "ready")
		.maybeSingle();
	if (error) return { success: false, error: error.message };
	if (!asset) return { success: false, error: "Not found or access denied." };

	const url = await createDownloadUrl(asset.storage_key);
	return {
		success: true,
		data: {
			url,
			expiresAt: new Date(
				Date.now() + DOWNLOAD_URL_TTL_SECONDS * 1000
			).toISOString(),
		},
	};
}

// ─── Delete ─────────────────────────────────────────────────────────────────
//
// Keyed on storage_key (not the asset id) — that's the only identifier the
// UI still has after a page reload, since only the storage key is persisted
// onto the content block.

export async function deleteCourseAsset(storageKey: string): Promise<Result> {
	const supabase = await createClient();

	// RLS (can_manage_course) enforces that only a course manager can delete
	// the row; if the caller lacks permission this simply matches 0 rows.
	const { error: deleteError, count } = await supabase
		.from("course_assets")
		.delete({ count: "exact" })
		.eq("storage_key", storageKey);
	if (deleteError) return { success: false, error: deleteError.message };
	if (!count)
		return { success: false, error: "Not authorized to delete this asset." };

	if (isR2Configured()) {
		await deleteObject(storageKey).catch(() => {});
	}

	return { success: true, data: undefined };
}

// ─── Library Asset Uploads ──────────────────────────────────────────────────

export interface RequestLibraryUploadInput {
	filename: string;
	mimeType: string;
	sizeBytes: number;
	categoryId?: string;
}

export async function requestLibraryUpload(
	input: RequestLibraryUploadInput
): Promise<
	Result<{ uploadUrl: string; storageKey: string; publicUrl: string }>
> {
	if (!isR2Configured()) {
		return {
			success: false,
			error: "File storage is not configured.",
		};
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	// Verify the user is an admin
	const { data: profile } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.single();
	if (profile?.role !== "admin") {
		return { success: false, error: "Not authorized. Admin only." };
	}

	// Validate mime type (PDF/EPUB)
	const allowedMimes = [
		"application/pdf",
		"application/epub+zip",
		"application/x-epub+zip",
	];
	if (!allowedMimes.includes(input.mimeType)) {
		return { success: false, error: "Only PDF and EPUB files are allowed." };
	}

	// Max 150MB limit
	const maxSizeBytes = 150 * 1024 * 1024;
	if (input.sizeBytes > maxSizeBytes) {
		return { success: false, error: "File is too large (max 150MB)." };
	}

	const categoryDir = input.categoryId ? input.categoryId : "general";
	const cleanFilename =
		input.filename
			.trim()
			.slice(-80)
			.replace(/[^a-zA-Z0-9._-]/g, "-") || "file.pdf";
	const storageKey = `libraries/${categoryDir}/${crypto.randomUUID()}-${cleanFilename}`;

	try {
		const uploadUrl = await createUploadUrl(storageKey, input.mimeType);
		const publicUrl = `https://${serverEnv.r2.publicHostname}/${storageKey}`;
		return {
			success: true,
			data: { uploadUrl, storageKey, publicUrl },
		};
	} catch (err) {
		return {
			success: false,
			error:
				err instanceof Error ? err.message : "Could not create upload URL.",
		};
	}
}

export async function deleteLibraryAsset(storageKey: string): Promise<Result> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	// Verify the user is an admin
	const { data: profile } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.single();
	if (profile?.role !== "admin") {
		return { success: false, error: "Not authorized. Admin only." };
	}

	if (isR2Configured()) {
		await deleteObject(storageKey).catch(() => {});
	}
	return { success: true, data: undefined };
}
