-- get_course_details returned `modules: null` (and each module's `lessons:
-- null`) for any course with zero modules/lessons, since jsonb_agg() over an
-- empty set yields SQL NULL rather than an empty array. The web client reads
-- `course.modules.length` and `module.lessons.length` unconditionally
-- (course-detail-client.tsx, course-module-list.tsx), which threw
-- "Cannot read properties of null (reading 'length')" and crashed the whole
-- course detail page for any freshly-created, moduleless course.

drop function if exists "public"."get_course_details"(p_course_slug text, p_course_id uuid);

CREATE OR REPLACE FUNCTION public.get_course_details(p_course_slug text DEFAULT NULL::text, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, title text, slug text, subtitle text, description text, seo_title text, seo_description text, instructor user_info, level course_level, language language_enum, cover_image_url text, promo_video_url text, welcome_message text, learning_objectives text[], prerequisites text[], is_published boolean, published_at timestamp with time zone, is_free boolean, price numeric, currency character, price_credits integer, enrollment_limit integer, estimated_duration_hours integer, created_at timestamp with time zone, updated_at timestamp with time zone, average_rating numeric, total_reviews bigint, total_enrollments bigint, total_lessons integer, modules jsonb, subject item_type, book item_type, grade item_type, enrollment jsonb)
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
    c.price_credits,
    c.enrollment_limit,
    c.estimated_duration_hours,
    c.created_at,
    c.updated_at,
    (select avg(r.rating)::numeric(2,1) from public.reviews r where r.course_id = c.id) as average_rating,
    (select count(r.id) from public.reviews r where r.course_id = c.id) as total_reviews,
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
