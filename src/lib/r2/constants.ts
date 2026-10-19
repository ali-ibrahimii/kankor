/** Mirrors the `course_asset_kind` Postgres enum — keep in sync with the migration. */
export const ASSET_KINDS = [
	"video",
	"audio",
	"document",
	"answer_sheet",
] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

interface AssetLimit {
	maxSizeBytes: number;
	allowedMimeTypes: readonly string[];
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const ASSET_LIMITS: Record<AssetKind, AssetLimit> = {
	video: {
		maxSizeBytes: 3 * GB,
		allowedMimeTypes: [
			"video/mp4",
			"video/webm",
			"video/ogg",
			"video/quicktime",
			"video/x-matroska",
		],
	},
	audio: {
		maxSizeBytes: 300 * MB,
		allowedMimeTypes: [
			"audio/mpeg",
			"audio/mp4",
			"audio/ogg",
			"audio/wav",
			"audio/webm",
			"audio/x-m4a",
		],
	},
	document: {
		maxSizeBytes: 150 * MB,
		allowedMimeTypes: [
			"application/pdf",
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
			"application/vnd.ms-powerpoint",
		],
	},
	answer_sheet: {
		maxSizeBytes: 25 * MB,
		allowedMimeTypes: [
			"image/jpeg",
			"image/png",
			"image/webp",
			"application/pdf",
		],
	},
};

/** Short-lived signed URL windows — kept short since assets are private. */
export const UPLOAD_URL_TTL_SECONDS = 15 * 60;
/**
 * 4 hours, not the usual "few minutes" pattern: a `<video>`/`<audio>` element
 * replays the same signed URL for every byte-range request throughout
 * playback, so it must outlive a full lecture. Still short-lived in the
 * sense that matters — it's minted per viewing session, not stored anywhere,
 * and access is re-checked (enrollment/manager) on every mint.
 */
export const DOWNLOAD_URL_TTL_SECONDS = 4 * 60 * 60;

export function isAllowedMimeType(kind: AssetKind, mimeType: string): boolean {
	return ASSET_LIMITS[kind].allowedMimeTypes.includes(mimeType);
}

export function isAllowedSize(kind: AssetKind, sizeBytes: number): boolean {
	return sizeBytes > 0 && sizeBytes <= ASSET_LIMITS[kind].maxSizeBytes;
}

/** Keeps the object key ASCII-safe and short; the original name is stored separately. */
function sanitizeFilename(filename: string): string {
	const trimmed = filename.trim().slice(-80);
	const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "-");
	return safe || "file";
}

/**
 * Object keys are namespaced by course and kind so RLS-driven access checks
 * (via the `course_assets` table) and manual bucket browsing both stay
 * predictable: `courses/{courseId}/{kind}/{uuid}-{filename}`.
 */
export function buildStorageKey(
	courseId: string,
	kind: AssetKind,
	filename: string
): string {
	return `courses/${courseId}/${kind}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
}
