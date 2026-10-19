"use client";

import { Search, Sparkles, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { PublicDeck } from "./public-deck-card";
import { PublicDeckCard, PublicDeckCardSkeleton } from "./public-deck-card";
import { publicDecksQueryFn } from "./public-deck-query";

export function DeckCatalog({
	initialData,
}: {
	initialData?: { data: PublicDeck[] | null; count: number | null };
} = {}) {
	const t = useTranslations("decks");

	const decksQuery = useQueryFilters<"decks", PublicDeck[]>({
		table: "decks",
		queryFn: publicDecksQueryFn,
		initialData,
		initialState: {
			name: "public-decks",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const { state, setSearch, setFilter, removeFilter } = decksQuery;
	const [searchValue, setSearchValue] = React.useState(state.search ?? "");

	React.useEffect(() => {
		setSearchValue(state.search ?? "");
	}, [state.search]);

	const freeOnly =
		state.filters?.find((f) => f.field === "is_free")?.value === true;

	function toggleFreeOnly() {
		if (freeOnly) {
			removeFilter("is_free");
		} else {
			setFilter({ field: "is_free", operator: "eq", value: true });
		}
	}

	const decks = ((decksQuery.data as any)?.data ?? []) as PublicDeck[];
	const total = ((decksQuery.data as any)?.count ?? null) as number | null;
	const page = decksQuery.state.pagination?.page ?? 1;
	const pageSize = decksQuery.state.pagination?.pageSize ?? 12;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
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

				<Button
					variant="outline"
					size="sm"
					className={cn(
						"gap-1.5",
						freeOnly && "border-primary bg-primary/10 text-primary"
					)}
					onClick={toggleFreeOnly}
				>
					<Sparkles className="size-3.5" />
					{t("freeOnly")}
				</Button>
			</div>

			{decksQuery.isError ? (
				<ResultsError onRetry={() => decksQuery.refetch()} />
			) : decksQuery.isFetching && decks.length === 0 ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: pageSize }).map((_, i) => (
						<PublicDeckCardSkeleton key={i} />
					))}
				</div>
			) : decks.length === 0 ? (
				<ResultsEmpty />
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{decks.map((deck) => (
						<PublicDeckCard key={deck.id} deck={deck} />
					))}
				</div>
			)}

			<ResultsPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(p) => decksQuery.setPagination({ page: p })}
			/>
		</div>
	);
}
