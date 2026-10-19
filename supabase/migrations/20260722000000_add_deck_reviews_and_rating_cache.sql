-- Extend the reviews table to also support decks, and cache aggregate rating
-- stats on courses/decks so course/deck listing and detail pages don't need
-- to recompute avg()/count() over reviews on every read.

-- ── reviews: add deck_id, enforce exactly one target, dedupe per user ────────

alter table "public"."reviews"
  add column "deck_id" uuid;

alter table "public"."reviews"
  add constraint "reviews_deck_id_fkey"
  foreign key (deck_id) references public.decks(id) on delete cascade
  not valid;

alter table "public"."reviews"
  validate constraint "reviews_deck_id_fkey";

alter table "public"."reviews"
  add constraint "reviews_target_check"
  check (
    (course_id is not null and deck_id is null)
    or (course_id is null and deck_id is not null)
  );

create index if not exists "idx_reviews_deck_id" on public.reviews using btree (deck_id);
create index if not exists "idx_reviews_deck_created" on public.reviews using btree (deck_id, created_at desc);
create index if not exists "idx_reviews_deck_rating" on public.reviews using btree (deck_id, rating desc);

-- One review per user per course/deck (partial indexes since only one of
-- the two columns is ever set on a given row).
create unique index if not exists "reviews_user_course_unique" on public.reviews (user_id, course_id) where (course_id is not null);
create unique index if not exists "reviews_user_deck_unique" on public.reviews (user_id, deck_id) where (deck_id is not null);

-- Authors can remove their own review; RLS already has an "Allow authenticated
-- users to view all reviews" select policy. Inserts/updates are intentionally
-- funneled through submit_review() below so the enrollment check can't be
-- bypassed by calling PostgREST directly.
create policy "Users can delete their own review"
on "public"."reviews"
as permissive
for delete
to authenticated
using (user_id = (select auth.uid()));

-- ── courses / decks: cached rating columns ───────────────────────────────────

alter table "public"."courses"
  add column "average_rating" numeric(2,1),
  add column "total_reviews" integer not null default 0;

alter table "public"."decks"
  add column "average_rating" numeric(2,1),
  add column "total_reviews" integer not null default 0;

-- ── trigger: keep the cached columns in sync with public.reviews ────────────

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.refresh_review_target_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_course_id uuid := coalesce(new.course_id, old.course_id);
  v_deck_id uuid := coalesce(new.deck_id, old.deck_id);
begin
  if v_course_id is not null then
    update public.courses c
    set
      average_rating = stats.avg_rating,
      total_reviews = stats.cnt
    from (
      select avg(rating)::numeric(2,1) as avg_rating, count(*) as cnt
      from public.reviews
      where course_id = v_course_id
    ) stats
    where c.id = v_course_id;
  end if;

  if v_deck_id is not null then
    update public.decks d
    set
      average_rating = stats.avg_rating,
      total_reviews = stats.cnt
    from (
      select avg(rating)::numeric(2,1) as avg_rating, count(*) as cnt
      from public.reviews
      where deck_id = v_deck_id
    ) stats
    where d.id = v_deck_id;
  end if;

  return coalesce(new, old);
end;
$function$;

create trigger "reviews_refresh_target_stats"
after insert or update or delete on public.reviews
for each row execute function public.refresh_review_target_stats();

-- ── get_course_details: read the cached columns instead of correlated
--    subqueries (same signature/return type, so CREATE OR REPLACE is enough) ─

CREATE OR REPLACE FUNCTION public.get_course_details(p_course_slug text DEFAULT NULL::text, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, title text, slug text, subtitle text, description text, seo_title text, seo_description text, instructor user_info, level course_level, language language_enum, cover_image_url text, promo_video_url text, welcome_message text, learning_objectives text[], prerequisites text[], is_published boolean, published_at timestamp with time zone, is_free boolean, price numeric, currency character, price_credits integer, enrollment_limit integer, estimated_duration_hours integer, created_at timestamp with time zone, updated_at timestamp with time zone, average_rating numeric, total_reviews bigint, total_enrollments bigint, total_lessons integer, modules jsonb, subject item_type, book item_type, grade item_type, enrollment jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  if p_course_slug is null and p_course_id is null then
    raise exception 'Either course slug or course ID must be provided.';
  end if;

  return query
  select
    c.id,
    c.title,
    c.slug,
    c.subtitle,
    c.description,
    c.seo_title,
    c.seo_description,
    ROW(
    c.instructor_id,
    p.slug,
    p.email,
    p.full_name,
    p.avatar_url
    )::user_info,
    c.level,
    c.language,
    c.cover_image_url,
    c.promo_video_url,
    c.welcome_message,
    c.learning_objectives,
    c.prerequisites,
    c.is_published,
    c.published_at,
    c.is_free,
    c.price,
    c.currency,
    c.price_credits,
    c.enrollment_limit,
    c.estimated_duration_hours,
    c.created_at,
    c.updated_at,
    c.average_rating,
    c.total_reviews::bigint as total_reviews,
    (select count(e.id) from public.enrollments e where e.course_id = c.id) as total_enrollments,
    (select count(l.id)::integer from public.lessons l where l.course_id = c.id) as total_lessons,
    (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'title', m.title,
          'description', m.description,
          'order_index', m.order_index,
          'lessons', (
            select coalesce(jsonb_agg(
              jsonb_build_object(
  'id', l.id,
  'title', l.title,
  'content_type', l.content_type,
  'order_index', l.order_index,
  'estimated_duration_minutes', l.estimated_duration_minutes,
  'is_previewable', l.is_previewable,
  'lesson_progress',
    CASE
      WHEN (select auth.uid()) IS NOT NULL THEN (
        SELECT jsonb_build_object(
          'id', lp.id,
          'is_completed', lp.is_completed,
          'completed_at', lp.completed_at,
          'last_accessed_at', lp.last_accessed_at,
          'video_progress_seconds', lp.video_progress_seconds
        )
        FROM public.lesson_progress lp
        WHERE lp.user_id = (select auth.uid())
          AND lp.lesson_id = l.id
        LIMIT 1
      )
      ELSE NULL
    END
) order by l.order_index asc
            ), '[]'::jsonb)
            from public.lessons l
            where l.module_id = m.id
          )
        ) order by m.order_index asc
      ), '[]'::jsonb)
      from public.modules m
      where m.course_id = c.id
    ) as modules,
    ROW(
      s.id,
      s.name
    )::item_type as subject,
    ROW(
      b.id,
      b.name
    )::item_type as book,
    ROW(
      g.id,
      g.name
    )::item_type as grade,
    CASE
      WHEN (select auth.uid()) IS NOT NULL THEN (
        SELECT jsonb_build_object(
          'progress_percentage', e.progress_percentage,
          'last_accessed_lesson_id', e.last_accessed_lesson_id,
          'completed_at', e.completed_at,
          'enrolled_at', e.enrolled_at
        )
        FROM public.enrollments e
        WHERE e.user_id = (select auth.uid())
          AND e.course_id = c.id
        LIMIT 1
      )
      ELSE NULL
    END as enrollment
  from public.courses c
  left join public.profiles p on c.instructor_id = p.id
  left join public.subjects s on s.id = c.subject_id
  left join public.books b on b.id = c.book_id
  left join public.grades g on g.id = c.grade_id
  where (p_course_slug is not null and c.slug = p_course_slug)
     or (p_course_id is not null and c.id = p_course_id);
end;
$function$;

-- ── get_deck_details: append average_rating/total_reviews — new output
--    columns mean the return type changes, so the function must be dropped
--    and recreated rather than just replaced ───────────────────────────────

DROP FUNCTION IF EXISTS public.get_deck_details(text, uuid);

CREATE FUNCTION public.get_deck_details(p_deck_slug text DEFAULT NULL::text, p_deck_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, slug text, name text, description text, algorithm flashcard_algorithm, is_free boolean, price_credits integer, visibility visibility, seo_title text, seo_description text, created_at timestamp with time zone, book item_type, card_count bigint, enrollment jsonb, total_flashcards bigint, user_id uuid, is_owner boolean, sm2_starting_ease real, sm2_easy_bonus real, sm2_interval_modifier real, fsrs_request_retention real, fsrs_maximum_interval integer, config jsonb, flashcards jsonb, average_rating numeric, total_reviews bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
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
    d.price_credits,
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
    END as flashcards,
    d.average_rating,
    d.total_reviews::bigint as total_reviews
  from public.decks d
  left join public.books b on b.id = d.book_id
  where (p_deck_slug is not null and d.slug = p_deck_slug)
     or (p_deck_id is not null and d.id = p_deck_id);
end;
$function$;

-- ── submit_review: upsert the caller's own review, gated on enrollment ──────

CREATE OR REPLACE FUNCTION public.submit_review(
  p_course_id uuid DEFAULT NULL::uuid,
  p_deck_id uuid DEFAULT NULL::uuid,
  p_rating smallint DEFAULT NULL::smallint,
  p_title text DEFAULT NULL::text,
  p_comment text DEFAULT NULL::text,
  p_user_id uuid DEFAULT auth.uid()
)
 RETURNS public.reviews
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  result public.reviews;
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  if (p_course_id is null) = (p_deck_id is null) then
    raise exception 'Exactly one of course ID or deck ID must be provided.';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5.';
  end if;

  if p_course_id is not null then
    if not public.is_enrolled(p_course_id, p_user_id) then
      raise exception 'You must be enrolled in this course to leave a review.';
    end if;

    insert into public.reviews (user_id, course_id, rating, title, comment)
    values (p_user_id, p_course_id, p_rating, v_title, v_comment)
    on conflict (user_id, course_id) where (course_id is not null)
      do update set
        rating = excluded.rating,
        title = excluded.title,
        comment = excluded.comment,
        updated_at = now()
    returning * into result;
  else
    if not public.is_enrolled_deck(p_deck_id, p_user_id) then
      raise exception 'You must add this deck to your library to leave a review.';
    end if;

    insert into public.reviews (user_id, deck_id, rating, title, comment)
    values (p_user_id, p_deck_id, p_rating, v_title, v_comment)
    on conflict (user_id, deck_id) where (deck_id is not null)
      do update set
        rating = excluded.rating,
        title = excluded.title,
        comment = excluded.comment,
        updated_at = now()
    returning * into result;
  end if;

  return result;
end;
$function$;

-- ── get_reviews: paginated review list + reviewer profile, for lazy loading ──

CREATE OR REPLACE FUNCTION public.get_reviews(
  p_course_id uuid DEFAULT NULL::uuid,
  p_deck_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
 RETURNS TABLE(id uuid, user_id uuid, rating smallint, title text, comment text, created_at timestamp with time zone, updated_at timestamp with time zone, reviewer jsonb, total_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  if p_course_id is null and p_deck_id is null then
    raise exception 'Either course ID or deck ID must be provided.';
  end if;

  return query
  select
    r.id,
    r.user_id,
    r.rating,
    r.title,
    r.comment,
    r.created_at,
    r.updated_at,
    jsonb_build_object(
      'name', p.full_name,
      'avatar', p.avatar_url
    ) as reviewer,
    count(*) over() as total_count
  from public.reviews r
  join public.profiles p on p.id = r.user_id
  where (p_course_id is not null and r.course_id = p_course_id)
     or (p_deck_id is not null and r.deck_id = p_deck_id)
  order by r.created_at desc
  limit p_limit offset p_offset;
end;
$function$;

-- ── get_review_breakdown: per-star counts (1..5, desc) for a rating bar ──────

CREATE OR REPLACE FUNCTION public.get_review_breakdown(
  p_course_id uuid DEFAULT NULL::uuid,
  p_deck_id uuid DEFAULT NULL::uuid
)
 RETURNS TABLE(rating smallint, count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  select gs.rating::smallint, coalesce(r.cnt, 0) as count
  from generate_series(1, 5) as gs(rating)
  left join (
    select rating, count(*) as cnt
    from public.reviews
    where (p_course_id is not null and course_id = p_course_id)
       or (p_deck_id is not null and deck_id = p_deck_id)
    group by rating
  ) r on r.rating = gs.rating
  order by gs.rating desc;
$function$;
