import { describe, expect, it } from "vitest";
import { generateNumeric, getSlugOrIdColumn, isUuid } from "./utils";

describe("UUID Identification Utilities", () => {
	it("correctly identifies valid Supabase UUID strings", () => {
		expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
		expect(isUuid("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")).toBe(true);
		expect(getSlugOrIdColumn("123e4567-e89b-12d3-a456-426614174000")).toBe(
			"id"
		);
	});

	it("returns false and 'slug' column for non-UUID slug strings", () => {
		expect(isUuid("kankor-math-course")).toBe(false);
		expect(isUuid("123456")).toBe(false);
		expect(getSlugOrIdColumn("kankor-math-course")).toBe("slug");
	});
});

describe("generateNumeric Utility", () => {
	it("should return a 6-character string by default", () => {
		const code = generateNumeric();
		expect(code).toHaveLength(6);
	});

	it("should return correct length when custom length is provided", () => {
		expect(generateNumeric(4)).toHaveLength(4);
		expect(generateNumeric(10)).toHaveLength(10);
	});

	it("should contain only numeric digits", () => {
		const code = generateNumeric();
		expect(/^\d+$/.test(code)).toBe(true);
		expect(/^\d{8}$/.test(generateNumeric(8))).toBe(true);
	});

	it("should generate random codes that are likely different across calls", () => {
		const codes = new Set<string>();
		for (let i = 0; i < 100; i++) {
			codes.add(generateNumeric(6));
		}
		expect(codes.size).toBe(100);
	});

	it("should generate digits that can be repeated", () => {
		const code = generateNumeric(6);
		expect(typeof code).toBe("string");
		expect(code).toMatch(/^\d{6}$/);
	});
});
