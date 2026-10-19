-- ─────────────────────────────────────────────────────────────────────────
-- get_deck_card_counts: bulk flashcard counts for a set of decks. The
-- `flashcards` table has no anon SELECT grant (only `authenticated`, scoped
-- to owner/enrolled/built-in rows), so the public deck catalog can't embed
-- flashcards(count) directly without 401ing for signed-out visitors.
-- SECURITY DEFINER here exposes only the count, never row content, so it's
-- safe to call from the signed-out-accessible /decks catalog.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_deck_card_counts(p_deck_ids uuid[])
 RETURNS TABLE(deck_id uuid, card_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_catalog
AS $function$
  select f.deck_id, count(f.id) as card_count
  from public.flashcards f
  where f.deck_id = any(p_deck_ids)
  group by f.deck_id;
$function$;
