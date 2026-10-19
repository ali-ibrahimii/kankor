import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { defaultQueryFn } from "@/hooks/filter/query-state-mapping";
import type { QueryFn } from "@/hooks/filter/types";
import type { PublicDeck } from "./public-deck-card";

// No flashcards(count) embed here: the `flashcards` table has no anon SELECT
// grant, so joining it on a signed-out-accessible page would 401 the whole
// query. Card counts are backfilled below via the `get_deck_card_counts`
// SECURITY DEFINER RPC, which exposes only counts, never card content.
export const PUBLIC_DECK_SELECT =
	"id, slug, name, description, is_free, created_at";

/** Deck listing query scoped to public decks — safe for signed-out visitors. */
export const publicDecksQueryFn: QueryFn<"decks", PublicDeck[]> = async (
	client,
	table,
	state,
	single
) => {
	const result = (await defaultQueryFn<"decks", PublicDeck[]>(
		PUBLIC_DECK_SELECT,
		["name", "description"]
	)(
		client,
		table,
		{
			...state,
			filters: [
				...(state?.filters ?? []),
				{ field: "visibility", operator: "eq", value: "public" },
			],
		},
		single
	)) as PostgrestSingleResponse<PublicDeck[]>;

	const decks = result.data;
	if (!decks || decks.length === 0) return result;

	const { data: counts } = await client.rpc("get_deck_card_counts", {
		p_deck_ids: decks.map((deck) => deck.id),
	});
	const countByDeckId = new Map(
		counts?.map((row) => [row.deck_id, row.card_count]) ?? []
	);

	return {
		...result,
		data: decks.map((deck) => ({
			...deck,
			card_count: countByDeckId.get(deck.id) ?? 0,
		})),
	};
};
