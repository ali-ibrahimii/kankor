/**
 * Storage layout for generated certificate PDFs on R2.
 *
 * Certificates are PRIVATE objects: never build a public URL from these
 * keys. Reads must go through `getCertificateDownloadUrl` (short-lived
 * signed URL, gated by the `certificates` RLS owner policy). Third parties
 * verify authenticity via the public `/verify/[code]` page instead of the
 * file itself.
 *
 * Key shape: certificates/{userId}/{certificateId}.pdf
 * - Prefixed under `certificates/` so bucket lifecycle/audit rules can
 *   target it separately from `courses/` assets.
 * - The userId segment makes per-user auditing and GDPR-style cleanup a
 *   simple prefix delete.
 * - The certificateId (not courseId) is the filename so a re-issued
 *   certificate (e.g. after an admin re-grant) never overwrites history.
 */
export function buildCertificateStorageKey(
	userId: string,
	certificateId: string
): string {
	return `certificates/${userId}/${certificateId}.pdf`;
}

/** Signed download window — long enough to open & save, short enough to not leak. */
export const CERTIFICATE_DOWNLOAD_TTL_SECONDS = 10 * 60;
