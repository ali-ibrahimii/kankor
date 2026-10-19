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

const SELECT =
	"id, slug, name, description, visibility, algorithm, user_id, creation, created_at, updated_at, flashcards(count)";

export default function AgencyDecksPage({
	params,
}: {
	params: Promise<{ agency_id: string }>;
}) {
	const t = useTranslations("flashcardBuilder");
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = React.useState(false);

	const { agency_id } = React.use(params);
	const basePath = `/d/agency/${agency_id}`;

	// Agency ownership scope is a fixed (non-URL-synced) filter — RLS lets
	// anyone read public decks, so a tamperable filter would widen the list.
	const scopedFn = React.useMemo(
		() =>
			scopedQueryFn<"decks", DeckMeta[]>(
				SELECT,
				["name"],
				[{ field: "agency_id", operator: "eq", value: agency_id }]
			),
		[agency_id]
	);

	const decksQuery = useQueryFilters<"decks", DeckMeta[]>({
		table: "decks",
		queryFn: scopedFn,
		initialState: {
			name: `agency-decks-${agency_id}`,
			sort: [{ field: "updated_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const decks = (decksQuery.data as { data?: DeckMeta[] })?.data ?? [];
	const total = (decksQuery.data as { count?: number })?.count ?? null;
	const page = decksQuery.state.pagination?.page ?? 1;
	const pageSize = decksQuery.state.pagination?.pageSize ?? 12;

	function handleDeleted() {
		queryClient.invalidateQueries({ queryKey: ["decks"] });
	}

	return (
		<div className="space-y-6 p-6">
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

			<DeckFilters queryState={decksQuery} />

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
							editHref={routes.d.agency.decks.edit.page({
								agency_id,
								slug: deck.id,
							})}
							onDeleted={handleDeleted}
						/>
					))}
				</DeckGrid>
			)}

			<DeckPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(p) => decksQuery.setPagination({ page: p })}
			/>

			<NewDeckDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				basePath={basePath}
				agencyId={agency_id}
			/>
		</div>
	);
}
