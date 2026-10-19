-- ─────────────────────────────────────────────────────────────────────────
-- Fix: the practice page's "import up to dailyLimit new cards" logic
-- (src/components/blocks/spaced-repitation/queries.ts) read the
-- already-imported-today count, computed remaining, then inserted — as
-- three separate round trips with no locking. Two near-simultaneous
-- requests to the practice page (e.g. router.push immediately followed by
-- router.refresh() after enrolling) both read "0 imported today" before
-- either committed, so each independently imported a full dailyLimit batch
-- — confirmed in local data: an enrollment with flashcard_daily_limit=5 had
-- exactly 10 distinct new deck_cards, inserted ~100ms apart.
--
-- Fix has two parts:
-- 1. A unique constraint so the same flashcard can never get two scheduling
--    rows for the same user+deck (defense in depth).
-- 2. The whole check-then-insert sequence moves into a single Postgres
--    function that locks the enrollment row (SELECT ... FOR UPDATE) for its
--    duration, so a second concurrent call blocks until the first commits
--    and then correctly sees the updated "imported today" count.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.deck_cards
  add constraint deck_cards_user_deck_flashcard_key unique (user_id, deck_id, flashcard_id);

CREATE OR REPLACE FUNCTION public.import_new_deck_cards(
  p_user_id uuid,
  p_deck_id uuid,
  p_now timestamptz,
  p_start_of_today timestamptz
)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_catalog
AS $function$
DECLARE
  v_daily_limit integer;
  v_imported_today integer;
  v_remaining integer;
  v_imported_count integer;
BEGIN
  -- Locks the enrollment row for the rest of this transaction: a second
  -- concurrent call for the same user+deck blocks here until this one
  -- commits, instead of racing on a stale "imported today" count.
  SELECT flashcard_daily_limit INTO v_daily_limit
  FROM public.enrollments
  WHERE user_id = p_user_id AND deck_id = p_deck_id
  FOR UPDATE;

  IF NOT FOUND OR v_daily_limit IS NULL OR v_daily_limit <= 0 THEN
    RETURN 0;
  END IF;

  SELECT count(*) INTO v_imported_today
  FROM public.deck_cards
  WHERE user_id = p_user_id
    AND deck_id = p_deck_id
    AND created_at >= p_start_of_today;

  v_remaining := v_daily_limit - v_imported_today;
  IF v_remaining <= 0 THEN
    RETURN 0;
  END IF;

  WITH unseen AS (
    SELECT f.id
    FROM public.flashcards f
    WHERE f.deck_id = p_deck_id
      AND NOT EXISTS (
        SELECT 1 FROM public.deck_cards dc
        WHERE dc.user_id = p_user_id
          AND dc.deck_id = p_deck_id
          AND dc.flashcard_id = f.id
      )
    ORDER BY f.page, f.created_at
    LIMIT v_remaining
  )
  INSERT INTO public.deck_cards (user_id, deck_id, flashcard_id, status, next_review_date)
  SELECT p_user_id, p_deck_id, unseen.id, 'new', p_now
  FROM unseen
  ON CONFLICT (user_id, deck_id, flashcard_id) DO NOTHING;

  GET DIAGNOSTICS v_imported_count = ROW_COUNT;
  RETURN v_imported_count;
END;
$function$;
