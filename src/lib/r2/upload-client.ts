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

export class ImageUploadError extends Error {}

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
	if (!requested.success) throw new ImageUploadError(requested.error);

	onProgress?.(0);
	await putWithProgress(requested.data.uploadUrl, file, onProgress);

	onProgress?.(100);
	onFinalizing?.();

	const finalized = await finalizeImageUpload(requested.data.assetId, target);
	if (!finalized.success) throw new ImageUploadError(finalized.error);

	return finalized.data;
}
