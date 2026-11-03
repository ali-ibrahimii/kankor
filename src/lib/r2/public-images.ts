/**
 * Public images (course covers, school logos…) stored in Cloudflare R2.
 *
 * Isomorphic on purpose: the server actions, the upload widget and the card
 * resolvers all need to agree on the same key layout and the same URL shape,
 * so nothing here imports the AWS SDK or `server-only`.
 *
 * URL strategy
 * ------------
 * 1. If `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME` is set (an R2 custom domain such as
 *    `img.abzarkankor.com`, or the bucket's `pub-xxxx.r2.dev` host), the URL
 *    is that host directly: `<host>/<key>`. Cloudflare's CDN serves it, the
 *    browser caches it forever (keys contain a UUID, so they never change
 *    content), and no Next.js server is involved in the hot path.
 * 2. Otherwise the URL is `/api/media/<key>` — a same-origin route that
 *    streams the object out of R2. That keeps covers working in local dev
 *    and on any deployment that has not set up a public domain yet, without
 *    ever making the bucket itself public.
 */

export const IMAGE_SCOPES = ["course", "school", "profile"] as const;
export type ImageScope = (typeof IMAGE_SCOPES)[number];

/** Where each scope's objects live inside the bucket. */
const SCOPE_DIRECTORY: Record<ImageScope, string> = {
	course: "courses",
	school: "schools",
	profile: "avatars",
};

const MB = 1024 * 1024;

export const IMAGE_LIMITS = {
	maxSizeBytes: 8 * MB,
	/** next/image can optimize these; SVG is deliberately excluded (XSS vector). */
	allowedMimeTypes: [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/avif",
		"image/gif",
	] as const,
} as const;

export function isImageScope(value: string): value is ImageScope {
	return (IMAGE_SCOPES as readonly string[]).includes(value);
}

export function isAllowedImageMimeType(mimeType: string): boolean {
	return (IMAGE_LIMITS.allowedMimeTypes as readonly string[]).includes(
		mimeType
	);
}

export function isAllowedImageSize(sizeBytes: number): boolean {
	return sizeBytes > 0 && sizeBytes <= IMAGE_LIMITS.maxSizeBytes;
}

/** `<input accept>` / Dropzone value built from the allowlist. */
export const IMAGE_ACCEPT = IMAGE_LIMITS.allowedMimeTypes.join(",");

function sanitizeFilename(filename: string): string {
	const trimmed = filename.trim().slice(-80);
	const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+/, "");
	return safe || "image";
}

/**
 * `{directory}/{ownerId}/{kind}/{uuid}-{file}` — the owner id makes it trivial
 * to list/clean everything that belongs to one course or school straight from
 * the bucket, and the UUID keeps keys unique (which is what allows the
 * immutable cache headers on the media route).
 */
export function buildImageKey({
	scope,
	ownerId,
	filename,
	variant = "cover",
}: {
	scope: ImageScope;
	ownerId: string;
	filename: string;
	variant?: string;
}): string {
	const safeVariant =
		variant.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 24) || "cover";
	return `${SCOPE_DIRECTORY[scope]}/${ownerId}/${safeVariant}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
}

/** Public host for R2 objects, when one is configured. */
export function publicImageHost(): string | null {
	const host = process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME?.trim();
	return host ? host.replace(/^https?:\/\//, "").replace(/\/+$/, "") : null;
}

/**
 * Turns a storage key into the URL a browser loads. Returns `null` for an
 * empty key so callers can fall back to a placeholder.
 */
export function publicImageUrl(key: string | null | undefined): string | null {
	if (!key) return null;
	if (key.startsWith("http://") || key.startsWith("https://")) return key;

	const host = publicImageHost();
	if (host) return `https://${host}/${key.replace(/^\/+/, "")}`;

	return `/api/media/${key.replace(/^\/+/, "")}`;
}

/** True for URLs this app itself serves (public host or the media proxy). */
export function isOwnImageUrl(url: string): boolean {
	if (url.startsWith("/api/media/")) return true;
	const host = publicImageHost();
	if (!host) return false;
	try {
		return new URL(url).hostname === host;
	} catch {
		return false;
	}
}
