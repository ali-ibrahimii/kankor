-- ─────────────────────────────────────────────────────────────────────────
-- get_course_card_stats: bulk lesson/enrollment counts + total lesson time
-- for a set of courses.
--
-- Same shape and rationale as get_deck_card_counts
-- (20260708111525_deck_card_counts.sql): `enrollments` is not readable by
-- anyone but the student themselves and admins, and `lessons` requires
-- can_view_course(), so the course *cards* (public catalog, instructor,
-- school, agency and admin lists) could not show "۱۲ درس · ۳ ساعت · ۲۴
-- شاگرد" without either an N+1 per card or leaking row content.
--
-- SECURITY DEFINER exposes only counts and the summed lesson duration (which
-- get_course_details already shows publicly on the course page), never row
-- content, so it is safe to call from the signed-out-accessible catalog.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_course_card_stats(p_course_ids uuid[])
RETURNS TABLE(
  course_id uuid,
  lessons_count bigint,
  lessons_minutes bigint,
  enrollments_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
  select
    c.id as course_id,
    coalesce(l.lessons_count, 0) as lessons_count,
    coalesce(l.lessons_minutes, 0) as lessons_minutes,
    coalesce(e.enrollments_count, 0) as enrollments_count
  from public.courses c
  left join (
    select
      l.course_id,
      count(*) as lessons_count,
      coalesce(sum(l.estimated_duration_minutes), 0) as lessons_minutes
    from public.lessons l
    where l.course_id = any(p_course_ids)
    group by l.course_id
  ) l on l.course_id = c.id
  left join (
    select e.course_id, count(*) as enrollments_count
    from public.enrollments e
    where e.course_id = any(p_course_ids)
    group by e.course_id
  ) e on e.course_id = c.id
  where c.id = any(p_course_ids);
$function$;

revoke all on function public.get_course_card_stats(uuid[]) from public;
grant execute on function public.get_course_card_stats(uuid[]) to anon, authenticated;
