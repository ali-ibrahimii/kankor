-- Course certificate management (round 6, feature: گواهینامه).
--
-- Instructors and admins can control the certificate of each course:
--   * `courses.certificate_enabled` — whether completing the course issues a
--     certificate at all (default on, so existing behavior is preserved).
--   * `certificates.revoked_at/revoked_by` — revoke/restore an issued
--     certificate; verification then reports it as revoked.
--   * manager policies on `certificates` so the course instructor and admins
--     can list and control their courses' certificates.

alter table public.courses
  add column if not exists certificate_enabled boolean not null default true;

alter table public.certificates
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references auth.users (id);

-- ─── Manager access (instructor of the course, school admins, platform admins)
-- can_manage_course(p_course_id, p_school_id default null, p_user_id default
-- auth.uid()) already encodes exactly that; policies are OR-ed with the
-- existing owner policies.

drop policy if exists "managers_select_course_certificates" on public.certificates;
create policy "managers_select_course_certificates"
  on public.certificates for select
  to authenticated
  using (public.can_manage_course (course_id));

drop policy if exists "managers_update_course_certificates" on public.certificates;
create policy "managers_update_course_certificates"
  on public.certificates for update
  to authenticated
  using (public.can_manage_course (course_id))
  with check (public.can_manage_course (course_id));

-- ─── Issuance gate ──────────────────────────────────────────────────────────
-- complete_lesson_for_user inserts the certificates row at 100 % progress.
-- Latest definition lives in 20260703114219_fix_complete_lesson_progress_update;
-- reproduced here with the certificate_enabled gate around issuance.

create or replace function public.complete_lesson_for_user(p_lesson_id uuid, p_user_id uuid default auth.uid())
 returns public.lesson_progress
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  enrollment_record public.enrollments;
  lesson_record public.lessons;
  course_record public.courses;
  user_profile public.profiles;
  updated_lesson_progress public.lesson_progress;
  total_mandatory_lessons_in_course int;
  completed_mandatory_lessons_by_user int;
  total_lessons_in_course int;
  completed_lessons_by_user int;
  new_course_progress_percentage smallint;
  new_certificate_id uuid;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into lesson_record from public.lessons where id = p_lesson_id;
  if lesson_record is null then
    raise exception 'Lesson not found: ID %', p_lesson_id;
  end if;

  select * into course_record from public.courses where id = lesson_record.course_id;
  select * into user_profile from public.profiles where id = p_user_id;

  -- SECURITY DEFINER guard: when called through the API, only the user
  -- themselves, the course instructor, an admin, or the service role may
  -- record completion for p_user_id.
  if nullif(current_setting('request.jwt.claims', true), '') is not null
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    if auth.uid() is null
       or (auth.uid() <> p_user_id
           and not public.is_course_instructor(course_record.id, auth.uid())
           and not public.is_admin(auth.uid())) then
      raise exception 'Not authorized to complete this lesson for user %.', p_user_id;
    end if;
  end if;

  select * into enrollment_record
  from public.enrollments
  where user_id = p_user_id and course_id = course_record.id;

  if enrollment_record is null then
    raise exception 'User % is not enrolled in the course "%" containing this lesson.', user_profile.full_name, course_record.title;
  end if;

  if enrollment_record.completed_at is not null then
    raise warning 'Course "%" is already marked as completed by user %.', course_record.title, user_profile.full_name;
  end if;

  insert into public.lesson_progress (enrollment_id, lesson_id, user_id, is_completed, completed_at, last_accessed_at)
  values (enrollment_record.id, p_lesson_id, p_user_id, true, now(), now())
  on conflict (enrollment_id, lesson_id) do update
  set
    is_completed = true,
    completed_at = coalesce(public.lesson_progress.completed_at, now()),
    last_accessed_at = now()
  returning * into updated_lesson_progress;

  select count(*) into total_mandatory_lessons_in_course
  from public.lessons l_count
  where l_count.course_id = course_record.id and l_count.is_mandatory = true;

  if total_mandatory_lessons_in_course > 0 then
    select count(distinct lp.lesson_id) into completed_mandatory_lessons_by_user
    from public.lesson_progress lp
    join public.lessons l_check on lp.lesson_id = l_check.id
    where lp.enrollment_id = enrollment_record.id
      and l_check.course_id = course_record.id
      and l_check.is_mandatory = true
      and lp.is_completed = true;

    new_course_progress_percentage = least(100, (completed_mandatory_lessons_by_user * 100 / total_mandatory_lessons_in_course))::smallint;
  else
    select count(*) into total_lessons_in_course from public.lessons l_count where l_count.course_id = course_record.id;

    select count(distinct lp.lesson_id) into completed_lessons_by_user
    from public.lesson_progress lp
    join public.lessons l_check on lp.lesson_id = l_check.id
    where lp.enrollment_id = enrollment_record.id and l_check.course_id = course_record.id and lp.is_completed = true;

    if total_lessons_in_course > 0 and completed_lessons_by_user = total_lessons_in_course then
      new_course_progress_percentage = 100;
    elsif total_lessons_in_course = 0 then
      new_course_progress_percentage = 100;
    else
      new_course_progress_percentage = enrollment_record.progress_percentage;
    end if;
  end if;

  update public.enrollments
  set
    progress_percentage = new_course_progress_percentage,
    last_accessed_lesson_id = p_lesson_id,
    updated_at = now()
  where id = enrollment_record.id;

  if new_course_progress_percentage = 100 and enrollment_record.completed_at is null then
    update public.enrollments
    set completed_at = now()
    where id = enrollment_record.id;

    -- Certificate issuance (controlled per course by instructors/admins).
    if course_record.certificate_enabled then
      insert into public.certificates (user_id, course_id, course_title, user_full_name, verification_code)
      values (
        p_user_id,
        course_record.id,
        course_record.title,
        user_profile.full_name,
        upper(substr(md5(random()::text || clock_timestamp()::text), 1, 16))
      ) returning id into new_certificate_id;

      update public.enrollments set certificate_id = new_certificate_id where id = enrollment_record.id;

      perform public.create_app_notification(
        p_user_id := p_user_id,
        p_type := 'course_completion',
        p_title := 'Congratulations! Course Completed: ' || course_record.title,
        p_message := 'You have successfully completed "' || course_record.title || '". Your certificate is now available.',
        p_related_entity_type := 'certificate',
        p_related_entity_id := new_certificate_id,
        p_actor_id := null
      );
    end if;

    perform public.create_app_notification(
      p_user_id := course_record.instructor_id,
      p_type := 'course_completion',
      p_title := 'Student Completed Course: ' || course_record.title,
      p_message := coalesce(user_profile.full_name, 'A student') || ' has completed your course "' || course_record.title || '".',
      p_related_entity_type := 'enrollment',
      p_related_entity_id := enrollment_record.id,
      p_actor_id := p_user_id
    );
  end if;

  return updated_lesson_progress;
end;
$function$;

-- ─── Verification reports revocation ────────────────────────────────────────
-- Same signature as 20260713000000 plus an is_revoked flag so the public
-- verify page can mark revoked certificates instead of showing them as valid.

drop function if exists public.verify_certificate(text);
create or replace function public.verify_certificate(p_verification_code text)
returns table (
	user_full_name text,
	course_title text,
	issued_at timestamptz,
	created_at timestamptz,
	is_revoked boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
	select
		c.user_full_name,
		c.course_title,
		c.issued_at,
		c.created_at,
		(c.revoked_at is not null) as is_revoked
	from public.certificates c
	where c.verification_code = upper(trim(p_verification_code));
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
