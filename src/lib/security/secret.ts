import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Timing-safe string comparison for secrets — cron tokens, webhook secrets…
 *
 * A plain `a !== b` leaks the length of the matching prefix through response
 * timing. Both inputs are first hashed with SHA-256 (fixed 32-byte size, so
 * even the input length cannot be probed) and then compared in constant time.
 */
export function timingSafeStringEqual(
	candidate: string,
	expected: string
): boolean {
	if (typeof candidate !== "string" || typeof expected !== "string") {
		return false;
	}

	const candidateHash = createHash("sha256").update(candidate).digest();
	const expectedHash = createHash("sha256").update(expected).digest();

	return timingSafeEqual(candidateHash, expectedHash);
}
