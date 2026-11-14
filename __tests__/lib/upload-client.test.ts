import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requestImageUpload: vi.fn(),
	finalizeImageUpload: vi.fn(),
}));

vi.mock("@/lib/r2/image-actions", () => ({
	requestImageUpload: mocks.requestImageUpload,
	finalizeImageUpload: mocks.finalizeImageUpload,
}));

import {
	formatImageLimit,
	ImageUploadError,
	uploadImageFile,
	validateImageFile,
} from "@/lib/r2/upload-client";

let lastRequest: {
	method: string;
	url: string;
	headers: Record<string, string>;
} | null = null;
let requests: { method: string; url: string }[] = [];
let failuresLeft = 0;

class FakeXHR {
	upload: Record<string, unknown> = {};
	status = 200;
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	private headers: Record<string, string> = {};
	open(method: string, url: string) {
		lastRequest = { method, url, headers: this.headers };
		requests.push({ method, url });
	}
	setRequestHeader(key: string, value: string) {
		this.headers[key] = value;
		if (lastRequest) lastRequest.headers = this.headers;
	}
	send() {
		// Mimic a real upload progress tick before completion.
		(this.upload.onprogress as ((e: unknown) => void) | undefined)?.({
			lengthComputable: true,
			loaded: 100,
			total: 100,
		});
		if (failuresLeft > 0) {
			failuresLeft--;
			this.onerror?.();
			return;
		}
		this.headers = {};
		this.onload?.();
	}
}

const imageFile = (name = "cover.png", type = "image/png") =>
	new File(["binary"], name, { type });

beforeEach(() => {
	vi.clearAllMocks();
	lastRequest = null;
	requests = [];
	failuresLeft = 0;
	vi.stubGlobal("XMLHttpRequest", FakeXHR);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("validateImageFile", () => {
	it("accepts supported images", () => {
		expect(validateImageFile(imageFile())).toBeNull();
		expect(validateImageFile(imageFile("a.webp", "image/webp"))).toBeNull();
	});

	it("flags unsupported types and oversized files", () => {
		expect(validateImageFile(imageFile("a.pdf", "application/pdf"))).toBe(
			"invalidType"
		);
		const huge = new File(["x"], "big.png", { type: "image/png" });
		Object.defineProperty(huge, "size", { value: 50 * 1024 * 1024 });
		expect(validateImageFile(huge)).toBe("tooLarge");
	});

	it("describes the limit the UI shows", () => {
		expect(formatImageLimit()).toBe("8MB");
	});
});

describe("uploadImageFile", () => {
	it("runs request → PUT → finalize in order and returns the published URL", async () => {
		mocks.requestImageUpload.mockResolvedValue({
			success: true,
			data: {
				assetId: "asset-1",
				uploadUrl: "https://bucket.r2.example/put?signature=1",
				storageKey: "courses/c1/cover/uuid-cover.png",
			},
		});
		mocks.finalizeImageUpload.mockResolvedValue({
			success: true,
			data: {
				url: "https://img.abzarkankor.com/courses/c1/cover/uuid-cover.png",
				storageKey: "courses/c1/cover/uuid-cover.png",
				assetId: "asset-1",
			},
		});

		const progress: number[] = [];
		const onFinalizing = vi.fn();

		const result = await uploadImageFile({
			scope: "course",
			ownerId: "c1",
			file: imageFile(),
			onProgress: (percent) => progress.push(percent),
			onFinalizing,
		});

		expect(mocks.requestImageUpload).toHaveBeenCalledWith({
			scope: "course",
			ownerId: "c1",
			variant: "cover",
			filename: "cover.png",
			mimeType: "image/png",
			sizeBytes: 6,
		});
		expect(lastRequest?.url).toBe("https://bucket.r2.example/put?signature=1");
		expect(lastRequest?.headers["Content-Type"]).toBe("image/png");
		expect(mocks.finalizeImageUpload).toHaveBeenCalledWith("asset-1", "cover");
		expect(onFinalizing).toHaveBeenCalledTimes(1);
		expect(progress).toContain(100);
		expect(result.url).toBe(
			"https://img.abzarkankor.com/courses/c1/cover/uuid-cover.png"
		);
	});

	it("sends the logo variant under the logo target", async () => {
		mocks.requestImageUpload.mockResolvedValue({
			success: true,
			data: { assetId: "a2", uploadUrl: "https://r2/put", storageKey: "k" },
		});
		mocks.finalizeImageUpload.mockResolvedValue({
			success: true,
			data: {
				url: "/api/media/schools/s1/logo/x.png",
				storageKey: "k",
				assetId: "a2",
			},
		});

		await uploadImageFile({
			scope: "school",
			ownerId: "s1",
			file: imageFile("logo.png"),
			target: "logo",
		});

		expect(mocks.requestImageUpload).toHaveBeenCalledWith(
			expect.objectContaining({ scope: "school", variant: "logo" })
		);
		expect(mocks.finalizeImageUpload).toHaveBeenCalledWith("a2", "logo");
	});

	it("stops at the server's own rejection (no PUT attempted)", async () => {
		mocks.requestImageUpload.mockResolvedValue({
			success: false,
			error: "Image storage is not configured.",
		});

		await expect(
			uploadImageFile({ scope: "course", ownerId: "c1", file: imageFile() })
		).rejects.toThrow("Image storage is not configured.");
		expect(lastRequest).toBeNull();
		expect(mocks.finalizeImageUpload).not.toHaveBeenCalled();
	});

	it("falls back to the same-origin proxy when the direct PUT is blocked", async () => {
		failuresLeft = 1; // first send (browser→R2) fails like a CORS block
		mocks.requestImageUpload.mockResolvedValue({
			success: true,
			data: { assetId: "a3", uploadUrl: "https://r2/put", storageKey: "k" },
		});
		mocks.finalizeImageUpload.mockResolvedValue({
			success: true,
			data: {
				url: "/api/media/schools/s1/cover/x.png",
				storageKey: "k",
				assetId: "a3",
			},
		});

		const progress: number[] = [];
		const result = await uploadImageFile({
			scope: "course",
			ownerId: "c1",
			file: imageFile(),
			onProgress: (percent) => progress.push(percent),
		});

		expect(requests.map((r) => r.method)).toEqual(["PUT", "POST"]);
		expect(requests[0].url).toBe("https://r2/put");
		expect(requests[1].url).toBe("/api/image-upload");
		expect(mocks.finalizeImageUpload).toHaveBeenCalledWith("a3", "cover");
		expect(result.url).toBe("/api/media/schools/s1/cover/x.png");
		expect(progress).toContain(100);
	});

	it("fails after both the direct PUT and the proxy fail", async () => {
		failuresLeft = 2;
		mocks.requestImageUpload.mockResolvedValue({
			success: true,
			data: { assetId: "a3", uploadUrl: "https://r2/put", storageKey: "k" },
		});

		await expect(
			uploadImageFile({ scope: "course", ownerId: "c1", file: imageFile() })
		).rejects.toBeInstanceOf(ImageUploadError);
		expect(requests.map((r) => r.method)).toEqual(["PUT", "POST"]);
		expect(mocks.finalizeImageUpload).not.toHaveBeenCalled();
	});

	it("propagates a validation failure from finalize", async () => {
		mocks.requestImageUpload.mockResolvedValue({
			success: true,
			data: { assetId: "a4", uploadUrl: "https://r2/put", storageKey: "k" },
		});
		mocks.finalizeImageUpload.mockResolvedValue({
			success: false,
			error: "The uploaded image failed validation.",
		});

		await expect(
			uploadImageFile({ scope: "course", ownerId: "c1", file: imageFile() })
		).rejects.toThrow("The uploaded image failed validation.");
	});
});
