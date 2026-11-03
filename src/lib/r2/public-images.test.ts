import { afterEach, describe, expect, it, vi } from "vitest";
import {
	buildImageKey,
	IMAGE_LIMITS,
	isAllowedImageMimeType,
	isAllowedImageSize,
	isImageScope,
	isOwnImageUrl,
	publicImageUrl,
} from "./public-images";

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("image allowlist", () => {
	it("accepts the formats the pipeline stores", () => {
		for (const type of [
			"image/jpeg",
			"image/png",
			"image/webp",
			"image/avif",
		]) {
			expect(isAllowedImageMimeType(type)).toBe(true);
		}
	});

	it("rejects SVG, PDFs and non-images", () => {
		expect(isAllowedImageMimeType("image/svg+xml")).toBe(false);
		expect(isAllowedImageMimeType("application/pdf")).toBe(false);
		expect(isAllowedImageMimeType("video/mp4")).toBe(false);
	});

	it("enforces the size ceiling", () => {
		expect(isAllowedImageSize(1024)).toBe(true);
		expect(isAllowedImageSize(IMAGE_LIMITS.maxSizeBytes)).toBe(true);
		expect(isAllowedImageSize(IMAGE_LIMITS.maxSizeBytes + 1)).toBe(false);
		expect(isAllowedImageSize(0)).toBe(false);
		expect(isAllowedImageSize(-5)).toBe(false);
	});

	it("only knows the three image scopes", () => {
		expect(isImageScope("course")).toBe(true);
		expect(isImageScope("school")).toBe(true);
		expect(isImageScope("video")).toBe(false);
	});
});

describe("buildImageKey", () => {
	it("namespaces covers by scope, owner and variant", () => {
		const key = buildImageKey({
			scope: "course",
			ownerId: "course-1",
			filename: "my cover (1).png",
		});
		expect(key.startsWith("courses/course-1/cover/")).toBe(true);
		expect(key).toMatch(/[\w-]{36}-my-cover--1-.png$/);
	});

	it("keeps school logos apart from covers", () => {
		const logo = buildImageKey({
			scope: "school",
			ownerId: "school-9",
			filename: "logo.png",
			variant: "logo",
		});
		expect(logo.startsWith("schools/school-9/logo/")).toBe(true);
	});

	it("produces a unique key per upload of the same file", () => {
		const one = buildImageKey({
			scope: "profile",
			ownerId: "user-1",
			filename: "me.jpg",
		});
		const two = buildImageKey({
			scope: "profile",
			ownerId: "user-1",
			filename: "me.jpg",
		});
		expect(one).not.toBe(two);
	});
});

describe("publicImageUrl", () => {
	it("falls back to the same-origin media route when no public host is set", () => {
		vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_HOSTNAME", "");
		expect(publicImageUrl("courses/c1/cover/a-cover.png")).toBe(
			"/api/media/courses/c1/cover/a-cover.png"
		);
	});

	it("uses the Cloudflare public host when one is configured", () => {
		vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_HOSTNAME", "img.abzarkankor.com");
		expect(publicImageUrl("courses/c1/cover/a-cover.png")).toBe(
			"https://img.abzarkankor.com/courses/c1/cover/a-cover.png"
		);
	});

	it("tolerates a scheme in the configured host", () => {
		vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_HOSTNAME", "https://pub-123.r2.dev/");
		expect(publicImageUrl("avatars/u1/me.png")).toBe(
			"https://pub-123.r2.dev/avatars/u1/me.png"
		);
	});

	it("returns null for a missing key and passes absolute URLs through", () => {
		expect(publicImageUrl(null)).toBeNull();
		expect(publicImageUrl("")).toBeNull();
		expect(publicImageUrl("https://cdn.example.com/a.png")).toBe(
			"https://cdn.example.com/a.png"
		);
	});

	it("recognises its own URLs", () => {
		vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_HOSTNAME", "img.abzarkankor.com");
		expect(isOwnImageUrl("/api/media/courses/c1/cover/a.png")).toBe(true);
		expect(
			isOwnImageUrl("https://img.abzarkankor.com/courses/c1/cover/a.png")
		).toBe(true);
		expect(isOwnImageUrl("https://storage.googleapis.com/x/a.png")).toBe(false);
	});
});
