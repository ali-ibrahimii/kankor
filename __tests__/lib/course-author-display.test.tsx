import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import {
	markPlatformAuthors as mark,
	markPlatformAuthors,
} from "@/components/blocks/course/course-author";
import type { CourseMeta } from "@/components/blocks/course/course-card";
import faMessages from "@/messages/fa.json";

vi.mock("@/i18n/navigation", () => ({
	Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
	useRouter: () => ({ push: vi.fn() }),
	usePathname: () => "/",
}));

vi.mock("next/image", () => ({
	default: (props: Record<string, unknown>) => {
		const { src, alt } = props as { src: string; alt: string };
		// biome-ignore lint/a11y/useAltText: test double for next/image
		return <img src={String(src)} alt={alt} />;
	},
}));

const { AdminCourseCard } = await import(
	"@/components/blocks/course/course-card"
);

const course = (overrides: Partial<CourseMeta> = {}): CourseMeta =>
	({
		id: "course-1",
		title: "آموزش Next.js",
		slug: "nextjs",
		cover_image_url: null,
		level: "beginner",
		language: "en",
		is_free: true,
		price_credits: 0,
		is_published: false,
		average_rating: 0,
		instructor_id: "author-1",
		instructor: { full_name: "Ali Ebrahimi", avatar_url: null },
		subject: { name: "کمپیوتر" },
		...overrides,
	}) as unknown as CourseMeta;

const renderCard = (cardCourse: CourseMeta) =>
	render(
		<NextIntlClientProvider locale="fa" messages={faMessages}>
			<AdminCourseCard
				course={cardCourse}
				href="/d/admin/courses/new/course-1"
			/>
		</NextIntlClientProvider>
	);

describe("markPlatformAuthors", () => {
	it("flags courses whose author is an admin", () => {
		const [flagged] = mark([course()], new Set(["author-1"]));
		expect(flagged.instructor?.is_platform).toBe(true);
	});

	it("leaves instructor-authored courses alone", () => {
		const [untouched] = markPlatformAuthors(
			[course({ instructor_id: "instructor-9" })],
			new Set(["author-1"])
		);
		expect(untouched.instructor?.is_platform).toBeUndefined();
		expect(untouched.instructor?.full_name).toBe("Ali Ebrahimi");
	});

	it("returns the same cards when there is nothing to flag", () => {
		const courses = [course()];
		expect(markPlatformAuthors(courses, new Set())).toEqual(courses);
	});
});

describe("AdminCourseCard byline", () => {
	it("shows the platform name instead of the admin's own name", () => {
		renderCard(markPlatformAuthors([course()], new Set(["author-1"]))[0]);

		expect(screen.getByText("ابزار کانکور")).toBeInTheDocument();
		expect(screen.queryByText("Ali Ebrahimi")).not.toBeInTheDocument();
	});

	it("still shows a real instructor's name", () => {
		renderCard(
			course({
				instructor_id: "instructor-9",
				instructor: { full_name: "علی رسولی", avatar_url: null },
			})
		);

		expect(screen.getByText("علی رسولی")).toBeInTheDocument();
		expect(screen.queryByText("ابزار کانکور")).not.toBeInTheDocument();
	});
});
