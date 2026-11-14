import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import faMessages from "@/messages/fa.json";

const mocks = vi.hoisted(() => ({
	createCourse: vi.fn(),
	updateCourse: vi.fn(),
	getCourseForEdit: vi.fn(),
	push: vi.fn(),
	refresh: vi.fn(),
	toastError: vi.fn(),
	toastSuccess: vi.fn(),
	toastWarning: vi.fn(),
	uploadImageFile: vi.fn(),
}));

vi.mock("@/components/blocks/course-builder/actions", () => ({
	createCourse: mocks.createCourse,
	updateCourse: mocks.updateCourse,
	getCourseForEdit: mocks.getCourseForEdit,
	setCoursePublished: vi.fn(),
	deleteCourse: vi.fn(),
	loadCourseContent: vi.fn(),
	saveCourseContent: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
	useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("sonner", () => ({
	toast: {
		error: mocks.toastError,
		success: mocks.toastSuccess,
		warning: mocks.toastWarning,
	},
}));

vi.mock("@/lib/r2/upload-client", () => {
	class ImageUploadError extends Error {
		readonly code?: "not_configured";

		constructor(message: string, code?: "not_configured") {
			super(message);
			this.name = "ImageUploadError";
			this.code = code;
		}
	}
	return {
		ImageUploadError,
		uploadImageFile: mocks.uploadImageFile,
		validateImageFile: () => null,
		formatImageLimit: () => "5MB",
	};
});

vi.mock("@/components/blocks/RelatedResourcesSelector", () => ({
	RelatedResourcesSelector: ({ label }: { label: string }) => (
		<div>{label}</div>
	),
}));

// Empty option lists are enough — the selects render with "None".
vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({
		from: () => ({
			select: () => ({
				order: async () => ({ data: [], error: null }),
			}),
		}),
	}),
}));

const { NewCourseDialog } = await import(
	"@/components/blocks/course-builder/new-course-dialog"
);

const withProviders = (node: ReactNode) => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return (
		<QueryClientProvider client={client}>
			<NextIntlClientProvider locale="fa" messages={faMessages}>
				{node}
			</NextIntlClientProvider>
		</QueryClientProvider>
	);
};

/** Fill in the only required field and return the submit button. */
function fillTitle(title = "آموزش Next.js") {
	fireEvent.change(screen.getByLabelText(/عنوان کورس/), {
		target: { value: title },
	});
	return screen.getByRole("button", { name: "ایجاد و ساخت" });
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("NewCourseDialog — instructor create-course flow", () => {
	it("does not silently create a free course when a paid price is missing", async () => {
		render(
			withProviders(
				<NewCourseDialog open onOpenChange={vi.fn()} basePath="/d/instructor" />
			)
		);

		// Switch #2 (after the visibility switch) is the free/paid toggle.
		fireEvent.click(screen.getAllByRole("switch")[1]);

		const submit = fillTitle();
		fireEvent.click(submit);

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				"برای کورس پولی، قیمت را وارد کنید."
			)
		);
		expect(mocks.createCourse).not.toHaveBeenCalled();
	});

	it("rejects a malformed promo video URL before creating", async () => {
		render(
			withProviders(
				<NewCourseDialog open onOpenChange={vi.fn()} basePath="/d/instructor" />
			)
		);

		fireEvent.change(screen.getByLabelText(/ویدیوی معرفی/), {
			target: { value: "not-a-url" },
		});
		fireEvent.click(fillTitle());

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				"لینک ویدیوی معرفی معتبر نیست."
			)
		);
		expect(mocks.createCourse).not.toHaveBeenCalled();
	});

	it("translates server failures instead of showing raw database text", async () => {
		mocks.createCourse.mockResolvedValue({
			success: false,
			error:
				'duplicate key value violates unique constraint "courses_title_key"',
			code: "conflict",
		});

		render(
			withProviders(
				<NewCourseDialog open onOpenChange={vi.fn()} basePath="/d/instructor" />
			)
		);

		fireEvent.click(fillTitle());

		await waitFor(() => expect(mocks.createCourse).toHaveBeenCalledTimes(1));
		expect(mocks.toastError).toHaveBeenCalledWith(
			"رکوردی با این مشخصات از قبل وجود دارد."
		);
	});

	it("starts from a clean form when the dialog is reopened", async () => {
		const { rerender } = render(
			withProviders(
				<NewCourseDialog open onOpenChange={vi.fn()} basePath="/d/instructor" />
			)
		);

		fireEvent.change(screen.getByLabelText(/عنوان کورس/), {
			target: { value: "کورس نیمه‌کاره" },
		});

		rerender(
			withProviders(
				<NewCourseDialog
					open={false}
					onOpenChange={vi.fn()}
					basePath="/d/instructor"
				/>
			)
		);
		rerender(
			withProviders(
				<NewCourseDialog open onOpenChange={vi.fn()} basePath="/d/instructor" />
			)
		);

		expect(screen.getByLabelText(/عنوان کورس/)).toHaveValue("");
	});

	it("creates the course and opens the instructor builder for it", async () => {
		mocks.createCourse.mockResolvedValue({
			success: true,
			data: { courseId: "course-1" },
		});

		render(
			withProviders(
				<NewCourseDialog open onOpenChange={vi.fn()} basePath="/d/instructor" />
			)
		);

		fireEvent.click(fillTitle("آموزش React"));

		await waitFor(() => expect(mocks.createCourse).toHaveBeenCalledTimes(1));
		await waitFor(() =>
			expect(mocks.push).toHaveBeenCalledWith(
				"/d/instructor/courses/new/course-1"
			)
		);
	});

	it("reports an unconfigured cover upload in Persian, not raw env text", async () => {
		mocks.createCourse.mockResolvedValue({
			success: true,
			data: { courseId: "course-1" },
		});
		const { ImageUploadError } = await import("@/lib/r2/upload-client");
		mocks.uploadImageFile.mockRejectedValue(
			new ImageUploadError(
				"Image storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.",
				"not_configured"
			)
		);

		render(
			withProviders(
				<NewCourseDialog open onOpenChange={vi.fn()} basePath="/d/instructor" />
			)
		);

		// Radix Dialog portals to document.body — query the document, not the
		// render container.
		const fileInput = document.querySelector('input[type="file"]');
		expect(fileInput).not.toBeNull();
		fireEvent.change(fileInput as HTMLInputElement, {
			target: {
				files: [new File(["img"], "cover.png", { type: "image/png" })],
			},
		});

		fireEvent.click(fillTitle("کورس با کاور"));

		await waitFor(() => expect(mocks.uploadImageFile).toHaveBeenCalledTimes(1));
		await waitFor(() =>
			expect(mocks.toastWarning).toHaveBeenCalledWith(
				"آپلود کاور در دسترس نیست؛ ذخیرهٔ تصویر روی سرور پیکربندی نشده است. کورس بدون کاور ساخته شد."
			)
		);
		expect(mocks.toastError).not.toHaveBeenCalled();
		// The course is already saved — the builder still opens.
		await waitFor(() =>
			expect(mocks.push).toHaveBeenCalledWith(
				"/d/instructor/courses/new/course-1"
			)
		);
	});

	it("translates generic cover upload failures instead of leaking server text", async () => {
		mocks.createCourse.mockResolvedValue({
			success: true,
			data: { courseId: "course-1" },
		});
		const { ImageUploadError } = await import("@/lib/r2/upload-client");
		mocks.uploadImageFile.mockRejectedValue(
			new ImageUploadError("Upload failed (500)")
		);

		render(
			withProviders(
				<NewCourseDialog open onOpenChange={vi.fn()} basePath="/d/instructor" />
			)
		);

		const fileInput = document.querySelector('input[type="file"]');
		fireEvent.change(fileInput as HTMLInputElement, {
			target: {
				files: [new File(["img"], "cover.jpg", { type: "image/jpeg" })],
			},
		});

		fireEvent.click(fillTitle("کورس دیگر"));

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				"کورس ساخته شد ولی بارگذاری تصویر ناکام شد — از صفحهٔ ویرایش دوباره تلاش کن"
			)
		);
		expect(mocks.toastError).not.toHaveBeenCalledWith("Upload failed (500)");
	});
});
