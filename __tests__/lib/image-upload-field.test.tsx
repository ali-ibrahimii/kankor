import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import faMessages from "@/messages/fa.json";

const mocks = vi.hoisted(() => ({
	requestImageUpload: vi.fn(),
	finalizeImageUpload: vi.fn(),
	deleteImageAsset: vi.fn(),
	toastError: vi.fn(),
	toastSuccess: vi.fn(),
}));

vi.mock("@/lib/r2/image-actions", () => ({
	requestImageUpload: mocks.requestImageUpload,
	finalizeImageUpload: mocks.finalizeImageUpload,
	deleteImageAsset: mocks.deleteImageAsset,
}));

vi.mock("sonner", () => ({
	toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

// jsdom has no XMLHttpRequest upload events worth driving; the widget only
// needs the PUT to resolve.
class FakeXHR {
	upload: Record<string, unknown> = {};
	status = 200;
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	open() {}
	setRequestHeader() {}
	send() {
		this.onload?.();
	}
}

import { ImageUploadField } from "@/components/blocks/shared/image-upload-field";

const withIntl = (node: ReactNode) => (
	<NextIntlClientProvider locale="fa" messages={faMessages}>
		{node}
	</NextIntlClientProvider>
);

function dropFile(container: HTMLElement, file: File) {
	const dropzone = container.querySelector('[data-slot="dropzone"]');
	if (!dropzone) throw new Error("dropzone not rendered");
	fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal("XMLHttpRequest", FakeXHR);
});

describe("ImageUploadField", () => {
	it("shows the Cloudflare hint and the empty state", () => {
		render(
			withIntl(
				<ImageUploadField scope="course" ownerId="c1" onUploaded={vi.fn()} />
			)
		);
		expect(
			screen.getByText("برای بارگذاری تصویر کلیک کن یا فایل را اینجا رها کن")
		).toBeInTheDocument();
		expect(screen.getByText("ذخیره‌شده در Cloudflare R2")).toBeInTheDocument();
		expect(screen.queryByText("حذف تصویر")).not.toBeInTheDocument();
	});

	it("rejects a non-image file before ever calling the server", async () => {
		const { container } = render(
			withIntl(
				<ImageUploadField scope="course" ownerId="c1" onUploaded={vi.fn()} />
			)
		);
		const pdf = new File(["x"], "notes.pdf", { type: "application/pdf" });
		dropFile(container, pdf);

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				"این نوع فایل پشتیبانی نمی‌شود"
			)
		);
		expect(mocks.requestImageUpload).not.toHaveBeenCalled();
	});

	it("uploads through R2 and reports the published URL", async () => {
		mocks.requestImageUpload.mockResolvedValue({
			success: true,
			data: {
				assetId: "a1",
				uploadUrl: "https://r2.example/put",
				storageKey: "k",
			},
		});
		mocks.finalizeImageUpload.mockResolvedValue({
			success: true,
			data: {
				url: "https://img.abzarkankor.com/courses/c1/cover/a-cover.png",
				storageKey: "k",
				assetId: "a1",
			},
		});

		const onUploaded = vi.fn();
		const { container } = render(
			withIntl(
				<ImageUploadField scope="course" ownerId="c1" onUploaded={onUploaded} />
			)
		);

		const image = new File(["x"], "cover.png", { type: "image/png" });
		dropFile(container, image);

		await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
		expect(mocks.requestImageUpload).toHaveBeenCalledWith(
			expect.objectContaining({
				scope: "course",
				ownerId: "c1",
				variant: "cover",
				mimeType: "image/png",
			})
		);
		expect(mocks.finalizeImageUpload).toHaveBeenCalledWith("a1", "cover");
		expect(mocks.toastSuccess).toHaveBeenCalledWith(
			"تصویر در Cloudflare ذخیره شد"
		);
		// The image is now removable.
		expect(screen.getByText("حذف تصویر")).toBeInTheDocument();
	});

	it("surfaces a server rejection without publishing anything", async () => {
		mocks.requestImageUpload.mockResolvedValue({
			success: false,
			error: "Not authorized to upload images for this course or school.",
		});

		const onUploaded = vi.fn();
		const { container } = render(
			withIntl(
				<ImageUploadField scope="school" ownerId="s1" onUploaded={onUploaded} />
			)
		);

		dropFile(container, new File(["x"], "logo.png", { type: "image/png" }));

		// The raw server text is kept out of the UI — the user gets the
		// localized failure message instead.
		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith("بارگذاری تصویر ناکام شد")
		);
		expect(mocks.toastError).not.toHaveBeenCalledWith(
			"Not authorized to upload images for this course or school."
		);
		expect(mocks.finalizeImageUpload).not.toHaveBeenCalled();
		expect(onUploaded).not.toHaveBeenCalled();
	});

	it("explains an unconfigured image storage in the user's language", async () => {
		mocks.requestImageUpload.mockResolvedValue({
			success: false,
			error:
				"Image storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.",
			code: "not_configured",
		});

		const onUploaded = vi.fn();
		const { container } = render(
			withIntl(
				<ImageUploadField scope="school" ownerId="s1" onUploaded={onUploaded} />
			)
		);

		dropFile(container, new File(["x"], "logo.png", { type: "image/png" }));

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				"ذخیرهٔ تصویر روی سرور پیکربندی نشده است؛ آپلود تصویر در دسترس نیست."
			)
		);
		expect(mocks.toastError).not.toHaveBeenCalledWith(
			expect.stringContaining("R2_ACCOUNT_ID")
		);
		expect(onUploaded).not.toHaveBeenCalled();
	});

	it("explains a permission denial in the user's language", async () => {
		mocks.requestImageUpload.mockResolvedValue({
			success: false,
			error: "Not authorized to upload images for this course or school.",
			code: "not_authorized",
		});

		const onUploaded = vi.fn();
		const { container } = render(
			withIntl(
				<ImageUploadField scope="course" ownerId="c1" onUploaded={onUploaded} />
			)
		);

		dropFile(container, new File(["x"], "cover.png", { type: "image/png" }));

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				"شما اجازهٔ آپلود تصویر برای این کورس یا مدرسه را ندارید."
			)
		);
		expect(mocks.toastError).not.toHaveBeenCalledWith(
			"Not authorized to upload images for this course or school."
		);
		expect(onUploaded).not.toHaveBeenCalled();
	});

	it("distinguishes a failed permission check from a denial", async () => {
		mocks.requestImageUpload.mockResolvedValue({
			success: false,
			error: "Could not verify image upload permission.",
			code: "permission_check_failed",
		});

		const onUploaded = vi.fn();
		const { container } = render(
			withIntl(
				<ImageUploadField scope="course" ownerId="c1" onUploaded={onUploaded} />
			)
		);

		dropFile(container, new File(["x"], "cover.png", { type: "image/png" }));

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				"بررسی مجوز آپلود تصویر ناموفق بود؛ لطفاً دوباره تلاش کنید."
			)
		);
		expect(onUploaded).not.toHaveBeenCalled();
	});

	it("renders previews from hosts outside the next/image allowlist without crashing", () => {
		// Cover URLs can be external (or the config can lag behind a changed
		// env): next/image throws for those hosts, so the field must fall back
		// to a plain <img> instead of taking the dialog down.
		const onUploaded = vi.fn();
		const { container } = render(
			withIntl(
				<ImageUploadField
					scope="course"
					ownerId="c1"
					value="https://unknown-host.example/cover.jpg"
					onUploaded={onUploaded}
				/>
			)
		);

		const img = container.querySelector(
			'img[src="https://unknown-host.example/cover.jpg"]'
		);
		expect(img).not.toBeNull();
		expect(img?.getAttribute("srcset")).toBeNull();
	});

	it("localizes a failed upload-record creation", async () => {
		mocks.requestImageUpload.mockResolvedValue({
			success: false,
			error:
				'Could not create the upload record: relation "image_assets" does not exist (42P01)',
			code: "upload_record_failed",
		});

		const onUploaded = vi.fn();
		const { container } = render(
			withIntl(
				<ImageUploadField scope="course" ownerId="c1" onUploaded={onUploaded} />
			)
		);

		dropFile(container, new File(["x"], "cover.png", { type: "image/png" }));

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				"رکورد آپلود در دیتابیس ساخته نشد؛ لطفاً دوباره تلاش کنید."
			)
		);
		expect(mocks.toastError).not.toHaveBeenCalledWith(
			expect.stringContaining("image_assets")
		);
		expect(onUploaded).not.toHaveBeenCalled();
	});

	it("deletes the R2 object when an existing cover is removed", async () => {
		mocks.deleteImageAsset.mockResolvedValue({
			success: true,
			data: undefined,
		});
		const onRemoved = vi.fn();

		render(
			withIntl(
				<ImageUploadField
					scope="school"
					ownerId="s1"
					target="logo"
					assetId="a2"
					value="/api/media/schools/s1/logo/a-logo.png"
					onUploaded={vi.fn()}
					onRemoved={onRemoved}
				/>
			)
		);

		fireEvent.click(screen.getByText("حذف تصویر"));

		await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1));
		expect(mocks.deleteImageAsset).toHaveBeenCalledWith("a2");
		expect(mocks.toastSuccess).toHaveBeenCalledWith("تصویر حذف شد");
	});
});
