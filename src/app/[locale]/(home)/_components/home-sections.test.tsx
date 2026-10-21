import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoursesMegaMenu } from "@/components/blocks/navbar/courses-mega-menu";
import { GlobalSearch } from "@/components/blocks/navbar/global-search";
import fa from "@/messages/fa.json";
import {
	HomeCourseCard,
	HomeFlashcardDeckCard,
	HomeGeneralBookCard,
	HomeKankorFormCard,
	HomeSchoolBookCard,
} from "./home-cards";
import { getHomeCatalogData } from "./home-catalog-data";
import { HorizontalCardSection } from "./horizontal-card-section";
import { PartnerInstitutionsSection } from "./partner-institutions-section";

const pushMock = vi.fn();

vi.mock("@/i18n/navigation", () => ({
	Link: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
	usePathname: () => "/",
	useRouter: () => ({ push: pushMock }),
}));

function renderFa(ui: ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<NextIntlClientProvider locale="fa" messages={fa}>
				{ui}
			</NextIntlClientProvider>
		</QueryClientProvider>
	);
}

describe("Home Page Distinct Cards, Shelves, Partner Institutions & School Navbar", () => {
	beforeEach(() => {
		pushMock.mockReset();
		if (typeof globalThis.ResizeObserver === "undefined") {
			globalThis.ResizeObserver = class ResizeObserver {
				observe() {}
				unobserve() {}
				disconnect() {}
			};
		}
	});

	it("renders HorizontalCardSection with only 'دیدن بیشتر' and no prev/next buttons", () => {
		renderFa(
			<HorizontalCardSection
				id="school-courses"
				title="درس‌های مکتب"
				subtitle="مضامین دوره لیسه"
				viewMoreHref="/courses"
				viewMoreLabel="دیدن بیشتر"
			>
				<div>کارت ریاضی</div>
			</HorizontalCardSection>
		);

		expect(screen.getByText("درس‌های مکتب")).toBeTruthy();
		const viewMoreLink = screen.getByRole("link", { name: /دیدن بیشتر/ });
		expect(viewMoreLink.getAttribute("href")).toBe("/courses");
		expect(screen.queryByRole("button", { name: "بعدی" })).toBeNull();
		expect(screen.queryByRole("button", { name: "قبلی" })).toBeNull();
	});

	it("renders distinct card variants with user ratings, top free badge, and flashcard category in footer", async () => {
		const data = await getHomeCatalogData("fa");

		renderFa(
			<div>
				<HomeCourseCard
					course={data.courses[0].item}
					href={data.courses[0].href}
				/>
				<HomeSchoolBookCard
					book={data.schoolBooks[0].item}
					href={data.schoolBooks[0].href}
				/>
				<HomeGeneralBookCard
					book={data.generalBooks[0].item}
					href={data.generalBooks[0].href}
				/>
				<HomeFlashcardDeckCard
					deck={data.decks[0].item}
					href={data.decks[0].href}
				/>
				<HomeKankorFormCard
					quiz={data.kankorForms[0].item}
					href={data.kankorForms[0].href}
				/>
			</div>
		);

		// Flashcard shows rating + vote count, top Free pill, and category pill in footer
		expect(screen.getByText("(312)")).toBeTruthy();
		expect(screen.getByText("ریاضیات")).toBeTruthy();
		expect(screen.getAllByText("4.9").length).toBeGreaterThanOrEqual(2);
	});

	it("renders Partner Universities and Schools without category tabs above cards", async () => {
		const data = await getHomeCatalogData("fa");

		renderFa(
			<PartnerInstitutionsSection
				institutions={data.partners}
				labels={{
					title: fa.landing.partners.title,
					subtitle: fa.landing.partners.subtitle,
					ctaTitle: fa.landing.partners.ctaTitle,
					ctaSubtitle: fa.landing.partners.ctaSubtitle,
					ctaButton: fa.landing.partners.ctaButton,
				}}
			/>
		);

		expect(screen.getByText("پوهنتون کابل (دانشگاه کابل)")).toBeTruthy();
		expect(screen.getByText("لیسه عالی حبیبیه کابل")).toBeTruthy();
		expect(screen.queryByRole("tablist")).toBeNull();
	});

	it("renders the 'مکتب' mega-menu and mobile Search dialog cleanly", () => {
		renderFa(
			<>
				<CoursesMegaMenu
					label="مکتب"
					eyebrow={fa.landing.schoolMenu.eyebrow}
					title={fa.landing.schoolMenu.title}
					description={fa.landing.schoolMenu.description}
					allLabel={fa.landing.schoolMenu.all}
					subjectsLabel={fa.landing.schoolMenu.subjects}
					gradesLabel={fa.landing.schoolMenu.gradesLabel}
					paths={fa.landing.schoolMenu.paths}
					grades={fa.landing.schoolMenu.grades}
					items={[
						{
							key: "courses",
							title: fa.landing.schoolMenu.items.courses.title,
							description: fa.landing.schoolMenu.items.courses.description,
							href: "/courses",
						},
						{
							key: "schoolBooks",
							title: fa.landing.schoolMenu.items.schoolBooks.title,
							description: fa.landing.schoolMenu.items.schoolBooks.description,
							href: "/libraries",
						},
						{
							key: "library",
							title: fa.landing.schoolMenu.items.library.title,
							description: fa.landing.schoolMenu.items.library.description,
							href: "/libraries?filters=category",
						},
						{
							key: "kankorForms",
							title: fa.landing.schoolMenu.items.kankorForms.title,
							description: fa.landing.schoolMenu.items.kankorForms.description,
							href: "/quizzes",
						},
						{
							key: "flashcards",
							title: fa.landing.schoolMenu.items.flashcards.title,
							description: fa.landing.schoolMenu.items.flashcards.description,
							href: "/decks",
						},
						{
							key: "roadmap",
							title: fa.landing.schoolMenu.items.roadmap.title,
							description: fa.landing.schoolMenu.items.roadmap.description,
							href: "/roadmap",
						},
					]}
					cardTitle={fa.landing.schoolMenu.cardTitle}
					cardText={fa.landing.schoolMenu.cardText}
					verifyLabel={fa.landing.schoolMenu.verify}
					classroomsLabel={fa.landing.schoolMenu.classrooms}
				/>
				<GlobalSearch />
			</>
		);

		expect(screen.getByRole("link", { name: "مکتب" })).toBeTruthy();
		fireEvent.click(screen.getByTestId("mobile-search-trigger"));
		const modalInput = screen.getAllByPlaceholderText("جستجو")[0];
		fireEvent.change(modalInput, { target: { value: "ریاضی" } });
		fireEvent.keyDown(modalInput, { key: "Enter" });
		expect(pushMock).toHaveBeenCalledWith(
			expect.stringContaining("/search?q=")
		);
	});
});
