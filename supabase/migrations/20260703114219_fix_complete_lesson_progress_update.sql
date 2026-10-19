-- The RLS review migration (20260702151515) recreated complete_lesson_for_user
-- without SECURITY DEFINER. Students have no UPDATE policy on enrollments (nor
-- INSERT on certificates/notifications for others), so the enrollment progress
-- update silently affected 0 rows and course completion would fail outright.
-- Restore SECURITY DEFINER — this time with an explicit authorization guard:
-- API callers may only complete lessons for themselves, unless they are the
-- course instructor, an admin, or the service role.
CREATE OR REPLACE FUNCTION public.complete_lesson_for_user(p_lesson_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.lesson_progress
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

