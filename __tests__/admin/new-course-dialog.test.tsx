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
}));

vi.mock("@/i18n/navigation", () => ({
	useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("sonner", () => ({
	toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

// The related-resources picker queries Supabase itself; it is not what this
// test is about.
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

beforeEach(() => {
	vi.clearAllMocks();
});

describe("NewCourseDialog — admin course creation", () => {
	it("asks for every course detail before the course exists", () => {
		render(
			withProviders(
				<NewCourseDialog open onOpenChange={vi.fn()} basePath="/d/admin" />
			)
		);

		// Base details
		expect(screen.getByText("عنوان کورس")).toBeInTheDocument();
		// The extra section added for "full course details"
		expect(screen.getByText("جزئیات بیشتر کورس")).toBeInTheDocument();
		expect(screen.getByText("اهداف یادگیری")).toBeInTheDocument();
		expect(screen.getByText("پیش‌نیازها")).toBeInTheDocument();
		expect(screen.getByText("مدت تقریبی (ساعت)")).toBeInTheDocument();
		expect(screen.getByText("ویدیوی معرفی (لینک)")).toBeInTheDocument();
		expect(screen.getByText("پیام خوش‌آمد")).toBeInTheDocument();
		expect(screen.getByText("عنوان سئو")).toBeInTheDocument();
		expect(screen.getByText("توضیح سئو")).toBeInTheDocument();
	});

	it("creates the course and opens the admin builder for it", async () => {
		mocks.createCourse.mockResolvedValue({
			success: true,
			data: { courseId: "course-1" },
		});

		render(
			withProviders(
				<NewCourseDialog open onOpenChange={vi.fn()} basePath="/d/admin" />
			)
		);

		fireEvent.change(screen.getByLabelText(/عنوان کورس/), {
			target: { value: "آموزش Next.js" },
		});
		fireEvent.change(screen.getByLabelText("اهداف یادگیری"), {
			target: { value: "- ساخت اپ Next.js\n- مسیریابی" },
		});
		fireEvent.change(screen.getByLabelText("مدت تقریبی (ساعت)"), {
			target: { value: "8" },
		});

		fireEvent.click(screen.getByRole("button", { name: "ایجاد و ساخت" }));

		await waitFor(() => expect(mocks.createCourse).toHaveBeenCalledTimes(1));
		expect(mocks.createCourse).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "آموزش Next.js",
				learning_objectives: "- ساخت اپ Next.js\n- مسیریابی",
				estimated_duration_hours: "8",
			}),
			undefined
		);

		// This URL is the whole point of the admin route added alongside: it must
		// land in the builder, not on a 404.
		await waitFor(() =>
			expect(mocks.push).toHaveBeenCalledWith("/d/admin/courses/new/course-1")
		);
	});

	it("does not submit without a title", async () => {
		render(
			withProviders(
				<NewCourseDialog open onOpenChange={vi.fn()} basePath="/d/admin" />
			)
		);

		const submit = screen.getByRole("button", { name: "ایجاد و ساخت" });
		expect(submit).toBeDisabled();
		fireEvent.click(submit);
		expect(mocks.createCourse).not.toHaveBeenCalled();
	});
});
