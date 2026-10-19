"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import {
	ResultsEmpty,
	ResultsError,
	ResultsPagination,
} from "@/components/blocks/search/results-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { PublicQuizCard, PublicQuizCardSkeleton } from "./public-quiz-card";
import { publicQuizzesQueryFn } from "./public-quiz-query";
import type { PublicQuiz } from "./types";

export function QuizCatalog({
	initialData,
}: {
	initialData?: { data: PublicQuiz[] | null; count: number | null };
} = {}) {
	const t = useTranslations("quizzes");

	const quizzesQuery = useQueryFilters<"quizzes", PublicQuiz[]>({
		table: "quizzes",
		queryFn: publicQuizzesQueryFn,
		initialData,
		initialState: {
			name: "public-quizzes",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const { state, setSearch } = quizzesQuery;
	const [searchValue, setSearchValue] = React.useState(state.search ?? "");

	React.useEffect(() => {
		setSearchValue(state.search ?? "");
	}, [state.search]);

	const quizzes = ((quizzesQuery.data as any)?.data ?? []) as PublicQuiz[];
	const total = ((quizzesQuery.data as any)?.count ?? null) as number | null;
	const page = quizzesQuery.state.pagination?.page ?? 1;
	const pageSize = quizzesQuery.state.pagination?.pageSize ?? 12;

	return (
		<div className="flex flex-col gap-6">
			<div className="relative">
				<Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={searchValue}
					onChange={(e) => {
						setSearchValue(e.target.value);
						setSearch(e.target.value);
					}}
					placeholder={t("searchPlaceholder")}
					className="ps-9 pe-9"
				/>
				{searchValue && (
					<Button
						variant="ghost"
						size="icon-sm"
						className="absolute end-1 top-1/2 -translate-y-1/2"
						aria-label={t("clearSearch")}
						onClick={() => {
							setSearchValue("");
							setSearch("");
						}}
					>
						<X className="size-3.5" />
					</Button>
				)}
			</div>

			{quizzesQuery.isError ? (
				<ResultsError onRetry={() => quizzesQuery.refetch()} />
			) : quizzesQuery.isFetching && quizzes.length === 0 ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: pageSize }).map((_, i) => (
						<PublicQuizCardSkeleton key={i} />
					))}
				</div>
			) : quizzes.length === 0 ? (
				<ResultsEmpty />
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{quizzes.map((quiz) => (
						<PublicQuizCard key={quiz.id} quiz={quiz} />
					))}
				</div>
			)}

			<ResultsPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(p) => quizzesQuery.setPagination({ page: p })}
			/>
		</div>
	);
}
