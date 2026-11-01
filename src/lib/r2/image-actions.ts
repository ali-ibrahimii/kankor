"use server";

import { createClient } from "@/lib/supabase/server";
import { isR2Configured } from "./client";
import { createUploadUrl, deleteObject, headObject } from "./presign";
import {
	buildImageKey,
	IMAGE_LIMITS,
	type ImageScope,
	isAllowedImageMimeType,
	isAllowedImageSize,
	isImageScope,
	publicImageUrl,
} from "./public-images";

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

/** Which column on the owner row receives the finished URL. */
export type ImageTarget = "cover" | "logo";

export interface RequestImageUploadInput {
	scope: ImageScope;
	ownerId: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	/** `cover` (default) or `logo` — only affects the key folder + target column. */
	variant?: ImageTarget;
}

// ─── Permission ────────────────────────────────────────────────────────────
//
// Every write is authorized twice: explicitly here (so we can return a clear
// error before touching R2) and again by the `image_assets` RLS policies when
// the row is written.

async function canManageOwner(
	supabase: Awaited<ReturnType<typeof createClient>>,
	scope: ImageScope,
	ownerId: string
): Promise<boolean> {
	const { data, error } = await supabase.rpc("can_manage_image_owner", {
		p_scope: scope,
		p_owner_id: ownerId,
	});
	if (error) return false;
	return Boolean(data);
}

// ─── 1. Ask for an upload slot ──────────────────────────────────────────────

export async function requestImageUpload(
	input: RequestImageUploadInput
): Promise<Result<{ assetId: string; uploadUrl: string; storageKey: string }>> {
	if (!isR2Configured()) {
		return {
			success: false,
			error:
				"Image storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.",
		};
	}
	if (!isImageScope(input.scope)) {
		return { success: false, error: "Unknown image scope." };
	}
	if (!isAllowedImageMimeType(input.mimeType)) {
		return {
			success: false,
			error: "Only JPEG, PNG, WebP, AVIF or GIF images are supported.",
		};
	}
	if (!isAllowedImageSize(input.sizeBytes)) {
		const maxMb = Math.round(IMAGE_LIMITS.maxSizeBytes / (1024 * 1024));
		return { success: false, error: `Image is too large (max ${maxMb}MB).` };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	if (!(await canManageOwner(supabase, input.scope, input.ownerId))) {
		return {
			success: false,
			error: "Not authorized to upload images for this course or school.",
		};
	}

	const storageKey = buildImageKey({
		scope: input.scope,
		ownerId: input.ownerId,
		filename: input.filename,
		variant: input.variant ?? "cover",
	});

	const { data: asset, error: insertError } = await supabase
		.from("image_assets")
		.insert({
			scope: input.scope,
			owner_id: input.ownerId,
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
			error: insertError?.message ?? "Could not start the upload.",
		};
	}

	try {
		const uploadUrl = await createUploadUrl(storageKey, input.mimeType);
		return {
			success: true,
			data: { assetId: asset.id, uploadUrl, storageKey },
		};
	} catch (err) {
		await supabase.from("image_assets").delete().eq("id", asset.id);
		return {
			success: false,
			error:
				err instanceof Error ? err.message : "Could not create upload URL.",
		};
	}
}

// ─── 2. Verify what landed, then publish it ─────────────────────────────────

export interface FinalizeImageUploadResult {
	url: string;
	storageKey: string;
	assetId: string;
}

export async function finalizeImageUpload(
	assetId: string,
	target: ImageTarget = "cover"
): Promise<Result<FinalizeImageUploadResult>> {
	if (!isR2Configured()) {
		return { success: false, error: "Image storage is not configured." };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data: asset, error } = await supabase
		.from("image_assets")
		.select("id, scope, owner_id, storage_key, uploaded_by")
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
			.from("image_assets")
			.update({ status: "failed" })
			.eq("id", assetId);
		return {
			success: false,
			error: "Upload could not be verified. Please try again.",
		};
	}

	// The presigned PUT pins the content type, but size is only knowable now —
	// so the object is re-validated against R2 itself before it is published.
	const contentType = meta.contentType ?? "";
	if (
		!isAllowedImageSize(meta.sizeBytes) ||
		!isAllowedImageMimeType(contentType.split(";")[0].trim())
	) {
		await deleteObject(asset.storage_key).catch(() => {});
		await supabase
			.from("image_assets")
			.update({ status: "failed" })
			.eq("id", assetId);
		return { success: false, error: "The uploaded image failed validation." };
	}

	const { error: updateError } = await supabase
		.from("image_assets")
		.update({
			status: "ready",
			size_bytes: meta.sizeBytes,
			mime_type: contentType,
		})
		.eq("id", assetId);
	if (updateError) return { success: false, error: updateError.message };

	const url = publicImageUrl(asset.storage_key);
	if (!url) return { success: false, error: "Could not build the image URL." };

	// Publish onto the owner row so every existing card/query picks it up
	// without a join. `owner_id` comes from the row we just verified.
	const patch =
		target === "logo" ? { logo_url: url } : { cover_image_url: url };
	if (asset.scope === "course") {
		const { error: courseError } = await supabase
			.from("courses")
			.update({ cover_image_url: url })
			.eq("id", asset.owner_id);
		if (courseError) return { success: false, error: courseError.message };
	} else if (asset.scope === "school") {
		const { error: schoolError } = await supabase
			.from("schools")
			.update(patch)
			.eq("id", asset.owner_id);
		if (schoolError) return { success: false, error: schoolError.message };
	} else if (asset.scope === "profile") {
		const { error: profileError } = await supabase
			.from("profiles")
			.update({ avatar_url: url })
			.eq("id", asset.owner_id);
		if (profileError) return { success: false, error: profileError.message };
	}

	return {
		success: true,
		data: { url, storageKey: asset.storage_key, assetId },
	};
}

// ─── 3. Remove ──────────────────────────────────────────────────────────────
//
// Removes the row (RLS: owner only) and the object. The owner's URL column is
// cleared only when it still points at the deleted image, so an older upload
// being cleaned up never blanks a newer cover.

export async function deleteImageAsset(assetId: string): Promise<Result> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data: asset, error } = await supabase
		.from("image_assets")
		.select("id, scope, owner_id, storage_key")
		.eq("id", assetId)
		.single();
	if (error || !asset) return { success: false, error: "Image not found." };

	const url = publicImageUrl(asset.storage_key);

	const { error: deleteError, count } = await supabase
		.from("image_assets")
		.delete({ count: "exact" })
		.eq("id", assetId);
	if (deleteError) return { success: false, error: deleteError.message };
	if (!count) {
		return { success: false, error: "Not authorized to delete this image." };
	}

	if (asset.scope === "course" && url) {
		await supabase
			.from("courses")
			.update({ cover_image_url: null })
			.eq("id", asset.owner_id)
			.eq("cover_image_url", url);
	} else if (asset.scope === "school" && url) {
		await supabase
			.from("schools")
			.update({ cover_image_url: null })
			.eq("id", asset.owner_id)
			.eq("cover_image_url", url);
		await supabase
			.from("schools")
			.update({ logo_url: null })
			.eq("id", asset.owner_id)
			.eq("logo_url", url);
	} else if (asset.scope === "profile" && url) {
		await supabase
			.from("profiles")
			.update({ avatar_url: null })
			.eq("id", asset.owner_id)
			.eq("avatar_url", url);
	}

	if (isR2Configured()) {
		await deleteObject(asset.storage_key).catch(() => {});
	}

	return { success: true, data: undefined };
}

// ─── 4. List ────────────────────────────────────────────────────────────────
//
// Everything uploaded for one course/school, ready to be shown as a gallery.

export interface OwnerImage {
	id: string;
	url: string;
	storageKey: string;
	mimeType: string;
	sizeBytes: number | null;
	createdAt: string;
}

export async function listOwnerImages(
	scope: ImageScope,
	ownerId: string
): Promise<Result<OwnerImage[]>> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("image_assets")
		.select("id, storage_key, mime_type, size_bytes, created_at")
		.eq("scope", scope)
		.eq("owner_id", ownerId)
		.eq("status", "ready")
		.order("created_at", { ascending: false });
	if (error) return { success: false, error: error.message };

	const images = (data ?? []).flatMap((row) => {
		const url = publicImageUrl(row.storage_key);
		return url
			? [
					{
						id: row.id,
						url,
						storageKey: row.storage_key,
						mimeType: row.mime_type,
						sizeBytes: row.size_bytes,
						createdAt: row.created_at,
					},
				]
			: [];
	});

	return { success: true, data: images };
}
