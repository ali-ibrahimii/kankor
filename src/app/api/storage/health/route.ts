import { NextResponse } from "next/server";
import { getImageStorageStatus } from "@/lib/r2/image-actions";

/**
 * `GET /api/storage/health` — admin-only snapshot of the Cloudflare R2 image
 * pipeline, so a deployment can be verified without reading logs:
 *
 *   configured       all four R2_* env vars present
 *   bucket / endpoint what the app is actually talking to
 *   publicHostname   set → cards load straight from Cloudflare's CDN
 *   tableReady       the image_assets migration has been applied
 *   listing.ok       credentials can list the bucket (wrong key/id shows here)
 *   covers           ready images per scope
 */
export async function GET() {
	try {
		const status = await getImageStorageStatus();
		return NextResponse.json({ ok: true, ...status });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		const unauthorized = /unauthenticated|admin only/i.test(message);
		return NextResponse.json(
			{ ok: false, error: message },
			{ status: unauthorized ? 403 : 500 }
		);
	}
}
