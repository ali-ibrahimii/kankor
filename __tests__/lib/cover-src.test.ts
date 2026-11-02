import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveCoverSrc } from "@/components/blocks/course/cover.utils";

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("resolveCoverSrc — Cloudflare covers", () => {
	it("accepts a same-origin media proxy URL", () => {
		expect(resolveCoverSrc("/api/media/courses/c1/cover/uuid-cover.jpg")).toBe(
			"/api/media/courses/c1/cover/uuid-cover.jpg"
		);
	});

	it("accepts the configured R2 public host", () => {
		vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_HOSTNAME", "img.abzarkankor.com");
		const url = "https://img.abzarkankor.com/courses/c1/cover/uuid-cover.jpg";
		expect(resolveCoverSrc(url)).toBe(url);
	});

	it("accepts the default r2.dev development host", () => {
		const url = "https://pub-abc123.r2.dev/schools/s1/logo/uuid-logo.png";
		expect(resolveCoverSrc(url)).toBe(url);
	});

	it("keeps local public images working", () => {
		expect(resolveCoverSrc("/images/cards/subject-math.jpg")).toBe(
			"/images/cards/subject-math.jpg"
		);
	});

	it("still rejects hosts next/image cannot load", () => {
		expect(resolveCoverSrc("https://placehold.co/600x400.png")).toBeNull();
		expect(resolveCoverSrc("https://evil.example.com/a.jpg")).toBeNull();
		expect(resolveCoverSrc(null)).toBeNull();
		expect(resolveCoverSrc("")).toBeNull();
	});

	it("does not accept another r2.dev bucket when that is not the configured host", () => {
		vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_HOSTNAME", "img.abzarkankor.com");
		// r2.dev is always allowed (it is R2's own public host), so this is the
		// one hostname family that passes regardless of configuration.
		expect(resolveCoverSrc("https://pub-other.r2.dev/x.png")).toBe(
			"https://pub-other.r2.dev/x.png"
		);
	});
});
