-- Extend get_deck_details so the flashcard-builder (edit/manage) pages can
-- load a deck in a single RPC call instead of two separate table queries
-- (a deck-ownership check + a flashcards select). Adds:
--   - user_id / is_owner: lets callers skip a separate ownership query
--   - the per-algorithm config columns the builder's settings sheet edits
--   - flashcards: full card content as jsonb, populated ONLY when the caller
--     is the deck owner (SECURITY DEFINER is also used by the signed-out
--     public deck teaser page, which must never receive card content/answers)
drop function if exists "public"."get_deck_details"(p_deck_slug text, p_deck_id uuid);

CREATE OR REPLACE FUNCTION public.get_deck_details(p_deck_slug text DEFAULT NULL::text, p_deck_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
   id uuid,
   slug text,
   name text,
   description text,
   algorithm flashcard_algorithm,
   is_free boolean,
   visibility visibility,
   seo_title text,
   seo_description text,
   created_at timestamp with time zone,
   book item_type,
   card_count bigint,
   enrollment jsonb,
   total_flashcards bigint,
   user_id uuid,
   is_owner boolean,
   sm2_starting_ease real,
   sm2_easy_bonus real,
   sm2_interval_modifier real,
   fsrs_request_retention real,
   fsrs_maximum_interval integer,
   config jsonb,
   flashcards jsonb
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
begin
  if p_deck_slug is null and p_deck_id is null then
    raise exception 'Either deck slug or deck ID must be provided.';
  end if;

  return query
  select
    d.id,
    d.slug,
    d.name,
    d.description,
    d.algorithm,
    d.is_free,
    d.visibility,
    d.seo_title,
    d.seo_description,
    d.created_at,
    ROW(b.id, b.name)::item_type as book,
    (select count(f.id) from public.flashcards f where f.deck_id = d.id) as card_count,
    CASE
      WHEN (select auth.uid()) IS NOT NULL THEN (
        SELECT jsonb_build_object('enrolled_at', e.enrolled_at)
        FROM public.enrollments e
        WHERE e.user_id = (select auth.uid())
          AND e.deck_id = d.id
        LIMIT 1
      )
      ELSE NULL
    END as enrollment,
    (select count(f.id) from public.flashcards f where f.deck_id = d.id) as total_flashcards,
    d.user_id,
    coalesce(d.user_id = (select auth.uid()), false) as is_owner,
    d.sm2_starting_ease,
    d.sm2_easy_bonus,
    d.sm2_interval_modifier,
    d.fsrs_request_retention,
    d.fsrs_maximum_interval,
    d.config,
    CASE
      WHEN d.user_id = (select auth.uid()) THEN (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', f.id,
            'question', f.question,
            'answers', f.answers,
            'fact', f.fact,
            'hint', f.hint,
            'img_path', f.img_path,
            'vid_path', f.vid_path,
            'page', f.page,
            'created_at', f.created_at
          ) order by f.created_at
        )
        FROM public.flashcards f
        WHERE f.deck_id = d.id
      )
      ELSE NULL
    END as flashcards
  from public.decks d
  left join public.books b on b.id = d.book_id
  where (p_deck_slug is not null and d.slug = p_deck_slug)
     or (p_deck_id is not null and d.id = p_deck_id);
end;
$function$;
