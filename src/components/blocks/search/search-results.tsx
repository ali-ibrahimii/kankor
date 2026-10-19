"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import type { CourseMeta } from "@/components/blocks/course";
import {
	CatalogCourseCard,
	CourseGrid,
	CourseGridEmpty,
	CourseGridSkeleton,
	CoursePagination,
	publishedCoursesQueryFn,
} from "@/components/blocks/course";
import type { PublicDeck } from "@/components/blocks/decks";
import {
	PublicDeckCard,
	PublicDeckCardSkeleton,
	publicDecksQueryFn,
} from "@/components/blocks/decks";
import type { LibraryBook } from "@/components/blocks/libraries";
import {
	BOOK_SELECT,
	LibraryCard,
	LibraryGrid,
	LibraryGridEmpty,
	LibraryGridSkeleton,
	LibraryPagination,
} from "@/components/blocks/libraries";
import type { PublicQuiz } from "@/components/blocks/quizzes";
import {
	PublicQuizCard,
	PublicQuizCardSkeleton,
	publicQuizzesQueryFn,
} from "@/components/blocks/quizzes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { useSearchSuggestions } from "@/hooks/use-search-suggestions";
import { routes } from "@/lib/routes";
import {
	ResultsEmpty,
	ResultsError,
	ResultsPagination,
} from "./results-status";
import { SearchResultRow } from "./search-result-row";

// ─── Root ─────────────────────────────────────────────────────────────────────

export function SearchResults({ initialQuery }: { initialQuery: string }) {
	const t = useTranslations("search");
	const [tab, setTab] = React.useState("all");

	return (
		<Tabs value={tab} onValueChange={setTab} className="gap-6">
			<TabsList>
				<TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
				<TabsTrigger value="courses">{t("tabs.courses")}</TabsTrigger>
				<TabsTrigger value="libraries">{t("tabs.libraries")}</TabsTrigger>
				<TabsTrigger value="decks">{t("tabs.decks")}</TabsTrigger>
				<TabsTrigger value="quizzes">{t("tabs.quizzes")}</TabsTrigger>
			</TabsList>

			<TabsContent value="all">
				<AllResultsTab query={initialQuery} onSeeAll={setTab} />
			</TabsContent>
			<TabsContent value="courses">
				<CoursesResultsTab query={initialQuery} />
			</TabsContent>
			<TabsContent value="libraries">
				<LibraryResultsTab query={initialQuery} />
			</TabsContent>
			<TabsContent value="decks">
				<DecksResultsTab query={initialQuery} />
			</TabsContent>
			<TabsContent value="quizzes">
				<QuizzesResultsTab query={initialQuery} />
			</TabsContent>
		</Tabs>
	);
}

// ─── All ──────────────────────────────────────────────────────────────────────

function AllResultsTab({
	query,
	onSeeAll,
}: {
	query: string;
	onSeeAll: (tab: string) => void;
}) {
	const t = useTranslations("search");
	const {
		data: suggestions = [],
		isFetching,
		isError,
		refetch,
	} = useSearchSuggestions(query, 8);

	const groups = [
		{ type: "course" as const, tab: "courses", label: t("groups.courses") },
		{
			type: "library" as const,
			tab: "libraries",
			label: t("groups.libraries"),
		},
		{ type: "deck" as const, tab: "decks", label: t("groups.decks") },
		{ type: "quiz" as const, tab: "quizzes", label: t("groups.quizzes") },
	];

	if (isError) return <ResultsError onRetry={() => refetch()} />;

	if (isFetching && suggestions.length === 0) {
		return (
			<div className="py-16 text-center text-sm text-muted-foreground">
				{t("searching")}
			</div>
		);
	}

	if (suggestions.length === 0) return <ResultsEmpty />;

	return (
		<div className="flex flex-col gap-8">
			{groups.map(({ type, tab, label }) => {
				const items = suggestions.filter((s) => s.result_type === type);
				if (items.length === 0) return null;

				return (
					<section key={type} className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<h2 className="text-sm font-semibold text-slate-900">{label}</h2>
							<button
								type="button"
								className="text-xs font-medium text-[#1461B8] hover:underline"
								onClick={() => onSeeAll(tab)}
							>
								{t("seeAll")}
							</button>
						</div>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{items.map((item) => (
								<SearchResultRow key={`${type}-${item.id}`} suggestion={item} />
							))}
						</div>
					</section>
				);
			})}
		</div>
	);
}

// ─── Courses ──────────────────────────────────────────────────────────────────

function CoursesResultsTab({ query }: { query: string }) {
	const t = useTranslations("courses");

	const coursesQuery = useQueryFilters<"courses", CourseMeta[]>({
		table: "courses",
		queryFn: publishedCoursesQueryFn,
		initialState: {
			name: "search-courses",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const setSearch = coursesQuery.setSearch;
	React.useEffect(() => {
		setSearch(query);
	}, [query, setSearch]);

	const courses = ((coursesQuery.data as any)?.data ?? []) as CourseMeta[];
	const total = ((coursesQuery.data as any)?.count ?? null) as number | null;
	const page = coursesQuery.state.pagination?.page ?? 1;
	const pageSize = coursesQuery.state.pagination?.pageSize ?? 12;

	if (coursesQuery.isError) {
		return <ResultsError onRetry={() => coursesQuery.refetch()} />;
	}

	if (coursesQuery.isFetching && courses.length === 0) {
		return <CourseGridSkeleton count={8} />;
	}

	if (courses.length === 0) {
		return (
			<CourseGridEmpty
				title={t("noCoursesFound")}
				description={t("noCoursesDescription")}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<CourseGrid>
				{courses.map((course) => (
					<CatalogCourseCard
						key={course.id}
						course={course}
						href={routes.courses.slug.page({
							slug: course.slug ?? course.id,
						})}
					/>
				))}
			</CourseGrid>
			<CoursePagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(p) => coursesQuery.setPagination({ page: p })}
			/>
		</div>
	);
}

// ─── Libraries ────────────────────────────────────────────────────────────────

function LibraryResultsTab({ query }: { query: string }) {
	const booksQuery = useQueryFilters<"libraries", LibraryBook[]>({
		table: "libraries",
		selectColumns: BOOK_SELECT,
		searchColumns: ["title", "desc"],
		initialState: {
			name: "search-libraries",
			sort: [{ field: "updated_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const setSearch = booksQuery.setSearch;
	React.useEffect(() => {
		setSearch(query);
	}, [query, setSearch]);

	const books = ((booksQuery.data as any)?.data ?? []) as LibraryBook[];
	const total = ((booksQuery.data as any)?.count ?? null) as number | null;
	const page = booksQuery.state.pagination?.page ?? 1;
	const pageSize = booksQuery.state.pagination?.pageSize ?? 12;

	if (booksQuery.isError) {
		return <ResultsError onRetry={() => booksQuery.refetch()} />;
	}

	if (booksQuery.isFetching && books.length === 0) {
		return <LibraryGridSkeleton count={8} />;
	}

	if (books.length === 0) return <LibraryGridEmpty />;

	return (
		<div className="flex flex-col gap-6">
			<LibraryGrid>
				{books.map((book) => (
					<LibraryCard key={book.id} book={book} />
				))}
			</LibraryGrid>
			<LibraryPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(p) => booksQuery.setPagination({ page: p })}
			/>
		</div>
	);
}

// ─── Decks ────────────────────────────────────────────────────────────────────

function DecksResultsTab({ query }: { query: string }) {
	const decksQuery = useQueryFilters<"decks", PublicDeck[]>({
		table: "decks",
		queryFn: publicDecksQueryFn,
		initialState: {
			name: "search-decks",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const setSearch = decksQuery.setSearch;
	React.useEffect(() => {
		setSearch(query);
	}, [query, setSearch]);

	const decks = ((decksQuery.data as any)?.data ?? []) as PublicDeck[];
	const total = ((decksQuery.data as any)?.count ?? null) as number | null;
	const page = decksQuery.state.pagination?.page ?? 1;
	const pageSize = decksQuery.state.pagination?.pageSize ?? 12;

	if (decksQuery.isError) {
		return <ResultsError onRetry={() => decksQuery.refetch()} />;
	}

	if (decksQuery.isFetching && decks.length === 0) {
		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<PublicDeckCardSkeleton key={i} />
				))}
			</div>
		);
	}

	if (decks.length === 0) return <ResultsEmpty />;

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{decks.map((deck) => (
					<PublicDeckCard key={deck.id} deck={deck} />
				))}
			</div>
			<ResultsPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(p) => decksQuery.setPagination({ page: p })}
			/>
		</div>
	);
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────

function QuizzesResultsTab({ query }: { query: string }) {
	const quizzesQuery = useQueryFilters<"quizzes", PublicQuiz[]>({
		table: "quizzes",
		queryFn: publicQuizzesQueryFn,
		initialState: {
			name: "search-quizzes",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const setSearch = quizzesQuery.setSearch;
	React.useEffect(() => {
		setSearch(query);
	}, [query, setSearch]);

	const quizzes = ((quizzesQuery.data as any)?.data ?? []) as PublicQuiz[];
	const total = ((quizzesQuery.data as any)?.count ?? null) as number | null;
	const page = quizzesQuery.state.pagination?.page ?? 1;
	const pageSize = quizzesQuery.state.pagination?.pageSize ?? 12;

	if (quizzesQuery.isError) {
		return <ResultsError onRetry={() => quizzesQuery.refetch()} />;
	}

	if (quizzesQuery.isFetching && quizzes.length === 0) {
		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<PublicQuizCardSkeleton key={i} />
				))}
			</div>
		);
	}

	if (quizzes.length === 0) return <ResultsEmpty />;

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{quizzes.map((quiz) => (
					<PublicQuizCard key={quiz.id} quiz={quiz} />
				))}
			</div>
			<ResultsPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(p) => quizzesQuery.setPagination({ page: p })}
			/>
		</div>
	);
}
