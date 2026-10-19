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
import { scopedQueryFn } from "@/hooks/filter/query-state-mapping";
import { routes } from "@/lib/routes";
import { useAuthProfile } from "@/providers/auth.provider";

// ─── Select columns ───────────────────────────────────────────────────────────

const SELECT =
	"id, slug, name, description, visibility, algorithm, user_id, creation, created_at, updated_at, flashcards(count)";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolDecksPage({
	params,
}: {
	params: Promise<{ school_id: string }>;
}) {
	const t = useTranslations("flashcardBuilder");
	const profile = useAuthProfile();
	const userId = profile?.id;
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = React.useState(false);

	const { school_id } = React.use(params);
	const basePath = `/d/school/${school_id}`;

	// Owner scope is enforced here, not via a URL-synced filter — RLS lets
	// anyone read public decks, so a URL-tamperable filter would let a school
	// member widen this list beyond their own decks.
	const scopedFn = React.useMemo(
		() =>
			scopedQueryFn<"decks", DeckMeta[]>(
				SELECT,
				["name"],
				userId ? [{ field: "user_id", operator: "eq", value: userId }] : []
			),
		[userId]
	);

	const decksQuery = useQueryFilters<"decks", DeckMeta[]>({
		table: "decks",
		queryFn: scopedFn,
		initialState: {
			name: "school-decks",
			sort: [{ field: "updated_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
		enabled: !!userId,
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
					<h1 className="text-xl font-bold">{t("list.myDecks")}</h1>
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

			{/* Filters */}
			<DeckFilters queryState={decksQuery} />

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
							editHref={routes.d.school.decks.edit.page({
								school_id,
								slug: deck.id,
							})}
							onDeleted={handleDeleted}
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
				basePath={basePath}
			/>
		</div>
	);
}
