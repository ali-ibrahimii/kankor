set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_app_notification(p_user_id uuid, p_type public.notification_type, p_title text, p_message text DEFAULT NULL::text, p_related_entity_type text DEFAULT NULL::text, p_related_entity_id uuid DEFAULT NULL::uuid, p_actor_id uuid DEFAULT NULL::uuid)
 RETURNS public.notifications
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_notification public.notifications;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE WARNING 'Recipient user ID % not found for notification. Notification not created.', p_user_id;
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    actor_id
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_related_entity_type,
    p_related_entity_id,
    p_actor_id
  )
  RETURNING * INTO new_notification;

  RETURN new_notification;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enroll_user_in_course(p_course_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.enrollments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  course_record public.courses;
  new_enrollment public.enrollments;
  current_enrollment_count int;
  user_profile public.profiles;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided to enroll in a course.';
  end if;

  select * into course_record from public.courses where id = p_course_id;
  select * into user_profile from public.profiles where id = p_user_id;

  if course_record is null then
    raise exception 'Course not found: ID %', p_course_id;
  end if;
  if user_profile is null then
    raise exception 'User profile not found: ID %', p_user_id;
  end if;

  if not course_record.is_published then
    raise exception 'Cannot enroll in an unpublished course: %', course_record.title;
  end if;

  -- Check if already enrolled
  if exists (select 1 from public.enrollments where user_id = p_user_id and course_id = p_course_id) then
    raise exception 'User % is already enrolled in course %.', user_profile.full_name, course_record.title;
  end if;

  -- Check enrollment limit (courses.enrollment_limit = -1 means unlimited)
  if course_record.enrollment_limit <> -1 then
    select count(*) into current_enrollment_count from public.enrollments where course_id = p_course_id;
    if current_enrollment_count >= course_record.enrollment_limit then
      raise exception 'Enrollment limit reached for course: %.', course_record.title;
    end if;
  end if;

  insert into public.enrollments (user_id, course_id)
  values (p_user_id, p_course_id)
  returning * into new_enrollment;

  -- Notification for instructor
  perform public.create_app_notification(
    p_user_id := course_record.instructor_id,
    p_type := 'new_course_enrollment',
    p_title := 'New Enrollment: ' || course_record.title,
    p_message := user_profile.full_name || ' has enrolled in your course "' || course_record.title || '".',
    p_related_entity_type := 'courses',
    p_related_entity_id := p_course_id,
    p_actor_id := p_user_id
  );

  return new_enrollment;
end;
$function$
;


