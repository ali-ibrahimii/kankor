import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { QuizCatalog } from "@/components/blocks/quizzes/quiz-catalog";
import fa from "@/messages/fa.json";
import { getFallbackQuizzes } from "./quizzes-fallback-data";

vi.mock("@/i18n/navigation", () => ({
	Link: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: ReactNode;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
	usePathname: () => "/quizzes",
	useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/filter/filter.hooks", () => ({
	useQueryFilters: () => ({
		state: {
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
			filters: [],
			search: "",
		},
		data: { data: null, count: null },
		isFetching: false,
		isError: false,
		setSearch: vi.fn(),
		setFilter: vi.fn(),
		removeFilter: vi.fn(),
		setSort: vi.fn(),
		setPagination: vi.fn(),
		reset: vi.fn(),
		refetch: vi.fn(),
	}),
}));

function renderFa(ui: ReactNode) {
	return render(
		<NextIntlClientProvider locale="fa" messages={fa}>
			{ui}
		</NextIntlClientProvider>
	);
}

describe("Public Quizzes page catalog", () => {
	it("renders the hero, search input, and curated fallback quizzes in demo mode", () => {
		const fallback = getFallbackQuizzes("fa");
		renderFa(
			<QuizCatalog showHero fallbackItems={fallback} useLiveBackend={false} />
		);

		expect(screen.getByText(fa.quizzes.hub.badge)).toBeTruthy();
		expect(
			screen.getByPlaceholderText(fa.quizzes.searchPlaceholder)
		).toBeTruthy();
		expect(screen.getByText(fallback[0].quiz.title)).toBeTruthy();
		expect(
			screen.getByRole("link", { name: fa.quizzes.hub.hostCta })
		).toHaveAttribute("href", "/auth/signup?type=instructor");
	});

	it("filters by free-only, searches, sorts by duration, and resets cleanly", () => {
		const fallback = getFallbackQuizzes("fa");
		renderFa(
			<QuizCatalog showHero fallbackItems={fallback} useLiveBackend={false} />
		);

		// Filter to free-only hides paid quizzes
		const paidQuiz = fallback.find((entry) => !entry.quiz.is_free)!;
		fireEvent.click(
			screen.getByRole("button", { name: fa.quizzes.hub.filters.free })
		);
		expect(screen.queryByText(paidQuiz.quiz.title)).toBeNull();

		// Sort by shortest places the 45-minute quiz first
		fireEvent.click(
			screen.getByRole("button", {
				name: fa.quizzes.hub.filters.sortShortest,
			})
		);
		const headings = screen.getAllByRole("heading", { level: 3 });
		expect(headings[0].textContent).toContain("کیمیای عضوی");

		// Search with no match shows contextual empty state + resets back to all
		const input = screen.getByPlaceholderText(fa.quizzes.searchPlaceholder);
		fireEvent.change(input, { target: { value: "عبارت-ناموجود-xyz" } });
		expect(screen.getByText(fa.quizzes.hub.emptyFilteredTitle)).toBeTruthy();

		fireEvent.click(
			screen.getAllByRole("button", { name: fa.quizzes.hub.filters.reset })[0]
		);
		expect(screen.getByText(paidQuiz.quiz.title)).toBeTruthy();
	});

	it("renders the empty-catalog call-to-action when live DB has no quizzes", () => {
		renderFa(
			<QuizCatalog
				showHero
				initialData={{ data: [], count: 0 }}
				fallbackItems={[]}
				useLiveBackend
			/>
		);

		expect(screen.getByText(fa.quizzes.noQuizzesFound)).toBeTruthy();
		expect(
			screen.getByRole("link", { name: fa.quizzes.hub.exploreCourses })
		).toHaveAttribute("href", "/courses");
		expect(
			screen.getByRole("link", { name: fa.quizzes.hub.exploreDecks })
		).toHaveAttribute("href", "/decks");
	});
});
