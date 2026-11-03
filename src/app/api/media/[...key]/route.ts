import { NextResponse } from "next/server";
import { isR2Configured } from "@/lib/r2/client";
import { getObjectStream } from "@/lib/r2/presign";
import { createClient } from "@/lib/supabase/server";

/**
 * Public image fallback: `/api/media/courses/{id}/cover/{uuid}-cover.jpg`.
 *
 * Used only when `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME` is not set — with a custom
 * domain, cards link straight to Cloudflare's CDN and this route is never hit.
 *
 * The key is validated against `image_assets` (status = 'ready') before any
 * object is read, so this never becomes an open proxy into the bucket: private
 * kinds (video/audio/document/answer_sheet) live in `course_assets` and are
 * not reachable from here. Keys contain a UUID and are never rewritten, so the
 * response can be cached forever.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ key: string[] }> }
) {
	const { key: segments } = await params;
	const key = segments.map(decodeURIComponent).join("/");

	// Cheap shape check: only the public-images layout is allowed through.
	if (!/^(courses|schools|avatars)\/[\w-]+\/[\w-]+\/[\w.-]+$/.test(key)) {
		return new NextResponse("Not found", { status: 404 });
	}

	if (!isR2Configured()) {
		return new NextResponse("Storage is not configured", { status: 503 });
	}

	const supabase = await createClient();
	const { data: asset } = await supabase
		.from("image_assets")
		.select("id, mime_type")
		.eq("storage_key", key)
		.eq("status", "ready")
		.maybeSingle();

	if (!asset) {
		return new NextResponse("Not found", { status: 404 });
	}

	try {
		const object = await getObjectStream(key);
		if (!object.body) {
			return new NextResponse("Not found", { status: 404 });
		}

		return new NextResponse(object.body, {
			status: 200,
			headers: {
				"Content-Type": object.contentType ?? asset.mime_type,
				...(object.contentLength
					? { "Content-Length": String(object.contentLength) }
					: {}),
				// UUID keys are immutable, so this can never go stale.
				"Cache-Control": "public, max-age=31536000, immutable",
				...(object.etag ? { ETag: object.etag } : {}),
			},
		});
	} catch {
		return new NextResponse("Not found", { status: 404 });
	}
}
