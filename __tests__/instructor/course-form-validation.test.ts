import { describe, expect, it } from "vitest";
import type { NewCourseFormValues } from "@/components/blocks/course-builder/types";
import {
	ACTION_ERROR_TRANSLATION_KEYS,
	validateCourseFormValues,
} from "@/components/blocks/course-builder/validation";

const baseValues: NewCourseFormValues = {
	title: "آموزش Next.js",
	subtitle: "",
	description: "",
	language: "fa",
	level: "all_levels",
	is_free: true,
	price_credits: "",
	visibility: "private",
	related_decks_ids: [],
	related_quizzes_ids: [],
	related_libraries_ids: [],
	book_id: null,
	subject_id: null,
	grade_id: null,
	learning_objectives: "",
	prerequisites: "",
	estimated_duration_hours: "",
	promo_video_url: "",
	welcome_message: "",
	seo_title: "",
	seo_description: "",
};

describe("validateCourseFormValues", () => {
	it("accepts a minimal free course", () => {
		expect(validateCourseFormValues(baseValues)).toBeNull();
	});

	it("requires a title", () => {
		expect(validateCourseFormValues({ ...baseValues, title: "   " })).toBe(
			"titleRequired"
		);
	});

	it("requires a price for a paid course", () => {
		expect(
			validateCourseFormValues({
				...baseValues,
				is_free: false,
				price_credits: "",
			})
		).toBe("priceRequired");
	});

	it("rejects a non-positive or fractional price", () => {
		for (const price of ["0", "-5", "2.5", "abc"]) {
			expect(
				validateCourseFormValues({
					...baseValues,
					is_free: false,
					price_credits: price,
				})
			).toBe("priceInvalid");
		}
	});

	it("accepts a whole-number price for a paid course", () => {
		expect(
			validateCourseFormValues({
				...baseValues,
				is_free: false,
				price_credits: "250",
			})
		).toBeNull();
	});

	it("ignores the price field for a free course", () => {
		expect(
			validateCourseFormValues({ ...baseValues, price_credits: "junk" })
		).toBeNull();
	});

	it("rejects a malformed promo video URL", () => {
		expect(
			validateCourseFormValues({ ...baseValues, promo_video_url: "not a url" })
		).toBe("promoInvalid");
		expect(
			validateCourseFormValues({
				...baseValues,
				promo_video_url: "ftp://example.com/video",
			})
		).toBe("promoInvalid");
	});

	it("accepts empty or http(s) promo video URLs", () => {
		expect(
			validateCourseFormValues({ ...baseValues, promo_video_url: "  " })
		).toBeNull();
		expect(
			validateCourseFormValues({
				...baseValues,
				promo_video_url: "https://youtube.com/watch?v=abc",
			})
		).toBeNull();
	});
});

describe("ACTION_ERROR_TRANSLATION_KEYS", () => {
	it("maps every action error code to a translation key", () => {
		for (const key of Object.values(ACTION_ERROR_TRANSLATION_KEYS)) {
			expect(key.startsWith("actionErrors.")).toBe(true);
		}
		expect(Object.keys(ACTION_ERROR_TRANSLATION_KEYS).sort()).toEqual([
			"conflict",
			"database",
			"forbidden",
			"invalid",
			"not_found",
			"unauthorized",
		]);
	});
});
