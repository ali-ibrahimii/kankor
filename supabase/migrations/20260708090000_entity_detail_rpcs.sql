-- Persist `get_course_details`'s `enrollment` column: it was applied
-- directly against the live database in a previous session and never
-- captured in a migration, so `supabase db reset` would otherwise lose it.
-- This recreate is a no-op against the current live schema.
drop function if exists "public"."get_course_details"(p_course_slug text, p_course_id uuid);

CREATE OR REPLACE FUNCTION public.get_course_details(p_course_slug text DEFAULT NULL::text, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, title text, slug text, subtitle text, description text, seo_title text, seo_description text, instructor user_info, level course_level, language language_enum, cover_image_url text, promo_video_url text, welcome_message text, learning_objectives text[], prerequisites text[], is_published boolean, published_at timestamp with time zone, is_free boolean, price numeric, currency character, enrollment_limit integer, estimated_duration_hours integer, created_at timestamp with time zone, updated_at timestamp with time zone, average_rating numeric, total_reviews bigint, total_enrollments bigint, total_lessons integer, modules jsonb, subject item_type, book item_type, grade item_type, enrollment jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_catalog
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
    c.enrollment_limit,
    c.estimated_duration_hours,
    c.created_at,
    c.updated_at,
    (select avg(r.rating)::numeric(2,1) from public.reviews r where r.course_id = c.id) as average_rating,
    (select count(r.id) from public.reviews r where r.course_id = c.id) as total_reviews,
    (select count(e.id) from public.enrollments e where e.course_id = c.id) as total_enrollments,
    (select count(l.id)::integer from public.lessons l where l.course_id = c.id) as total_lessons,
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'title', m.title,
          'description', m.description,
          'order_index', m.order_index,
          'lessons', (
            select jsonb_agg(
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
            )
            from public.lessons l
            where l.module_id = m.id
          )
        ) order by m.order_index asc
      )
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

-- ─────────────────────────────────────────────────────────────────────────
-- get_deck_details: single-RPC detail fetch for the deck detail page,
-- mirroring get_course_details. Includes the current user's enrollment
-- (auth.uid()-scoped, null when signed out or not enrolled) so the CTA can
-- distinguish "start studying" from "continue studying" without a second
-- client-side query.
-- ─────────────────────────────────────────────────────────────────────────
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
   total_flashcards bigint
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
    (select count(f.id) from public.flashcards f where f.deck_id = d.id) as total_flashcards
  from public.decks d
  left join public.books b on b.id = d.book_id
  where (p_deck_slug is not null and d.slug = p_deck_slug)
     or (p_deck_id is not null and d.id = p_deck_id);
end;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- get_library_details: single-RPC detail fetch for the library book page.
-- Reused by both the public /libraries/[slug] page and the student
-- dashboard /d/library/[slug] page (previously two independent, identical
-- queries).
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_library_details(p_library_slug text DEFAULT NULL::text, p_library_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
   id uuid,
   slug text,
   title text,
   "desc" text,
   uri text,
   file_path text,
   seo_title text,
   seo_description text,
   created_at timestamp with time zone,
   updated_at timestamp with time zone,
   book item_type,
   category item_type,
   grade item_type,
   subject item_type
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_catalog
AS $function$
begin
  if p_library_slug is null and p_library_id is null then
    raise exception 'Either library slug or library ID must be provided.';
  end if;

  return query
  select
    l.id,
    l.slug,
    l.title,
    l.desc,
    l.uri,
    l.file_path,
    l.seo_title,
    l.seo_description,
    l.created_at,
    l.updated_at,
    ROW(b.id, b.name)::item_type as book,
    ROW(c.id, c.name)::item_type as category,
    ROW(g.id, g.name)::item_type as grade,
    ROW(s.id, s.name)::item_type as subject
  from public.libraries l
  left join public.books b on b.id = l.book_id
  left join public.categories c on c.id = l.category_id
  left join public.grades g on g.id = l.grade_id
  left join public.subjects s on s.id = l.subject_id
  where (p_library_slug is not null and l.slug = p_library_slug)
     or (p_library_id is not null and l.id = p_library_id);
end;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- get_quiz_details: single-RPC detail fetch for the public quiz teaser
-- page. Deliberately excludes entrance_code and question content — the row
-- is readable by anon under RLS, but those fields must never reach a
-- signed-out-accessible page.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_quiz_details(p_quiz_slug text DEFAULT NULL::text, p_quiz_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
   id uuid,
   slug text,
   title text,
   description text,
   instructions text,
   time_limit_minutes integer,
   passing_score_percentage smallint,
   max_attempts smallint,
   visibility visibility,
   seo_title text,
   seo_description text,
   created_at timestamp with time zone
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_catalog
AS $function$
begin
  if p_quiz_slug is null and p_quiz_id is null then
    raise exception 'Either quiz slug or quiz ID must be provided.';
  end if;

  return query
  select
    q.id,
    q.slug,
    q.title,
    q.description,
    q.instructions,
    q.time_limit_minutes,
    q.passing_score_percentage,
    q.max_attempts,
    q.visibility,
    q.seo_title,
    q.seo_description,
    q.created_at
  from public.quizzes q
  where (p_quiz_slug is not null and q.slug = p_quiz_slug)
     or (p_quiz_id is not null and q.id = p_quiz_id);
end;
$function$;
