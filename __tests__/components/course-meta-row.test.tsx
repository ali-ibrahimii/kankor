import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { CourseMetaRow } from "@/components/blocks/course/course-card";
import faMessages from "@/messages/fa.json";

// The card links through the locale-aware next-intl router, which vitest
// cannot resolve on its own.
vi.mock("@/i18n/navigation", () => ({
	Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	useRouter: () => ({ push: vi.fn() }),
	usePathname: () => "/",
}));

const renderRow = (props: Parameters<typeof CourseMetaRow>[0], locale = "fa") =>
	render(
		<NextIntlClientProvider locale={locale} messages={faMessages}>
			<CourseMetaRow {...props} />
		</NextIntlClientProvider>
	);

describe("CourseMetaRow", () => {
	it("prints lessons, lesson time and student count with labels", () => {
		renderRow({
			totalLessons: 12,
			durationMinutes: 185,
			enrollments: 24,
			rating: 4.6,
		});

		expect(screen.getByText("۱۲ درس")).toBeInTheDocument();
		expect(screen.getByText("۳ ساعت و ۵ دقیقه")).toBeInTheDocument();
		expect(screen.getByText("۲۴ شاگرد")).toBeInTheDocument();
		expect(screen.getByText("4.6")).toBeInTheDocument();
	});

	it("shows whole hours when the lessons have no spare minutes", () => {
		renderRow({ durationMinutes: 120 });
		expect(screen.getByText("۲ ساعت")).toBeInTheDocument();
	});

	it("shows minutes only for a short course", () => {
		renderRow({ durationMinutes: 45 });
		expect(screen.getByText("۴۵ دقیقه")).toBeInTheDocument();
	});

	it("prefers the summed lesson time over the manual hour estimate", () => {
		renderRow({ durationHours: 8, durationMinutes: 185 });
		expect(screen.getByText("۳ ساعت و ۵ دقیقه")).toBeInTheDocument();
		expect(screen.queryByText("۸ ساعت")).not.toBeInTheDocument();
	});

	it("falls back to the hour estimate when lessons were never timed", () => {
		renderRow({ durationHours: 8 });
		expect(screen.getByText("۸ ساعت")).toBeInTheDocument();
	});

	it("renders nothing at all for a course with no numbers yet", () => {
		const { container } = renderRow({
			totalLessons: 0,
			durationMinutes: 0,
			enrollments: 0,
			rating: 0,
		});
		expect(container).toBeEmptyDOMElement();
	});
});
