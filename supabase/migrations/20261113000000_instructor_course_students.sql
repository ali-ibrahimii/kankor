-- ─────────────────────────────────────────────────────────────────────────
-- get_course_students: the roster behind the instructor course-detail
-- "Students" tab.
--
-- `enrollments` is readable only by the student themself and admins, so an
-- instructor could see how many students a course has (get_course_card_stats)
-- but never who they are — the "Student management" tab had no data source.
--
-- This SECURITY DEFINER RPC exposes each enrollment (name, avatar, date,
-- progress) only to the course instructor — same permission rule as
-- set_course_published_status — or a platform admin. Row content is limited
-- to what an instructor legitimately needs to run their class; nothing else
-- from `profiles` or `enrollments` leaks.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_course_students(p_course_id uuid)
RETURNS TABLE(
  student_id uuid,
  full_name text,
  avatar_url text,
  enrolled_at timestamptz,
  progress_percentage integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
begin
  if not (public.is_course_instructor(p_course_id) or public.is_admin()) then
    raise exception 'Permission denied: Only the course instructor or an admin can view the student roster.';
  end if;

  return query
  select
    e.user_id as student_id,
    coalesce(p.full_name, '') as full_name,
    p.avatar_url,
    coalesce(e.enrolled_at, e.created_at) as enrolled_at,
    coalesce(e.progress_percentage, 0)::integer as progress_percentage
  from public.enrollments e
  left join public.profiles p on p.id = e.user_id
  where e.course_id = p_course_id
  order by coalesce(e.enrolled_at, e.created_at) desc;
end;
$function$;

revoke all on function public.get_course_students(uuid) from public;
grant execute on function public.get_course_students(uuid) to authenticated;
