-- Drop functions to redefine their output signature
DROP FUNCTION IF EXISTS public.get_course_details(text, uuid);
DROP FUNCTION IF EXISTS public.get_deck_details(text, uuid);
DROP FUNCTION IF EXISTS public.get_quiz_details(text, uuid);
DROP FUNCTION IF EXISTS public.get_library_details(text, uuid);

-- 1. get_course_details
CREATE FUNCTION public.get_course_details(p_course_slug text DEFAULT NULL::text, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
   id uuid,
   title text,
   slug text,
   subtitle text,
   description text,
   seo_title text,
   seo_description text,
   instructor user_info,
   level course_level,
   language language_enum,
   cover_image_url text,
   promo_video_url text,
   welcome_message text,
   learning_objectives text[],
   prerequisites text[],
   is_published boolean,
   published_at timestamp with time zone,
   is_free boolean,
   price numeric,
   currency character,
   price_credits integer,
   enrollment_limit integer,
   estimated_duration_hours integer,
   created_at timestamp with time zone,
   updated_at timestamp with time zone,
   average_rating numeric,
   total_reviews bigint,
   total_enrollments bigint,
   total_lessons integer,
   modules jsonb,
   subject item_type,
   book item_type,
   grade item_type,
   enrollment jsonb,
   related_decks_ids uuid[],
   related_quizzes_ids uuid[],
   related_libraries_ids uuid[],
   school_id uuid
 )
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
    END as enrollment,
    c.related_decks_ids,
    c.related_quizzes_ids,
    c.related_libraries_ids,
    c.school_id
  from public.courses c
  left join public.profiles p on c.instructor_id = p.id
  left join public.subjects s on s.id = c.subject_id
  left join public.books b on b.id = c.book_id
  left join public.grades g on g.id = c.grade_id
  where (p_course_slug is not null and c.slug = p_course_slug)
     or (p_course_id is not null and c.id = p_course_id);
end;
$function$;

-- 2. get_deck_details
CREATE FUNCTION public.get_deck_details(p_deck_slug text DEFAULT NULL::text, p_deck_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
   id uuid,
   slug text,
   name text,
   description text,
   algorithm flashcard_algorithm,
   is_free boolean,
   price_credits integer,
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
   flashcards jsonb,
   average_rating numeric,
   total_reviews bigint,
   related_courses_ids uuid[],
   related_libraries_ids uuid[]
 )
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
    d.total_reviews::bigint as total_reviews,
    d.related_courses_ids,
    d.related_libraries_ids
  from public.decks d
  left join public.books b on b.id = d.book_id
  where (p_deck_slug is not null and d.slug = p_deck_slug)
     or (p_deck_id is not null and d.id = p_deck_id);
end;
$function$;

-- 3. get_quiz_details
CREATE FUNCTION public.get_quiz_details(p_quiz_slug text DEFAULT NULL::text, p_quiz_id uuid DEFAULT NULL::uuid)
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
   created_at timestamp with time zone,
   is_free boolean,
   price_credits integer,
   registration_open boolean,
   is_registered boolean,
   related_courses_ids uuid[],
   related_decks_ids uuid[],
   school_id uuid
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
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
    q.created_at,
    q.is_free,
    q.price_credits,
    public.quiz_registration_open(q.id) as registration_open,
    CASE
      WHEN (select auth.uid()) IS NOT NULL THEN exists (
        SELECT 1 FROM public.quiz_registrations qr
        WHERE qr.quiz_id = q.id AND qr.student_id = (select auth.uid())
      )
      ELSE false
    END as is_registered,
    q.related_courses_ids,
    q.related_decks_ids,
    q.school_id
  from public.quizzes q
  where (p_quiz_slug is not null and q.slug = p_quiz_slug)
     or (p_quiz_id is not null and q.id = p_quiz_id);
end;
$function$;

-- 4. get_library_details
CREATE FUNCTION public.get_library_details(p_library_slug text DEFAULT NULL::text, p_library_id uuid DEFAULT NULL::uuid)
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
   subject item_type,
   related_courses_ids uuid[],
   related_decks_ids uuid[]
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
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
    ROW(s.id, s.name)::item_type as subject,
    l.related_courses_ids,
    l.related_decks_ids
  from public.libraries l
  left join public.books b on b.id = l.book_id
  left join public.categories c on c.id = l.category_id
  left join public.grades g on g.id = l.grade_id
  left join public.subjects s on s.id = l.subject_id
  where (p_library_slug is not null and l.slug = p_library_slug)
     or (p_library_id is not null and l.id = p_library_id);
end;
$function$;
