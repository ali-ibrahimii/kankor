"use client";

import {
	finalizeImageUpload,
	type ImageTarget,
	requestImageUpload,
} from "@/lib/r2/image-actions";
import {
	IMAGE_LIMITS,
	type ImageScope,
	isAllowedImageMimeType,
	isAllowedImageSize,
} from "@/lib/r2/public-images";

/**
 * One browser→Cloudflare R2 image upload, end to end:
 *
 *   requestImageUpload (presigned PUT) → XHR PUT with real progress →
 *   finalizeImageUpload (server verifies + publishes the URL)
 *
 * Kept separate from the widget so callers that only get an owner id *after*
 * creating a record (a brand-new course, for instance) can reuse the exact same
 * path. Throws an `Error` with a user-facing message on any failure.
 */

export type ImageUploadErrorCode =
	| "not_configured"
	| "not_authorized"
	| "permission_check_failed"
	| "upload_record_failed"
	| "upload_url_failed";

export class ImageUploadError extends Error {
	/** Stable cause so UI code can localize instead of showing raw text. */
	readonly code?: ImageUploadErrorCode;

	constructor(message: string, code?: ImageUploadErrorCode) {
		super(message);
		this.name = "ImageUploadError";
		this.code = code;
	}
}

export interface UploadImageFileOptions {
	scope: ImageScope;
	ownerId: string;
	file: File;
	target?: ImageTarget;
	onProgress?: (percent: number) => void;
	onFinalizing?: () => void;
}

function putWithProgress(
	url: string,
	file: File,
	onProgress?: (percent: number) => void
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", url);
		xhr.setRequestHeader("Content-Type", file.type);
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				onProgress?.(Math.round((event.loaded / event.total) * 100));
			}
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) resolve();
			else reject(new ImageUploadError(`Upload failed (${xhr.status})`));
		};
		xhr.onerror = () =>
			reject(
				new ImageUploadError(
					"Upload failed — check the bucket CORS rules (see docs/cloudflare-images.md)."
				)
			);
		xhr.send(file);
	});
}

/**
 * Same-origin fallback used when the direct browser→R2 PUT is blocked
 * (bucket CORS rules, corporate proxies, restricted networks): the file is
 * posted to our own route handler, which stores it server-side. The server
 * only accepts the pending `image_assets` row created by
 * `requestImageUpload` for the signed-in user — the storage key always comes
 * from that row, never from the client.
 */
function putViaProxy(
	assetId: string,
	file: File,
	onProgress?: (percent: number) => void
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", "/api/image-upload");
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				onProgress?.(Math.round((event.loaded / event.total) * 100));
			}
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) resolve();
			else
				reject(new ImageUploadError(`Fallback upload failed (${xhr.status})`));
		};
		xhr.onerror = () =>
			reject(
				new ImageUploadError("Fallback upload failed — server unreachable.")
			);
		const form = new FormData();
		form.append("file", file);
		form.append("assetId", assetId);
		xhr.send(form);
	});
}

/** Client-side guard so an obviously wrong file never costs a round-trip. */
export function validateImageFile(file: File): string | null {
	if (!isAllowedImageMimeType(file.type)) {
		return "invalidType";
	}
	if (!isAllowedImageSize(file.size)) {
		return "tooLarge";
	}
	return null;
}

export function formatImageLimit(): string {
	return `${Math.round(IMAGE_LIMITS.maxSizeBytes / (1024 * 1024))}MB`;
}

export async function uploadImageFile({
	scope,
	ownerId,
	file,
	target = "cover",
	onProgress,
	onFinalizing,
}: UploadImageFileOptions): Promise<{
	url: string;
	assetId: string;
	storageKey: string;
}> {
	const requested = await requestImageUpload({
		scope,
		ownerId,
		variant: target,
		filename: file.name,
		mimeType: file.type,
		sizeBytes: file.size,
	});
	if (!requested.success)
		throw new ImageUploadError(requested.error, requested.code);

	onProgress?.(0);
	try {
		await putWithProgress(requested.data.uploadUrl, file, onProgress);
	} catch (directError) {
		// Direct browser→R2 upload can be blocked (bucket CORS rules, network
		// policies). Retry through the same-origin proxy — the object lands in
		// the bucket either way, and `finalizeImageUpload` verifies it the same.
		console.warn("direct R2 upload failed, using proxy fallback", directError);
		await putViaProxy(requested.data.assetId, file, onProgress);
	}

	onProgress?.(100);
	onFinalizing?.();

	const finalized = await finalizeImageUpload(requested.data.assetId, target);
	if (!finalized.success)
		throw new ImageUploadError(finalized.error, finalized.code);

	return finalized.data;
}
