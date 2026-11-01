import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, r2Bucket } from "./client";
import { DOWNLOAD_URL_TTL_SECONDS, UPLOAD_URL_TTL_SECONDS } from "./constants";

/**
 * Presigned PUT URL for a direct browser-to-R2 upload. Content-Type is part
 * of the signed request, so the caller can't swap it for a different type
 * after the URL is issued — actual size/type are re-verified server-side via
 * `headObject` once the upload completes (see `finalizeAssetUpload`).
 */
export async function createUploadUrl(
	key: string,
	contentType: string
): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: r2Bucket(),
		Key: key,
		ContentType: contentType,
	});
	return getSignedUrl(getR2Client(), command, {
		expiresIn: UPLOAD_URL_TTL_SECONDS,
	});
}

/**
 * Server-side direct upload for objects the server itself generates (e.g.
 * certificate PDFs) — no presigned URL round-trip, the buffer never touches
 * the client before landing in the bucket.
 */
export async function putObject(
	key: string,
	body: Buffer | Uint8Array,
	contentType: string
): Promise<void> {
	await getR2Client().send(
		new PutObjectCommand({
			Bucket: r2Bucket(),
			Key: key,
			Body: body,
			ContentType: contentType,
		})
	);
}

/** Presigned GET URL — the only way an authorized client ever reads a private object. */
export async function createDownloadUrl(
	key: string,
	expiresInSeconds: number = DOWNLOAD_URL_TTL_SECONDS
): Promise<string> {
	const command = new GetObjectCommand({ Bucket: r2Bucket(), Key: key });
	return getSignedUrl(getR2Client(), command, { expiresIn: expiresInSeconds });
}

export interface ObjectMetadata {
	sizeBytes: number;
	contentType: string | null;
}

/** Server-side ground truth for what actually landed in the bucket. */
export async function headObject(key: string): Promise<ObjectMetadata> {
	const result = await getR2Client().send(
		new HeadObjectCommand({ Bucket: r2Bucket(), Key: key })
	);
	return {
		sizeBytes: result.ContentLength ?? 0,
		contentType: result.ContentType ?? null,
	};
}

export async function deleteObject(key: string): Promise<void> {
	await getR2Client().send(
		new DeleteObjectCommand({ Bucket: r2Bucket(), Key: key })
	);
}

export interface ObjectStream {
	body: ReadableStream<Uint8Array> | null;
	contentType: string | null;
	contentLength: number | null;
	etag: string | null;
}

/**
 * Streams an object out of R2 without buffering it in memory — used by the
 * `/api/media` route that serves public images when no R2 custom domain is
 * configured.
 */
export async function getObjectStream(key: string): Promise<ObjectStream> {
	const result = await getR2Client().send(
		new GetObjectCommand({ Bucket: r2Bucket(), Key: key })
	);
	return {
		body: (result.Body as ReadableStream<Uint8Array> | undefined) ?? null,
		contentType: result.ContentType ?? null,
		contentLength: result.ContentLength ?? null,
		etag: result.ETag ?? null,
	};
}
