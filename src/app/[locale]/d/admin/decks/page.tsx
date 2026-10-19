"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CirclePlus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { routes } from "@/lib/routes";

// ─── Select columns ───────────────────────────────────────────────────────────

const SELECT =
	"id, slug, name, description, visibility, algorithm, user_id, creation, created_at, updated_at, flashcards(count)";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDecksPage() {
	const t = useTranslations("flashcardBuilder");
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = React.useState(false);

	// Admin sees all decks — no user_id filter
	const decksQuery = useQueryFilters<"decks", DeckMeta[]>({
		table: "decks",
		selectColumns: SELECT,
		searchColumns: ["name"],
		initialState: {
			name: "admin-decks",
			sort: [{ field: "updated_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
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
					<h1 className="text-xl font-bold">{t("list.allDecks")}</h1>
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

			{/* Filters — visibility, algorithm, and only-my-decks (admin sees all by default) */}
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
							editHref={routes.d.admin.decks.edit.page({
								slug: deck.slug ?? deck.id,
							})}
							onDeleted={handleDeleted}
							showOwner
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
				basePath="/d/admin"
			/>
		</div>
	);
}
