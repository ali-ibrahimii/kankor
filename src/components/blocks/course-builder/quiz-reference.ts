/**
 * Pure parser for quiz references entered in a course lesson's `quiz` block.
 *
 * Instructors and admins may paste:
 *  - an entrance code (e.g. `C61F0662`, `f935d2bc`, `#C61F0662`)
 *  - a public quiz link (e.g. `https://example.com/fa/quizzes/math-ch1`)
 *  - a copied quiz share link with `?code=` (`https://example.com/quizzes/math-ch1?code=C61F0662`)
 *  - a dashboard quiz/OMR URL (`/fa/d/admin/quizzes/math-ch1`, `/d/school/<id>/quizzes/<slug>/omr`)
 *  - a bare quiz UUID or slug
 */

export interface ParsedQuizReference {
	code?: string;
	slug?: string;
	quizId?: string;
}

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Entrance codes are generated as 8-char uppercase hex/alphanumeric tokens (e.g. `C61F0662`). */
const ENTRANCE_CODE_REGEX = /^[A-Z0-9]{6,12}$/i;

const QUIZ_SUBROUTES = new Set([
	"omr",
	"edit",
	"settings",
	"results",
	"attempts",
	"print",
	"scan",
	"preview",
	"take",
	"new",
]);

function looksLikeUrl(input: string): boolean {
	if (/^https?:\/\//i.test(input)) return true;
	if (input.startsWith("/")) return true;
	if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|\?)/i.test(input)) return true;
	return false;
}

function tryParseUrl(input: string): URL | null {
	try {
		if (/^https?:\/\//i.test(input)) {
			return new URL(input);
		}
		if (input.startsWith("/")) {
			return new URL(input, "https://kankor.local");
		}
		return new URL(`https://${input}`);
	} catch {
		return null;
	}
}

export function parseQuizReference(raw: string): ParsedQuizReference | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	if (looksLikeUrl(trimmed)) {
		const url = tryParseUrl(trimmed);
		if (!url) return null;

		const result: ParsedQuizReference = {};

		const queryCode = (
			url.searchParams.get("code") ??
			url.searchParams.get("entrance_code") ??
			url.searchParams.get("quizCode") ??
			""
		).trim();
		if (queryCode) {
			if (UUID_REGEX.test(queryCode)) {
				result.quizId = queryCode.toLowerCase();
			} else {
				result.code = queryCode.replace(/^#/, "").toUpperCase();
			}
		}

		const queryId = (
			url.searchParams.get("quiz_id") ??
			url.searchParams.get("quizId") ??
			""
		).trim();
		if (queryId && UUID_REGEX.test(queryId)) {
			result.quizId = queryId.toLowerCase();
		}

		const segments = url.pathname
			.split("/")
			.map((seg) => {
				try {
					return decodeURIComponent(seg).trim();
				} catch {
					return seg.trim();
				}
			})
			.filter(Boolean);

		const quizzesIdx = segments.lastIndexOf("quizzes");
		const candidate =
			quizzesIdx >= 0 && quizzesIdx + 1 < segments.length
				? segments[quizzesIdx + 1]
				: undefined;

		if (candidate && !QUIZ_SUBROUTES.has(candidate.toLowerCase())) {
			if (UUID_REGEX.test(candidate)) {
				result.quizId ??= candidate.toLowerCase();
			} else {
				result.slug = candidate;
				if (!result.code && ENTRANCE_CODE_REGEX.test(candidate)) {
					result.code = candidate.toUpperCase();
				}
			}
		}

		if (!result.code && !result.slug && !result.quizId) {
			return null;
		}
		return result;
	}

	// Strip optional leading `#` or `code:` prefix if pasted from text
	const cleaned = trimmed.replace(/^(#|code:\s*)/i, "").trim();
	if (!cleaned || /\s/.test(cleaned)) {
		return null;
	}

	if (UUID_REGEX.test(cleaned)) {
		return { quizId: cleaned.toLowerCase() };
	}

	if (ENTRANCE_CODE_REGEX.test(cleaned) && !cleaned.includes("-")) {
		return { code: cleaned.toUpperCase(), slug: cleaned };
	}

	return { slug: cleaned };
}
