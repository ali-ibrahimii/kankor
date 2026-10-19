import { describe, expect, it } from "vitest";
import {
	ASSET_LIMITS,
	buildStorageKey,
	isAllowedMimeType,
	isAllowedSize,
} from "./constants";

describe("isAllowedMimeType", () => {
	it("accepts a mime type in the kind's allowlist", () => {
		expect(isAllowedMimeType("video", "video/mp4")).toBe(true);
		expect(isAllowedMimeType("document", "application/pdf")).toBe(true);
	});

	it("rejects a mime type not in the kind's allowlist", () => {
		expect(isAllowedMimeType("video", "application/pdf")).toBe(false);
		expect(isAllowedMimeType("answer_sheet", "video/mp4")).toBe(false);
	});
});

describe("isAllowedSize", () => {
	it("accepts sizes within the kind's limit", () => {
		expect(isAllowedSize("document", 1024)).toBe(true);
		expect(isAllowedSize("document", ASSET_LIMITS.document.maxSizeBytes)).toBe(
			true
		);
	});

	it("rejects zero, negative, and over-limit sizes", () => {
		expect(isAllowedSize("document", 0)).toBe(false);
		expect(isAllowedSize("document", -1)).toBe(false);
		expect(
			isAllowedSize("document", ASSET_LIMITS.document.maxSizeBytes + 1)
		).toBe(false);
	});
});

describe("buildStorageKey", () => {
	it("namespaces the key by course and kind", () => {
		const key = buildStorageKey("course-123", "video", "lecture 1.mp4");
		expect(key.startsWith("courses/course-123/video/")).toBe(true);
		expect(key.endsWith("lecture-1.mp4")).toBe(true);
	});

	it("sanitizes unsafe characters out of the filename", () => {
		const key = buildStorageKey(
			"course-123",
			"document",
			"slides (final)!.pdf"
		);
		expect(key).not.toMatch(/[()!]/);
	});

	it("produces a unique key per call for the same filename", () => {
		const a = buildStorageKey("course-123", "audio", "intro.mp3");
		const b = buildStorageKey("course-123", "audio", "intro.mp3");
		expect(a).not.toBe(b);
	});
});
