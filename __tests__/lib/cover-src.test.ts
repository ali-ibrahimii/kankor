import { afterEach, describe, expect, it, vi } from "vitest";
import {
	isNextImageSafe,
	resolveCoverSrc,
} from "@/components/blocks/course/cover.utils";

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("resolveCoverSrc — usable cover srcs", () => {
	it("accepts a same-origin media proxy URL", () => {
		expect(resolveCoverSrc("/api/media/courses/c1/cover/uuid-cover.jpg")).toBe(
			"/api/media/courses/c1/cover/uuid-cover.jpg"
		);
	});

	it("keeps local public images working", () => {
		expect(resolveCoverSrc("/images/cards/subject-math.jpg")).toBe(
			"/images/cards/subject-math.jpg"
		);
	});

	it("accepts the configured R2 public host", () => {
		vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_HOSTNAME", "img.abzarkankor.com");
		const url = "https://img.abzarkankor.com/courses/c1/cover/uuid-cover.jpg";
		expect(resolveCoverSrc(url)).toBe(url);
	});

	it("accepts any valid https URL so covers never fall back to substitutes", () => {
		// Foreign hosts render through CoverFillImage's plain-<img> fallback;
		// they must still resolve so the uploaded cover is what the user sees.
		const url = "https://storage.abzarkankor.com/courses/c1/cover/x.jpg";
		expect(resolveCoverSrc(url)).toBe(url);
		expect(
			resolveCoverSrc("https://pub-abc123.r2.dev/schools/s1/logo/x.png")
		).toBe("https://pub-abc123.r2.dev/schools/s1/logo/x.png");
	});

	it("rejects empty, malformed and non-http(s) sources", () => {
		expect(resolveCoverSrc(null)).toBeNull();
		expect(resolveCoverSrc("")).toBeNull();
		expect(resolveCoverSrc("   ")).toBeNull();
		expect(resolveCoverSrc("not a url")).toBeNull();
		expect(resolveCoverSrc("data:image/png;base64,AAAA")).toBeNull();
		expect(resolveCoverSrc("javascript:alert(1)")).toBeNull();
	});
});

describe("isNextImageSafe — next/image allowlist mirror", () => {
	it("treats local paths as safe", () => {
		expect(isNextImageSafe("/api/media/courses/c1/cover/x.jpg")).toBe(true);
		expect(isNextImageSafe("/images/cards/subject-math.jpg")).toBe(true);
	});

	it("accepts the configured R2 public host and its subdomains", () => {
		vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_HOSTNAME", "storage.abzarkankor.com");
		expect(isNextImageSafe("https://storage.abzarkankor.com/c.jpg")).toBe(true);
		expect(isNextImageSafe("https://img.storage.abzarkankor.com/c.jpg")).toBe(
			true
		);
		expect(
			isNextImageSafe("https://evil-storage.abzarkankor.com.evil.com/c.jpg")
		).toBe(false);
	});

	it("accepts hosts configured via NEXT_PUBLIC_IMAGE_REMOTE_PATTERNS", () => {
		vi.stubEnv("NEXT_PUBLIC_IMAGE_REMOTE_PATTERNS", "img.example.com/media/*");
		expect(isNextImageSafe("https://img.example.com/media/a.png")).toBe(true);
		expect(isNextImageSafe("https://img.example.com/other/a.png")).toBe(false);
	});

	it("rejects foreign and unusable hosts — those render via the plain <img> fallback", () => {
		expect(isNextImageSafe("https://evil.example.com/a.jpg")).toBe(false);
		expect(isNextImageSafe("blob:http://localhost:3000/uuid")).toBe(false);
		expect(isNextImageSafe("data:image/png;base64,AAAA")).toBe(false);
		expect(isNextImageSafe(null)).toBe(false);
		expect(isNextImageSafe("")).toBe(false);
	});
});
