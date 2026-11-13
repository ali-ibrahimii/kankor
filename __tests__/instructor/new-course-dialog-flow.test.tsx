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
	toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

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
			error: 'duplicate key value violates unique constraint "courses_title_key"',
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
});
