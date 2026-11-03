import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/security/redirect";

describe("safeNextPath", () => {
	it("keeps legitimate in-app paths, including query and hash", () => {
		expect(safeNextPath("/fa/d/courses/math")).toBe("/fa/d/courses/math");
		expect(safeNextPath("/en/decks?page=2#top")).toBe("/en/decks?page=2#top");
		expect(safeNextPath("  /fa/d  ")).toBe("/fa/d");
	});

	it("rejects absolute URLs (open redirect)", () => {
		expect(safeNextPath("https://evil.example/steal")).toBe("/");
		expect(safeNextPath("HTTPS://evil.example")).toBe("/");
		expect(safeNextPath("javascript:alert(1)")).toBe("/");
		expect(safeNextPath("data:text/html,<script>alert(1)</script>")).toBe("/");
	});

	it("rejects protocol-relative and backslash tricks", () => {
		expect(safeNextPath("//evil.example")).toBe("/");
		expect(safeNextPath("/\\evil.example")).toBe("/");
		expect(safeNextPath("/\t/evil.example")).toBe("/");
	});

	it("falls back for empty or missing values", () => {
		expect(safeNextPath(undefined)).toBe("/");
		expect(safeNextPath(null)).toBe("/");
		expect(safeNextPath("")).toBe("/");
		expect(safeNextPath("   ")).toBe("/");
	});

	it("honours a custom fallback", () => {
		expect(safeNextPath("https://evil.example", "")).toBe("");
		expect(safeNextPath(undefined, "/fa/d")).toBe("/fa/d");
	});
});
