import { NextResponse } from "next/server";
import { isR2Configured } from "@/lib/r2/client";
import { putObject } from "@/lib/r2/presign";
import {
	isAllowedImageMimeType,
	isAllowedImageSize,
} from "@/lib/r2/public-images";
import { createClient } from "@/lib/supabase/server";

/** Cross-realm safe: formdata parsers may hand back foreign File instances. */
function isFileLike(value: FormDataEntryValue | null): value is File {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as File).arrayBuffer === "function" &&
		typeof (value as File).size === "number" &&
		typeof (value as File).type === "string"
	);
}

/**
 * Same-origin upload fallback: `POST /api/image-upload` (multipart: `file`,
 * `assetId`).
 *
 * The primary path is a presigned PUT straight from the browser to R2; when
 * that is blocked (bucket CORS rules, corporate proxies, restricted networks)
 * the client posts the file here and the server stores it instead — no CORS
 * involved.
 *
 * This never becomes an open write proxy into the bucket: the only accepted
 * target is the pending `image_assets` row that `requestImageUpload` created
 * for the signed-in user, and the storage key is taken from that row, never
 * from the request.
 */
export async function POST(request: Request) {
	try {
		const form = await request.formData();
		const file = form.get("file");
		const assetId = form.get("assetId");
		if (!isFileLike(file) || typeof assetId !== "string" || !assetId) {
			return NextResponse.json(
				{ error: "Missing file or assetId." },
				{ status: 400 }
			);
		}

		if (!isR2Configured()) {
			return NextResponse.json(
				{ error: "Image storage is not configured." },
				{ status: 503 }
			);
		}

		if (!isAllowedImageMimeType(file.type) || !isAllowedImageSize(file.size)) {
			return NextResponse.json(
				{ error: "Unsupported image." },
				{ status: 400 }
			);
		}

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
		}

		const { data: asset } = await supabase
			.from("image_assets")
			.select("storage_key, mime_type, status, uploaded_by")
			.eq("id", assetId)
			.maybeSingle();
		if (!asset || asset.status !== "pending" || asset.uploaded_by !== user.id) {
			return NextResponse.json({ error: "Not authorized." }, { status: 403 });
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		await putObject(asset.storage_key, buffer, asset.mime_type);
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("image-upload proxy failed", error);
		return NextResponse.json({ error: "Upload failed." }, { status: 500 });
	}
}
