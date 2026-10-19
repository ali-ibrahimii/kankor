import { S3Client } from "@aws-sdk/client-s3";
import { serverEnv } from "@/lib/env/server-env";

/** True once every R2 credential is present — checked before any R2 call. */
export function isR2Configured(): boolean {
	const { accountId, accessKeyId, secretAccessKey, bucketName } = serverEnv.r2;
	return Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
}

export function r2Bucket(): string {
	if (!serverEnv.r2.bucketName) {
		throw new Error(
			"R2_BUCKET_NAME is not set. See src/lib/r2/client.ts for required env vars."
		);
	}
	return serverEnv.r2.bucketName;
}

let cachedClient: S3Client | null = null;

/**
 * R2 speaks the S3 API, so the regular AWS SDK works against it — only the
 * endpoint/region differ. `region: "auto"` is what Cloudflare's docs specify
 * for R2's S3-compatible endpoint.
 */
export function getR2Client(): S3Client {
	if (!isR2Configured()) {
		throw new Error(
			"Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME."
		);
	}
	if (!cachedClient) {
		cachedClient = new S3Client({
			region: "auto",
			endpoint:
				serverEnv.r2.endpoint ??
				`https://${serverEnv.r2.accountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: serverEnv.r2.accessKeyId as string,
				secretAccessKey: serverEnv.r2.secretAccessKey as string,
			},
		});
	}
	return cachedClient;
}

/**
 * Builds a public URL for a **public-kind** object served via the R2 custom
 * domain (e.g. storage.abzarkankor.com) — no signature, no auth, cacheable
 * by anyone with the key.
 *
 * Do NOT call this for video/audio/document/answer_sheet keys. Those are
 * private and must only ever be resolved through getAssetSignedUrl, which
 * checks course_assets RLS (course manager or enrolled student) before
 * minting a short-lived signed URL. This helper exists for a future
 * public-asset kind (course thumbnails, avatars, marketing images) — nothing
 * in the codebase calls it yet.
 */
export function publicAssetUrl(key: string): string {
	if (!serverEnv.r2.publicHostname) {
		throw new Error(
			"R2_PUBLIC_HOSTNAME is not set. Only use publicAssetUrl for objects meant to be world-readable."
		);
	}
	return `https://${serverEnv.r2.publicHostname}/${key}`;
}
