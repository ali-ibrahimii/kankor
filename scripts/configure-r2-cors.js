#!/usr/bin/env node

/**
 * One-time (or re-run-on-change) setup script for the Cloudflare R2 bucket
 * used by src/lib/r2. Browsers upload directly to R2 via presigned PUT URLs
 * (see requestAssetUpload in src/lib/r2/actions.ts), so the bucket needs a
 * CORS policy allowing PUT/GET from the app's origin(s) — R2 has no CORS
 * config by default, and without it every direct-upload PUT fails as an
 * opaque browser CORS error.
 *
 * Usage:
 *   pnpm setup:r2:cors
 *
 * Requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 * R2_BUCKET_NAME (and optionally R2_ENDPOINT) in the environment — the same
 * vars consumed by src/lib/r2/client.ts. Extra allowed origins beyond
 * NEXT_PUBLIC_SITE_URL/localhost can be passed comma-separated via
 * R2_CORS_EXTRA_ORIGINS.
 */

const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
	console.error(
		"Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME."
	);
	process.exit(1);
}

const origins = new Set([
	"http://localhost:3000",
	"http://127.0.0.1:3000",
	
]);
if (process.env.NEXT_PUBLIC_SITE_URL) origins.add(process.env.NEXT_PUBLIC_SITE_URL);
for (const origin of (process.env.R2_CORS_EXTRA_ORIGINS || "")
	.split(",")
	.map((o) => o.trim())
	.filter(Boolean)) {
	origins.add(origin);
}

const client = new S3Client({
	region: "auto",
	endpoint,
	credentials: { accessKeyId, secretAccessKey },
});

async function main() {
	await client.send(
		new PutBucketCorsCommand({
			Bucket: bucketName,
			CORSConfiguration: {
				CORSRules: [
					{
						AllowedOrigins: [...origins],
						AllowedMethods: ["PUT", "GET", "HEAD"],
						AllowedHeaders: ["*"],
						ExposeHeaders: ["ETag"],
						MaxAgeSeconds: 3600,
					},
				],
			},
		})
	);
	console.log(`R2 bucket "${bucketName}" CORS configured for:`);
	for (const origin of origins) console.log(`  - ${origin}`);
}

main().catch((err) => {
	console.error("Failed to configure R2 bucket CORS:", err.message ?? err);
	process.exit(1);
});
