import type { ActionErrorCode } from "./actions";
import type { NewCourseFormValues } from "./types";

/**
 * Pure validation for the new/edit course form. Kept outside the dialog so the
 * rules are unit-testable and can never drift between create and edit mode.
 */
export type CourseFormIssue =
	| "titleRequired"
	| "priceRequired"
	| "priceInvalid"
	| "promoInvalid";

function isHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export function validateCourseFormValues(
	values: NewCourseFormValues
): CourseFormIssue | null {
	if (!values.title.trim()) return "titleRequired";

	// A paid course without a real price used to be saved as a free course
	// silently — make the price mandatory and a positive integer (credits).
	if (!values.is_free) {
		const raw = values.price_credits.trim();
		if (!raw) return "priceRequired";
		const price = Number(raw);
		if (!Number.isInteger(price) || price <= 0) return "priceInvalid";
	}

	const promo = values.promo_video_url.trim();
	if (promo && !isHttpUrl(promo)) return "promoInvalid";

	return null;
}

/**
 * Localized message key (namespace `courseBuilder`) for each action failure
 * code, so server errors never surface as raw English database text.
 */
export const ACTION_ERROR_TRANSLATION_KEYS: Record<ActionErrorCode, string> = {
	unauthorized: "actionErrors.unauthorized",
	forbidden: "actionErrors.forbidden",
	not_found: "actionErrors.notFound",
	conflict: "actionErrors.conflict",
	invalid: "actionErrors.invalid",
	database: "actionErrors.database",
};
