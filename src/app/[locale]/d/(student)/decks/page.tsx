"use client";

import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { Brain, CirclePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import type { DeckMeta } from "@/components/blocks/flashcard-builder";
import {
	DeckCard,
	DeckFilters,
	DeckGrid,
	DeckGridEmpty,
	DeckGridSkeleton,
	DeckPagination,
	NewDeckDialog,
} from "@/components/blocks/flashcard-builder";
import type { EnrollableDeck } from "@/components/blocks/spaced-repitation";
import { EnrollDeckDialog } from "@/components/blocks/spaced-repitation";
import { Button } from "@/components/ui/button";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import type { QueryFn, QueryState } from "@/hooks/filter/types";
import { routes } from "@/lib/routes";
import { useAuthProfile } from "@/providers/auth.provider";

// ─── Select columns ───────────────────────────────────────────────────────────

const SELECT =
	"id, slug, name, description, visibility, algorithm, user_id, creation, created_at, updated_at, is_free, price_credits, flashcards(count)";

// ─── Custom query: own decks OR public decks ──────────────────────────────────

function buildStudentQueryFn(userId: string): QueryFn<"decks", DeckMeta[]> {
	return async (client, _table, state) => {
		// Base: own decks OR any public deck
		let query = (client.from("decks") as any).select(SELECT, {
			count: "exact",
		});

		// Apply the OR base condition first
		query = query.or(`user_id.eq.${userId},visibility.eq.public`);

		// Apply additional UI filters (algorithm, visibility chip) via AND
		if (state?.filters?.length) {
			for (const f of state.filters) {
				if (f.operator === "eq") {
					query = query.eq(f.field as string, f.value);
				} else if (f.operator === "ilike") {
					query = query.ilike(f.field as string, `%${f.value}%`);
				}
			}
		}

		// Search
		if (state?.search) {
			query = query.ilike("name", `%${state.search}%`);
		}

		// Sort
		if (state?.sort?.length) {
			for (const s of state.sort) {
				query = query.order(s.field as string, {
					ascending: s.direction === "asc",
				});
			}
		}

		// Pagination
		if (state?.pagination) {
			const from = (state.pagination.page - 1) * state.pagination.pageSize;
			const to = from + state.pagination.pageSize - 1;
			query = query.range(from, to);
		}

		return query as PostgrestSingleResponse<DeckMeta[]>;
	};
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentDecksPage() {
	const t = useTranslations("flashcardBuilder");
	const ts = useTranslations("spacedRepetition.page");
	const profile = useAuthProfile();
	const userId = profile?.id;
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [studyDeck, setStudyDeck] = React.useState<EnrollableDeck | null>(null);

	// Memoize queryFn so it only changes when userId changes
	const studentQueryFn = React.useMemo(
		() => (userId ? buildStudentQueryFn(userId) : undefined),
		[userId]
	);

	const decksQuery = useQueryFilters<"decks", DeckMeta[]>({
		table: "decks",
		queryFn: studentQueryFn,
		initialState: {
			name: "student-decks",
			sort: [{ field: "updated_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
		enabled: !!userId && !!studentQueryFn,
	});

	const decks = (decksQuery.data as any)?.data ?? [];
	const total = (decksQuery.data as any)?.count ?? null;
	const page = decksQuery.state.pagination?.page ?? 1;
	const pageSize = decksQuery.state.pagination?.pageSize ?? 12;

	function handleDeleted() {
		queryClient.invalidateQueries({ queryKey: ["decks"] });
	}

	return (
		<div className="space-y-6 p-6">
			{/* Page header */}
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold">{t("list.title")}</h1>
					{total != null && (
						<p className="mt-0.5 text-sm text-muted-foreground">
							{t("list.subtitle", { count: total })}
						</p>
					)}
				</div>
				<Button size="sm" onClick={() => setDialogOpen(true)}>
					<CirclePlus className="size-4" />
					{t("list.newDeck")}
				</Button>
			</div>

			{/* Filters — visibility, algorithm, and only-my-decks (default shows own + public) */}
			<DeckFilters queryState={decksQuery} enableOwnerFilter />

			{/* Grid */}
			{decksQuery.isFetching && decks.length === 0 ? (
				<DeckGridSkeleton count={6} />
			) : decks.length === 0 ? (
				<DeckGridEmpty
					action={
						<Button size="sm" onClick={() => setDialogOpen(true)}>
							<CirclePlus className="size-4" />
							{t("list.emptyAction")}
						</Button>
					}
				/>
			) : (
				<DeckGrid>
					{decks.map((deck: DeckMeta) => (
						<DeckCard
							key={deck.id}
							deck={deck}
							editHref={
								deck.user_id === userId
									? routes.d.decks.edit.page({ slug: deck.slug ?? deck.id })
									: undefined
							}
							onDeleted={deck.user_id === userId ? handleDeleted : undefined}
							action={
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setStudyDeck({
											id: deck.id,
											name: deck.name,
											description: deck.description,
											algorithm: deck.algorithm,
											cardCount: deck.flashcards?.[0]?.count ?? 0,
											isFree: deck.is_free ?? true,
											priceCredits: deck.price_credits ?? 0,
										})
									}
								>
									<Brain className="size-3.5" />
									{ts("study")}
								</Button>
							}
						/>
					))}
				</DeckGrid>
			)}

			{/* Pagination */}
			<DeckPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(p) => decksQuery.setPagination({ page: p })}
			/>

			{/* New deck dialog */}
			<NewDeckDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				basePath="/d"
			/>

			{/* Enroll & practice dialog */}
			<EnrollDeckDialog
				open={studyDeck !== null}
				onOpenChange={(open) => {
					if (!open) setStudyDeck(null);
				}}
				preselected={studyDeck}
			/>
		</div>
	);
}
