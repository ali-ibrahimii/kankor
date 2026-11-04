import { describe, expect, it } from "vitest";
import { isRealSupabaseUrl } from "./client-env";

describe("isRealSupabaseUrl", () => {
	it("accepts a real https Supabase project URL", () => {
		expect(isRealSupabaseUrl("https://abcdefgh.supabase.co")).toBe(true);
		expect(isRealSupabaseUrl("https://abc.supabase.co/rest/v1")).toBe(true);
	});

	it("rejects the inert demo placeholder", () => {
		expect(isRealSupabaseUrl("https://demo.invalid")).toBe(false);
	});

	it("rejects the example placeholder", () => {
		expect(isRealSupabaseUrl("https://example.invalid")).toBe(false);
	});

	it("rejects an empty or missing URL", () => {
		expect(isRealSupabaseUrl("")).toBe(false);
		expect(isRealSupabaseUrl(undefined)).toBe(false);
	});

	it("rejects a URL without a protocol", () => {
		expect(isRealSupabaseUrl("abcdefgh.supabase.co")).toBe(false);
	});

	it("rejects a non-http protocol", () => {
		expect(isRealSupabaseUrl("ftp://abcdefgh.supabase.co")).toBe(false);
		expect(isRealSupabaseUrl("file:///tmp/supabase")).toBe(false);
	});

	it("rejects a placeholder that merely contains the word invalid", () => {
		expect(isRealSupabaseUrl("https://not-invalid.supabase.co")).toBe(true);
	});
});
