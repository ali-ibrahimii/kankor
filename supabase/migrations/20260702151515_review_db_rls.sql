drop policy "Admin can manage course" on "public"."courses";

drop policy "Allow instructors to create courses" on "public"."courses";

drop policy "Instructor can delete their course" on "public"."courses";

drop policy "Instructor can view their courses" on "public"."courses";

drop policy "Allow admin to update" on "public"."departments";

drop policy "Instructor can create a lesson content" on "public"."lesson_content_blocks";

drop policy "Instructor can delete a lesson content" on "public"."lesson_content_blocks";

drop policy "Instructor can read a lesson content" on "public"."lesson_content_blocks";

drop policy "Instructor can update a lesson content" on "public"."lesson_content_blocks";

drop policy "Instructor can create a course module" on "public"."modules";

drop policy "Instructor can delete a course module" on "public"."modules";

drop policy "Instructor can read a course module" on "public"."modules";

drop policy "Instructor can update a course module" on "public"."modules";

drop policy "Allow authenticated users to view all profiles" on "public"."profiles";

drop policy "Instructors and admins manage question options" on "public"."question_options";

drop policy "Instructors and admins manage questions" on "public"."questions";

drop policy "Admins can delete any quiz attempt" on "public"."quiz_attempts";

drop policy "Admins can insert any quiz attempt" on "public"."quiz_attempts";

drop policy "Admins can update any quiz attempt" on "public"."quiz_attempts";

drop policy "Enrolled users and staff can view lesson quizzes" on "public"."quizzes";

drop policy "Instructors and admins manage quizzes" on "public"."quizzes";

drop policy "Resource members can read quizzes" on "public"."quizzes";

drop policy "Instructors can view answers for their course quizzes" on "public"."answers";

drop policy "Students can view their own answers" on "public"."answers";

drop policy "Allow admins to view all bookmarks" on "public"."bookmarks";

drop policy "Allow users to delete their own bookmarks" on "public"."bookmarks";

drop policy "Allow users to insert their own bookmarks" on "public"."bookmarks";

drop policy "Allow users to select their own bookmarks" on "public"."bookmarks";

drop policy "Allow users to update their own bookmarks" on "public"."bookmarks";

drop policy "Allow admin to update books" on "public"."books";

drop policy "Allow admins to create books" on "public"."books";

drop policy "Allow admins to create categories" on "public"."categories";

drop policy "Allow admins to update categories" on "public"."categories";

drop policy "Admins can delete any certificate" on "public"."certificates";

drop policy "Admins can insert any certificate" on "public"."certificates";

drop policy "Allow users to view their own certificates" on "public"."certificates";

drop policy "Admin can update code" on "public"."code";

drop policy "Enable read access for all users" on "public"."code";

drop policy "Anyone can view a published course" on "public"."courses";

drop policy "Admin can create department" on "public"."departments";

drop policy "Authors and staff can delete discussion posts" on "public"."discussion_posts";

drop policy "Authors and staff can update discussion posts" on "public"."discussion_posts";

drop policy "Enrolled users and staff can view discussion posts" on "public"."discussion_posts";

drop policy "Enrolled users can create discussion posts" on "public"."discussion_posts";

drop policy "Authors and staff can delete discussion threads" on "public"."discussion_threads";

drop policy "Authors and staff can update discussion threads" on "public"."discussion_threads";

drop policy "Enrolled users and staff can view discussion threads" on "public"."discussion_threads";

drop policy "Enrolled users can create discussion threads" on "public"."discussion_threads";

drop policy "Allow users to enroll themselves" on "public"."enrollments";

drop policy "Allow users to view their own enrollments" on "public"."enrollments";

drop policy "Allow admin to insert" on "public"."faculties";

drop policy "Allow admin to update" on "public"."faculties";

drop policy "Allow admin to insert" on "public"."forms";

drop policy "Allow admin to update" on "public"."forms";

drop policy "Enable read access for all users" on "public"."grades";

drop policy "Anyone can view a published course lesson content" on "public"."lesson_content_blocks";

drop policy "Instructor can create a course lesson" on "public"."lessons";

drop policy "Instructor can delete a course lesson" on "public"."lessons";

drop policy "Instructor can read a course lesson" on "public"."lessons";

drop policy "Instructor can update a course lesson" on "public"."lessons";

drop policy "Allow users to update (mark as read) their own notifications" on "public"."notifications";

drop policy "Allow users to view their own notifications" on "public"."notifications";

drop policy "Allow users to view their own payments" on "public"."payments";

drop policy "Admins can delete any profile" on "public"."profiles";

drop policy "Admins can insert any profile" on "public"."profiles";

drop policy "Admins can select all profiles" on "public"."profiles";

drop policy "Admins can update any profile" on "public"."profiles";

drop policy "Allow users to view their own quiz attempts" on "public"."quiz_attempts";

drop policy "schools owner can update" on "public"."schools";

drop policy "Allow instructors and admins to create tags" on "public"."tags";

drop policy "Enable read access for all users" on "public"."universities";

drop policy "Enable read access for all users" on "public"."universities_faculties";

revoke delete on table "public"."answer_sheets" from "anon";

revoke insert on table "public"."answer_sheets" from "anon";

revoke references on table "public"."answer_sheets" from "anon";

revoke select on table "public"."answer_sheets" from "anon";

revoke trigger on table "public"."answer_sheets" from "anon";

revoke update on table "public"."answer_sheets" from "anon";

revoke delete on table "public"."answer_sheets" from "authenticated";

revoke insert on table "public"."answer_sheets" from "authenticated";

revoke references on table "public"."answer_sheets" from "authenticated";

revoke trigger on table "public"."answer_sheets" from "authenticated";

revoke update on table "public"."answer_sheets" from "authenticated";

revoke delete on table "public"."answers" from "anon";

revoke insert on table "public"."answers" from "anon";

revoke references on table "public"."answers" from "anon";

revoke select on table "public"."answers" from "anon";

revoke trigger on table "public"."answers" from "anon";

revoke update on table "public"."answers" from "anon";

revoke delete on table "public"."bookmarks" from "anon";

revoke insert on table "public"."bookmarks" from "anon";

revoke references on table "public"."bookmarks" from "anon";

revoke select on table "public"."bookmarks" from "anon";

revoke trigger on table "public"."bookmarks" from "anon";

revoke update on table "public"."bookmarks" from "anon";

revoke delete on table "public"."certificates" from "anon";

revoke insert on table "public"."certificates" from "anon";

revoke references on table "public"."certificates" from "anon";

revoke select on table "public"."certificates" from "anon";

revoke trigger on table "public"."certificates" from "anon";

revoke update on table "public"."certificates" from "anon";

revoke delete on table "public"."deck_cards" from "anon";

revoke insert on table "public"."deck_cards" from "anon";

revoke references on table "public"."deck_cards" from "anon";

revoke select on table "public"."deck_cards" from "anon";

revoke trigger on table "public"."deck_cards" from "anon";

revoke update on table "public"."deck_cards" from "anon";

revoke delete on table "public"."enrollments" from "anon";

revoke insert on table "public"."enrollments" from "anon";

revoke references on table "public"."enrollments" from "anon";

revoke select on table "public"."enrollments" from "anon";

revoke trigger on table "public"."enrollments" from "anon";

revoke update on table "public"."enrollments" from "anon";

revoke delete on table "public"."flashcards" from "anon";

revoke insert on table "public"."flashcards" from "anon";

revoke references on table "public"."flashcards" from "anon";

revoke select on table "public"."flashcards" from "anon";

revoke trigger on table "public"."flashcards" from "anon";

revoke update on table "public"."flashcards" from "anon";

revoke delete on table "public"."lesson_content_blocks" from "anon";

revoke insert on table "public"."lesson_content_blocks" from "anon";

revoke references on table "public"."lesson_content_blocks" from "anon";

revoke select on table "public"."lesson_content_blocks" from "anon";

revoke trigger on table "public"."lesson_content_blocks" from "anon";

revoke update on table "public"."lesson_content_blocks" from "anon";

revoke delete on table "public"."lesson_progress" from "anon";

revoke insert on table "public"."lesson_progress" from "anon";

revoke references on table "public"."lesson_progress" from "anon";

revoke select on table "public"."lesson_progress" from "anon";

revoke trigger on table "public"."lesson_progress" from "anon";

revoke update on table "public"."lesson_progress" from "anon";

revoke delete on table "public"."modules" from "anon";

revoke insert on table "public"."modules" from "anon";

revoke references on table "public"."modules" from "anon";

revoke select on table "public"."modules" from "anon";

revoke trigger on table "public"."modules" from "anon";

revoke update on table "public"."modules" from "anon";

revoke delete on table "public"."notes" from "anon";

revoke insert on table "public"."notes" from "anon";

revoke references on table "public"."notes" from "anon";

revoke select on table "public"."notes" from "anon";

revoke trigger on table "public"."notes" from "anon";

revoke update on table "public"."notes" from "anon";

revoke delete on table "public"."notifications" from "anon";

revoke insert on table "public"."notifications" from "anon";

revoke references on table "public"."notifications" from "anon";

revoke select on table "public"."notifications" from "anon";

revoke trigger on table "public"."notifications" from "anon";

revoke update on table "public"."notifications" from "anon";

revoke delete on table "public"."payments" from "anon";

revoke insert on table "public"."payments" from "anon";

revoke references on table "public"."payments" from "anon";

revoke select on table "public"."payments" from "anon";

revoke trigger on table "public"."payments" from "anon";

revoke update on table "public"."payments" from "anon";

revoke delete on table "public"."quiz_attempts" from "anon";

revoke insert on table "public"."quiz_attempts" from "anon";

revoke references on table "public"."quiz_attempts" from "anon";

revoke select on table "public"."quiz_attempts" from "anon";

revoke trigger on table "public"."quiz_attempts" from "anon";

revoke update on table "public"."quiz_attempts" from "anon";

revoke delete on table "public"."quizzes" from "anon";

revoke insert on table "public"."quizzes" from "anon";

revoke references on table "public"."quizzes" from "anon";

revoke select on table "public"."quizzes" from "anon";

revoke trigger on table "public"."quizzes" from "anon";

revoke update on table "public"."quizzes" from "anon";

revoke delete on table "public"."school_members" from "anon";

revoke insert on table "public"."school_members" from "anon";

revoke references on table "public"."school_members" from "anon";

revoke select on table "public"."school_members" from "anon";

revoke trigger on table "public"."school_members" from "anon";

revoke truncate on table "public"."school_members" from "anon";

revoke update on table "public"."school_members" from "anon";

revoke delete on table "public"."schools" from "anon";

revoke insert on table "public"."schools" from "anon";

revoke references on table "public"."schools" from "anon";

revoke select on table "public"."schools" from "anon";

revoke trigger on table "public"."schools" from "anon";

revoke update on table "public"."schools" from "anon";

drop function if exists "public"."is_course_instructor"(check_user_id uuid, check_course_id uuid);

drop function if exists "public"."is_enrolled"(check_user_id uuid, check_course_id uuid);

alter table "public"."courses" add column "school_id" uuid;

alter table "public"."courses" add column "visibility" public.visibility not null default 'public'::public.visibility;

alter table "public"."profiles" add column "active_school_id" uuid;

alter table "public"."question_options" add column "quiz_id" uuid;

alter table "public"."quizzes" add column "user_id" uuid;

alter table "public"."quizzes" add column "visibility" public.visibility not null default 'public'::public.visibility;

alter table "public"."courses" add constraint "courses_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."courses" validate constraint "courses_school_id_fkey";

alter table "public"."profiles" add constraint "profiles_active_school_id_fkey" FOREIGN KEY (active_school_id) REFERENCES public.schools(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_active_school_id_fkey";

alter table "public"."question_options" add constraint "question_options_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE SET NULL not valid;

alter table "public"."question_options" validate constraint "question_options_quiz_id_fkey";

alter table "public"."quizzes" add constraint "quizzes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."quizzes" validate constraint "quizzes_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.can_manage_course(p_course_id uuid, p_school_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
    v_school_id uuid := p_school_id;
begin
    if v_school_id is null then
        select school_id
        into v_school_id
        from courses
        where id = p_course_id;
    end if;

    return
        is_course_instructor(p_course_id, p_user_id)
        or is_admin(p_user_id)
        or is_school_editor(v_school_id, p_user_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_manage_quiz(p_quiz_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
    v_owner_id uuid;
    v_school_id uuid;
begin
    select
        q.user_id,
        q.school_id
    into
        v_owner_id,
        v_school_id
    from quizzes q
    where q.id = p_quiz_id;

    if v_owner_id is not null and v_owner_id = p_user_id then
        return true;
    end if;

    if is_admin(p_user_id) then
        return true;
    end if;

    if v_school_id is not null
       and is_school_editor(v_school_id, p_user_id) then
        return true;
    end if;

    return false;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_course(p_course_id uuid, p_school_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
    v_school_id uuid := p_school_id;
begin
    if v_school_id is null then
        select school_id
        into v_school_id
        from courses
        where id = p_course_id;
    end if;

    return
        is_course_instructor(p_course_id, p_user_id)
        or is_admin(p_user_id)
        or is_school_member(v_school_id, p_user_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_quiz(p_quiz_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$select
    is_resource_shared_with_user(p_quiz_id, p_user_id)
    or is_quiz_public(p_quiz_id)
    or is_enrolled(
        (
            select get_course_id_from_lesson(q.lesson_id)
            from quizzes q
            where q.id = p_quiz_id
        ),
        p_user_id
    );$function$
;

CREATE OR REPLACE FUNCTION public.is_course_instructor(p_course_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
    select exists (
        select 1
        from courses
        where id = p_course_id
          and instructor_id = p_user_id
    );
$function$
;

CREATE OR REPLACE FUNCTION public.is_course_instructor_old(check_user_id uuid, check_course_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = check_course_id AND instructor_id = check_user_id
  );
END;$function$
;

CREATE OR REPLACE FUNCTION public.is_enrolled(p_course_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
    select exists (
        select 1
        from enrollments
        where course_id = p_course_id
          and user_id = p_user_id
    );
$function$
;

CREATE OR REPLACE FUNCTION public.is_enrolled_old(check_user_id uuid, check_course_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$begin
  return exists (
    select 1 from public.enrollments
    where course_id = check_course_id and user_id = check_user_id
  );
end;$function$
;

CREATE OR REPLACE FUNCTION public.is_quiz_public(p_quiz_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (
     select 1 
     from quizzes q
     where q.id = p_quiz_id
     and q.visibility = 'public'::public.visibility
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_school_editor(p_school_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
    v_active_school_id uuid;
begin
    if p_school_id is not null then
        return get_school_member_role(p_school_id, p_user_id) = any (
            array[
                'admin'::public.school_member_role,
                'owner'::public.school_member_role,
                'manager'::public.school_member_role
            ]
        );
    end if;

    select active_school_id
    into v_active_school_id
    from profiles
    where id = p_user_id;

    if v_active_school_id is not null then
        return get_school_member_role(v_active_school_id, p_user_id) = any (
            array[
                'admin'::public.school_member_role,
                'owner'::public.school_member_role,
                'manager'::public.school_member_role
            ]
        );
    end if;

    return false;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(p_user_id uuid, p_new_role public.user_role)
 RETURNS public.profiles
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$DECLARE
  updated_profile public.profiles;
BEGIN
  -- Authorization: Only an admin can perform this action.
  IF not is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Only admins can update user roles.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User profile not found for ID: %', p_user_id;
  END IF;

  UPDATE public.profiles
  SET role = p_new_role, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;$function$
;

CREATE OR REPLACE FUNCTION public.complete_and_grade_quiz_attempt(p_quiz_attempt_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.quiz_attempts
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  quiz_attempt_record public.quiz_attempts;
  quiz_record public.quizzes;
  lesson_record public.lessons;
  instructor_id_val uuid;
  total_score_for_attempt numeric(6,2);
  is_quiz_passed boolean;
  num_questions_awaiting_manual_grade int;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into quiz_attempt_record from public.quiz_attempts where id = p_quiz_attempt_id;
  if quiz_attempt_record is null then
    raise exception 'Quiz attempt not found: ID %', p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.user_id <> p_user_id then
    raise exception 'Permission denied: User % does not own quiz attempt %.', p_user_id, p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.completed_at is not null then
    raise warning 'Quiz attempt % is already completed.', p_quiz_attempt_id;
    return quiz_attempt_record;
  end if;

  select * into quiz_record from public.quizzes where id = quiz_attempt_record.quiz_id;
  if quiz_record is null then
    raise exception 'Associated quiz (ID %) not found for attempt %.', quiz_attempt_record.quiz_id, p_quiz_attempt_id;
  end if;

  select * into lesson_record from public.lessons where id = quiz_record.lesson_id;

  select coalesce(sum(a.points_awarded), 0)
  into total_score_for_attempt
  from public.answers a
  where a.quiz_attempt_id = p_quiz_attempt_id and a.is_correct is not null;

  select count(*)
  into num_questions_awaiting_manual_grade
  from public.answers a
  where a.quiz_attempt_id = p_quiz_attempt_id and a.is_correct is null;

  if num_questions_awaiting_manual_grade > 0 then
    update public.quiz_attempts
    set
      score = total_score_for_attempt,
      completed_at = now(),
      updated_at = now()
    where id = p_quiz_attempt_id
    returning * into quiz_attempt_record;

    perform public.create_app_notification(
      p_user_id := p_user_id,
      p_type := 'quiz_graded',
      p_title := 'Quiz Submitted: ' || quiz_record.title,
      p_message := 'Your quiz "' || quiz_record.title || '" has been submitted. Some questions require manual grading. Provisional score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '.',
      p_related_entity_type := 'quiz_attempt',
      p_related_entity_id := p_quiz_attempt_id,
      p_actor_id := p_user_id
    );

    select c.instructor_id into instructor_id_val
    from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = quiz_record.lesson_id;

    perform public.create_app_notification(
      p_user_id := instructor_id_val,
      p_type := 'new_assignment_submission',
      p_title := 'Quiz Needs Grading: ' || quiz_record.title,
      p_message := coalesce((select pf.full_name from public.profiles pf where pf.id = p_user_id), 'A student') || ' submitted the quiz "' || quiz_record.title || '" which requires manual grading.',
      p_related_entity_type := 'quiz_attempt',
      p_related_entity_id := p_quiz_attempt_id,
      p_actor_id := p_user_id
    );

    return quiz_attempt_record;
  end if;

  if quiz_record.passing_score_percentage is not null and quiz_attempt_record.max_score_possible > 0 then
    is_quiz_passed = (total_score_for_attempt * 100.0 / quiz_attempt_record.max_score_possible) >= quiz_record.passing_score_percentage;
  elsif quiz_record.passing_score_percentage is null then
    is_quiz_passed = true;
  else
    is_quiz_passed = false;
  end if;

  update public.quiz_attempts
  set
    score = total_score_for_attempt,
    passed = is_quiz_passed,
    completed_at = now(),
    updated_at = now()
  where id = p_quiz_attempt_id
  returning * into quiz_attempt_record;

  if is_quiz_passed and lesson_record.is_mandatory then
    perform public.complete_lesson_for_user(quiz_record.lesson_id, p_user_id);
  end if;

  perform public.create_app_notification(
    p_user_id := p_user_id,
    p_type := 'quiz_graded',
    p_title := 'Quiz Graded: ' || quiz_record.title,
    p_message := 'Your quiz "' || quiz_record.title || '" has been graded. Score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '. Status: ' || (case when is_quiz_passed then 'Passed' else 'Failed' end) || '.',
    p_related_entity_type := 'quiz_attempt',
    p_related_entity_id := p_quiz_attempt_id,
    p_actor_id := null
  );

  return quiz_attempt_record;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_lesson_for_user(p_lesson_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.lesson_progress
 LANGUAGE plpgsql
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

CREATE OR REPLACE FUNCTION public.create_app_notification(p_user_id uuid, p_type public.notification_type, p_title text, p_message text DEFAULT NULL::text, p_related_entity_type text DEFAULT NULL::text, p_related_entity_id uuid DEFAULT NULL::uuid, p_actor_id uuid DEFAULT NULL::uuid)
 RETURNS public.notifications
 LANGUAGE plpgsql
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

CREATE OR REPLACE FUNCTION public.create_school_members_on_schools_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
    insert into public.school_members (
        school_id,
        user_id,
        role
    )
    values (
        new.id,
        new.user_id,
        'owner'
    )
    on conflict (school_id, user_id) do nothing;

    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  claims jsonb;
  v_role public.user_role;
begin
  select role
  into v_role
  from public.profiles
  where id = (event->>'user_id')::uuid;

  v_role := coalesce(v_role, 'student'::public.user_role);

  claims := event->'claims';

  if claims->'app_metadata' is null then
    claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
  end if;

  claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(v_role));

  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_user_account()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  -- Ensure the user is authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Delete the authenticated user
  delete from auth.users
  where id = auth.uid();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enroll_user_in_course(p_course_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.enrollments
 LANGUAGE plpgsql
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

CREATE OR REPLACE FUNCTION public.get_course_id_from_lesson(check_lesson_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  resolved_course_id uuid;
begin
  select l.course_id into resolved_course_id
  from public.lessons l
  where l.id = check_lesson_id;

  return resolved_course_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_course_id_from_section(check_section_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  resolved_course_id uuid;
begin
  -- "section" here refers to public.modules, the real grouping entity above
  -- lessons; public.sections never existed in this schema.
  select m.course_id into resolved_course_id
  from public.modules m
  where m.id = check_section_id;

  return resolved_course_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS public.user_role
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_role public.user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL; -- Or a specific role for anonymous users if needed
  END IF;
  SELECT role INTO profile_role FROM public.profiles WHERE id = auth.uid();
  RETURN profile_role;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN NULL; -- User has an auth entry but no profile yet
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_quiz_by_entrance_code(p_entrance_code text)
 RETURNS public.quizzes
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  found_quiz public.quizzes;
begin
  if p_entrance_code is null or btrim(p_entrance_code) = '' then
    raise exception 'An entrance code must be provided.';
  end if;

  select * into found_quiz
  from public.quizzes
  where entrance_code = upper(btrim(p_entrance_code));

  if found_quiz is null then
    raise exception 'No quiz found for that entrance code.';
  end if;

  return found_quiz;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_quiz_questions_for_attempt(p_quiz_attempt_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(question_id uuid, question_text text, question_type public.question_type, order_index smallint, points smallint, hint text, image_content_block_id uuid, option_id uuid, option_text text, option_order_index smallint, match_target_text text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  attempt_record public.quiz_attempts;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into attempt_record from public.quiz_attempts where id = p_quiz_attempt_id;
  if attempt_record is null then
    raise exception 'Quiz attempt not found: ID %', p_quiz_attempt_id;
  end if;

  if attempt_record.user_id <> p_user_id then
    raise exception 'Permission denied: User % does not own quiz attempt %.', p_user_id, p_quiz_attempt_id;
  end if;

  return query
  select
    q.id,
    q.question_text,
    q.question_type,
    q.order_index,
    q.points,
    q.hint,
    q.image_content_block_id,
    qo.id,
    qo.option_text,
    qo.order_index,
    qo.match_target_text
  from public.questions q
  left join public.question_options qo on qo.question_id = q.id
  where q.quiz_id = attempt_record.quiz_id
  order by q.order_index asc, qo.order_index asc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_school_member_role(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.school_member_role
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  v_role public.school_member_role;
begin
  select sm.role
  into v_role
  from public.school_members sm
  where sm.school_id = p_school_id
    and sm.user_id = p_user_id;

  return v_role;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
 RETURNS public.user_role
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  jwt_role text;
  db_role public.user_role;
begin
  if user_id is null then
    return null;
  end if;

  jwt_role := auth.jwt() -> 'app_metadata' ->> 'role';

  if jwt_role is not null then
    begin
      return jwt_role::public.user_role;
    exception
      when invalid_text_representation then
        null;
    end;
  end if;

  select role
  into db_role
  from public.profiles
  where id = get_user_role.user_id;

  return db_role;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url, role, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'), 
    COALESCE(NEW.email, NULL),
    COALESCE(NEW.phone, NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.user_role,
    COALESCE(NEW.raw_user_meta_data->>'locale', 'fa')::public.language_enum
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.instructor_grade_answer_and_update_quiz(p_answer_id uuid, p_is_correct boolean, p_points_awarded numeric, p_instructor_feedback text DEFAULT NULL::text, p_instructor_id uuid DEFAULT auth.uid())
 RETURNS public.quiz_attempts
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  answer_record public.answers;
  question_id_val uuid;
  quiz_attempt_id_val uuid;
  quiz_attempt_record public.quiz_attempts;
  quiz_record public.quizzes;
  lesson_rec public.lessons;
  course_id_val uuid;
  total_score_for_attempt numeric(6,2);
  is_quiz_passed boolean;
  num_questions_still_awaiting_manual_grade int;
  was_already_passed boolean;
begin
  select a.quiz_attempt_id, a.question_id
  into quiz_attempt_id_val, question_id_val
  from public.answers a
  where a.id = p_answer_id;

  if quiz_attempt_id_val is null then
    raise exception 'Answer ID % not found.', p_answer_id;
  end if;

  select qz.* into quiz_record
  from public.quizzes qz
  join public.questions q on qz.id = q.quiz_id
  where q.id = question_id_val;

  course_id_val := public.get_course_id_from_lesson(quiz_record.lesson_id);

  if not (public.is_course_instructor(p_instructor_id, course_id_val) or public.get_current_user_role() = 'admin') then
    raise exception 'Permission denied: Not an instructor for this course or an admin.';
  end if;

  update public.answers
  set
    is_correct = p_is_correct,
    points_awarded = p_points_awarded,
    feedback = coalesce(p_instructor_feedback, feedback)
  where id = p_answer_id
  returning * into answer_record;

  select * into quiz_attempt_record from public.quiz_attempts where id = answer_record.quiz_attempt_id;
  was_already_passed := quiz_attempt_record.passed is true;

  select coalesce(sum(a.points_awarded), 0)
  into total_score_for_attempt
  from public.answers a
  where a.quiz_attempt_id = quiz_attempt_record.id and a.points_awarded is not null;

  select count(*)
  into num_questions_still_awaiting_manual_grade
  from public.answers a
  where a.quiz_attempt_id = quiz_attempt_record.id and a.is_correct is null and a.id <> p_answer_id;

  if num_questions_still_awaiting_manual_grade > 0 then
    update public.quiz_attempts
    set score = total_score_for_attempt, updated_at = now()
    where id = quiz_attempt_record.id
    returning * into quiz_attempt_record;

    raise notice 'Answer graded. Quiz attempt % still has % other questions awaiting manual grading.', quiz_attempt_record.id, num_questions_still_awaiting_manual_grade;
    return quiz_attempt_record;
  end if;

  if quiz_record.passing_score_percentage is not null and quiz_attempt_record.max_score_possible > 0 then
    is_quiz_passed = (total_score_for_attempt * 100.0 / quiz_attempt_record.max_score_possible) >= quiz_record.passing_score_percentage;
  elsif quiz_record.passing_score_percentage is null then
    is_quiz_passed = true;
  else
    is_quiz_passed = false;
  end if;

  update public.quiz_attempts
  set
    score = total_score_for_attempt,
    passed = is_quiz_passed,
    completed_at = coalesce(quiz_attempt_record.completed_at, now()),
    feedback_from_instructor = coalesce(quiz_attempt_record.feedback_from_instructor, '') || 'Answer ID ' || p_answer_id || ' graded. ',
    updated_at = now()
  where id = quiz_attempt_record.id
  returning * into quiz_attempt_record;

  if is_quiz_passed and not was_already_passed then
    select * into lesson_rec from public.lessons where id = quiz_record.lesson_id;
    if lesson_rec.is_mandatory then
      perform public.complete_lesson_for_user(quiz_record.lesson_id, quiz_attempt_record.user_id);
    end if;
  end if;

  perform public.create_app_notification(
    p_user_id := quiz_attempt_record.user_id,
    p_type := 'quiz_graded',
    p_title := 'Quiz Update: ' || quiz_record.title,
    p_message := 'An answer in your quiz "' || quiz_record.title || '" has been graded by the instructor. New Score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '. Status: ' || (case when is_quiz_passed then 'Passed' else 'Failed' end) || '.',
    p_related_entity_type := 'quiz_attempt',
    p_related_entity_id := quiz_attempt_record.id,
    p_actor_id := p_instructor_id
  );

  return quiz_attempt_record;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  return is_user_a('admin'::public.user_role, user_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_course_published(p_course_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM courses c
    WHERE c.id = p_course_id
      AND c.is_published
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_enrolled_deck(p_deck_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
    select exists (
        select 1
        from enrollments e
        where e.deck_id = p_deck_id
          and e.user_id = p_user_id
    );
$function$
;

CREATE OR REPLACE FUNCTION public.is_instructor(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  return is_user_a('instructor'::public.user_role, user_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_school_admin(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select get_school_member_role(p_school_id, p_user_id) = 'owner';
$function$
;

CREATE OR REPLACE FUNCTION public.is_school_member(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
select exists (
    select 1
    from school_members
    where school_id = p_school_id
      and user_id = p_user_id
);
$function$
;

CREATE OR REPLACE FUNCTION public.is_school_owner(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select get_school_member_role(p_school_id, p_user_id) = 'owner';
$function$
;

CREATE OR REPLACE FUNCTION public.is_student(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  return is_user_a('student'::public.user_role, user_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_a(role public.user_role, user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_role public.user_role;
begin
  v_role := get_user_role(user_id);

  return v_role = role;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_course_published_status(p_course_id uuid, p_is_published boolean)
 RETURNS public.courses
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  updated_course public.courses;
  current_user_id uuid := auth.uid();
  current_user_role public.user_role;
begin
  select public.get_current_user_role() into current_user_role;

  if not exists (select 1 from public.courses where id = p_course_id) then
    raise exception 'Course not found for ID: %', p_course_id;
  end if;

  if not (public.is_course_instructor(current_user_id, p_course_id) or current_user_role = 'admin') then
    raise exception 'Permission denied: Only the course instructor or an admin can change publication status.';
  end if;

  update public.courses
  set
    is_published = p_is_published,
    published_at = case
                     when p_is_published = true and published_at is null then now()
                     when p_is_published = false then null
                     else published_at
                   end,
    updated_at = now()
  where id = p_course_id
  returning * into updated_course;

  return updated_course;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.start_quiz_attempt(p_quiz_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.quiz_attempts
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  enrollment_record public.enrollments;
  quiz_record public.quizzes;
  lesson_record public.lessons;
  course_id_val uuid;
  previous_attempts_count smallint;
  new_quiz_attempt public.quiz_attempts;
  max_score_possible_for_quiz numeric(6,2);
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into quiz_record from public.quizzes where id = p_quiz_id;
  if quiz_record is null then
    raise exception 'Quiz not found: ID %', p_quiz_id;
  end if;

  if quiz_record.lesson_id is not null then
    -- Lesson-attached quiz: requires an active enrollment in the owning course.
    select * into lesson_record from public.lessons where id = quiz_record.lesson_id;
    if lesson_record is null then
      raise exception 'Associated lesson for quiz ID % not found (Lesson ID %)', p_quiz_id, quiz_record.lesson_id;
    end if;

    course_id_val := public.get_course_id_from_lesson(lesson_record.id);
    if course_id_val is null then
      raise exception 'Could not determine course for the quiz ID %.', p_quiz_id;
    end if;

    select * into enrollment_record
    from public.enrollments
    where user_id = p_user_id and course_id = course_id_val;

    if enrollment_record is null then
      raise exception 'User is not enrolled in the course containing this quiz.';
    end if;

    if enrollment_record.completed_at is not null then
      raise warning 'User has already completed this course. Still allowing quiz attempt.';
    end if;
  else
    -- Standalone quiz: no lesson/course/enrollment. Reaching this point already
    -- means the caller knows p_quiz_id, which (for a standalone quiz) is only
    -- discoverable via get_quiz_by_entrance_code(), so no further access check
    -- is needed here. enrollment_record stays null and quiz_attempts.enrollment_id
    -- is nullable to support exactly this case.
    enrollment_record := null;
  end if;

  select count(*) into previous_attempts_count
  from public.quiz_attempts
  where user_id = p_user_id and quiz_id = p_quiz_id;

  if quiz_record.max_attempts is not null and previous_attempts_count >= quiz_record.max_attempts then
    raise exception 'Maximum number of attempts (%) reached for quiz "%".', quiz_record.max_attempts, quiz_record.title;
  end if;

  select coalesce(sum(q.points), 0) into max_score_possible_for_quiz
  from public.questions q
  where q.quiz_id = p_quiz_id;

  insert into public.quiz_attempts (enrollment_id, quiz_id, user_id, attempt_number, max_score_possible)
  values (enrollment_record.id, p_quiz_id, p_user_id, previous_attempts_count + 1, max_score_possible_for_quiz)
  returning * into new_quiz_attempt;

  return new_quiz_attempt;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.start_standalone_quiz_attempt(p_entrance_code text, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.quiz_attempts
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  found_quiz public.quizzes;
begin
  found_quiz := public.get_quiz_by_entrance_code(p_entrance_code);

  if found_quiz.lesson_id is not null then
    raise exception 'Quiz "%" is attached to a course lesson; use start_quiz_attempt() with enrollment instead of an entrance code.', found_quiz.title;
  end if;

  return public.start_quiz_attempt(found_quiz.id, p_user_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_quiz_answer(p_quiz_attempt_id uuid, p_question_id uuid, p_selected_option_ids uuid[] DEFAULT NULL::uuid[], p_answer_text text DEFAULT NULL::text, p_structured_answer jsonb DEFAULT NULL::jsonb, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.answers
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  quiz_attempt_record public.quiz_attempts;
  question_record public.questions;
  new_answer_record public.answers;
  is_answer_correct boolean := null;
  points_awarded_for_answer numeric(5,2) := 0;
  answer_feedback text := null;
  correct_ids uuid[];
  selected_ids_count int;
  correct_ids_count int;
  matching_correct_ids_count int;
  incorrectly_selected_ids_count int;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into quiz_attempt_record from public.quiz_attempts where id = p_quiz_attempt_id;
  if quiz_attempt_record is null then
    raise exception 'Quiz attempt not found: ID %', p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.user_id <> p_user_id then
    raise exception 'Permission denied: User % does not own quiz attempt %.', p_user_id, p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.completed_at is not null then
    raise exception 'Cannot submit answers: Quiz attempt % is already completed.', p_quiz_attempt_id;
  end if;

  select * into question_record from public.questions where id = p_question_id and quiz_id = quiz_attempt_record.quiz_id;
  if question_record is null then
    raise exception 'Question ID % not found or does not belong to quiz ID %.', p_question_id, quiz_attempt_record.quiz_id;
  end if;

  case question_record.question_type
    when 'multiple_choice_single_correct', 'true_false', 'yes_no' then
      if array_length(p_selected_option_ids, 1) = 1 then
        select qo.is_correct, qo.feedback
        into is_answer_correct, answer_feedback
        from public.question_options qo
        where qo.question_id = p_question_id and qo.id = p_selected_option_ids[1];

        is_answer_correct := coalesce(is_answer_correct, false);
      else
        is_answer_correct := false;
        answer_feedback := 'Please select exactly one option.';
      end if;

    when 'multiple_choice_multiple_correct' then
      select array_agg(id) into correct_ids from public.question_options where question_id = p_question_id and is_correct = true;
      correct_ids_count := coalesce(array_length(correct_ids, 1), 0);
      selected_ids_count := coalesce(array_length(p_selected_option_ids, 1), 0);

      if selected_ids_count = 0 then
        is_answer_correct := (correct_ids_count = 0);
      else
        select count(*) into matching_correct_ids_count from unnest(p_selected_option_ids) sel_id where sel_id = any(correct_ids);
        select count(*) into incorrectly_selected_ids_count from unnest(p_selected_option_ids) sel_id where sel_id <> all(coalesce(correct_ids, array[]::uuid[]));

        if matching_correct_ids_count = correct_ids_count and incorrectly_selected_ids_count = 0 then
          is_answer_correct := true;
        else
          is_answer_correct := false;
          answer_feedback := 'One or more selected options are incorrect, or not all correct options were chosen.';
        end if;
      end if;

    when 'short_answer_text', 'long_answer_text', 'fill_in_the_blanks', 'matching', 'ordering', 'image_based_question' then
      is_answer_correct := null;
      answer_feedback := 'This answer will be reviewed by an instructor or requires specific processing.';

    else
      is_answer_correct := null;
      answer_feedback := 'Grading for this question type is not yet implemented.';
  end case;

  if is_answer_correct = true then
    points_awarded_for_answer := question_record.points;
  end if;

  insert into public.answers (
    quiz_attempt_id,
    question_id,
    selected_option_ids,
    answer_text,
    structured_answer,
    is_correct,
    points_awarded,
    feedback
  )
  values (
    p_quiz_attempt_id,
    p_question_id,
    p_selected_option_ids,
    p_answer_text,
    p_structured_answer,
    is_answer_correct,
    points_awarded_for_answer,
    answer_feedback
  )
  on conflict (quiz_attempt_id, question_id) do update set
    selected_option_ids = excluded.selected_option_ids,
    answer_text = excluded.answer_text,
    structured_answer = excluded.structured_answer,
    is_correct = excluded.is_correct,
    points_awarded = excluded.points_awarded,
    feedback = excluded.feedback,
    submitted_at = now()
  returning * into new_answer_record;

  return new_answer_record;
end;
$function$
;

grant select on table "public"."classroom_announcements" to "authenticated";

grant select on table "public"."classroom_folders" to "authenticated";

grant select on table "public"."classroom_material_files" to "authenticated";

grant select on table "public"."classroom_materials" to "authenticated";

grant select on table "public"."classroom_members" to "authenticated";

grant select on table "public"."classroom_resources" to "authenticated";

grant select on table "public"."classrooms" to "authenticated";


  create policy "Allow Admin to delete categories"
  on "public"."categories"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "Admin can delete code"
  on "public"."code"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "Instructor, admin, school editor can delete their course"
  on "public"."courses"
  as permissive
  for delete
  to authenticated
using (((instructor_id = ( SELECT auth.uid() AS uid)) OR public.is_admin() OR public.is_school_editor(school_id)));



  create policy "Instructor, admin, school member can view their courses"
  on "public"."courses"
  as permissive
  for select
  to authenticated
using ((public.is_owner(instructor_id) OR public.is_admin() OR public.is_school_member(school_id)));



  create policy "Instructors, admin and school editor can create courses"
  on "public"."courses"
  as permissive
  for insert
  to authenticated
with check (((instructor_id = ( SELECT auth.uid() AS uid)) OR public.is_admin() OR public.is_school_editor(school_id)));



  create policy "Admin can update departments"
  on "public"."departments"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Instructor, admin, and school editor can create a lesson conten"
  on "public"."lesson_content_blocks"
  as permissive
  for insert
  to authenticated
with check (public.can_manage_course(course_id));



  create policy "Instructor, admin, and school editor can delete a lesson conten"
  on "public"."lesson_content_blocks"
  as permissive
  for delete
  to authenticated
using (public.can_manage_course(course_id));



  create policy "Instructor, admin, and school editor can update a lesson conten"
  on "public"."lesson_content_blocks"
  as permissive
  for update
  to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));



  create policy "Instructor, admin, and school member can read a lesson content"
  on "public"."lesson_content_blocks"
  as permissive
  for select
  to authenticated
using (public.can_view_course(course_id));



  create policy "Users can create a lesson_progress"
  on "public"."lesson_progress"
  as permissive
  for insert
  to authenticated
with check (public.is_owner(user_id));



  create policy "Users can delete a lesson_progress"
  on "public"."lesson_progress"
  as permissive
  for delete
  to authenticated
using (public.is_owner(user_id));



  create policy "Users can read a lesson_progress"
  on "public"."lesson_progress"
  as permissive
  for select
  to authenticated
using (public.is_owner(user_id));



  create policy "Users can update a lesson_progress"
  on "public"."lesson_progress"
  as permissive
  for update
  to authenticated
using (public.is_owner(user_id))
with check (public.is_owner(user_id));



  create policy "Admin can create a libraries"
  on "public"."libraries"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "Admin can delete a libraries"
  on "public"."libraries"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "Admin can update a libraries"
  on "public"."libraries"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Instructor, admin, and school editor can create a course module"
  on "public"."modules"
  as permissive
  for insert
  to authenticated
with check (public.can_manage_course(course_id));



  create policy "Instructor, admin, and school editor can delete a course module"
  on "public"."modules"
  as permissive
  for delete
  to authenticated
using (public.can_manage_course(course_id));



  create policy "Instructor, admin, and school editor can update a course module"
  on "public"."modules"
  as permissive
  for update
  to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));



  create policy "Instructor, admin, and school member can read a course module"
  on "public"."modules"
  as permissive
  for select
  to authenticated
using (public.can_view_course(course_id));



  create policy "Users can create a payment"
  on "public"."payments"
  as permissive
  for insert
  to authenticated
with check (public.is_owner(user_id));



  create policy "Users can update a payment"
  on "public"."payments"
  as permissive
  for update
  to authenticated
using (public.is_owner(user_id))
with check (public.is_owner(user_id));



  create policy "Admin can create a provinces"
  on "public"."provinces"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "Admin can delete a province"
  on "public"."provinces"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "Admin can edit a provinces"
  on "public"."provinces"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Owner, admin, and school editor can create a quiz question_opti"
  on "public"."question_options"
  as permissive
  for insert
  to authenticated
with check (public.can_manage_quiz(quiz_id));



  create policy "Owner, admin, and school editor can delete a quiz question_opti"
  on "public"."question_options"
  as permissive
  for delete
  to authenticated
using (public.can_manage_quiz(quiz_id));



  create policy "Owner, admin, and school editor can update a quiz question_opti"
  on "public"."question_options"
  as permissive
  for update
  to authenticated
using (public.can_manage_quiz(quiz_id))
with check (public.can_manage_quiz(quiz_id));



  create policy "Owner, admin, and school member can read a quiz question_option"
  on "public"."question_options"
  as permissive
  for select
  to authenticated
using (public.can_manage_quiz(quiz_id));



  create policy "Recipient can read question_options"
  on "public"."question_options"
  as permissive
  for select
  to authenticated
using (public.can_view_quiz(quiz_id));



  create policy "Owner, admin, and school editor can create a quiz questions"
  on "public"."questions"
  as permissive
  for insert
  to authenticated
with check (public.can_manage_quiz(quiz_id));



  create policy "Owner, admin, and school editor can delete a quiz questions"
  on "public"."questions"
  as permissive
  for delete
  to authenticated
using (public.can_manage_quiz(quiz_id));



  create policy "Owner, admin, and school editor can update a quiz questions"
  on "public"."questions"
  as permissive
  for update
  to authenticated
using (public.can_manage_quiz(quiz_id))
with check (public.can_manage_quiz(quiz_id));



  create policy "Owner, admin, and school member can read a quiz questions"
  on "public"."questions"
  as permissive
  for select
  to authenticated
using (public.can_manage_quiz(quiz_id));



  create policy "Recipient of a quiz can read questions, and anyone can read pub"
  on "public"."questions"
  as permissive
  for select
  to authenticated
using (public.can_view_quiz(quiz_id));



  create policy "users can view their quiz_attempts"
  on "public"."quiz_attempts"
  as permissive
  for select
  to authenticated
using (public.is_owner(user_id));



  create policy "Anyone can read public quizzes"
  on "public"."quizzes"
  as permissive
  for select
  to authenticated
using ((visibility = 'public'::public.visibility));



  create policy "Enrolled users can view lesson quizzes"
  on "public"."quizzes"
  as permissive
  for select
  to authenticated
using (public.is_enrolled(public.get_course_id_from_lesson(lesson_id)));



  create policy "Owner, admin, and school editor can create a quizzes"
  on "public"."quizzes"
  as permissive
  for insert
  to authenticated
with check ((public.is_owner(user_id) OR public.is_admin() OR public.is_school_editor(school_id)));



  create policy "Owner, admin, and school editor can delete a quizzes"
  on "public"."quizzes"
  as permissive
  for delete
  to authenticated
using ((public.is_owner(user_id) OR public.is_admin() OR public.is_school_editor(school_id)));



  create policy "Owner, admin, and school editor can update a quizzes"
  on "public"."quizzes"
  as permissive
  for update
  to authenticated
using ((public.is_owner(user_id) OR public.is_admin() OR public.is_school_editor(school_id)))
with check ((public.is_owner(user_id) OR public.is_admin() OR public.is_school_editor(school_id)));



  create policy "Owner, admin, and school member can read a quizzes"
  on "public"."quizzes"
  as permissive
  for select
  to authenticated
using ((public.is_owner(user_id) OR public.is_admin() OR public.is_school_member(school_id)));



  create policy "Recipient can read quizzes"
  on "public"."quizzes"
  as permissive
  for select
  to authenticated
using (public.is_resource_shared_with_user(id));



  create policy "Instructors can view answers for their course quizzes"
  on "public"."answers"
  as permissive
  for select
  to authenticated
using (public.is_course_instructor_old(auth.uid(), ( SELECT l.course_id
   FROM ((public.quiz_attempts qa
     JOIN public.quizzes q ON ((qa.quiz_id = q.id)))
     JOIN public.lessons l ON ((q.lesson_id = l.id)))
  WHERE (qa.id = answers.quiz_attempt_id))));



  create policy "Students can view their own answers"
  on "public"."answers"
  as permissive
  for select
  to authenticated
using (public.is_owner(( SELECT qa.user_id
   FROM public.quiz_attempts qa
  WHERE (qa.id = answers.quiz_attempt_id))));



  create policy "Allow admins to view all bookmarks"
  on "public"."bookmarks"
  as permissive
  for select
  to authenticated
using (public.is_admin());



  create policy "Allow users to delete their own bookmarks"
  on "public"."bookmarks"
  as permissive
  for delete
  to authenticated
using (public.is_owner(user_id));



  create policy "Allow users to insert their own bookmarks"
  on "public"."bookmarks"
  as permissive
  for insert
  to authenticated
with check (public.is_owner(user_id));



  create policy "Allow users to select their own bookmarks"
  on "public"."bookmarks"
  as permissive
  for select
  to authenticated
using (public.is_owner(user_id));



  create policy "Allow users to update their own bookmarks"
  on "public"."bookmarks"
  as permissive
  for update
  to authenticated
using (public.is_owner(user_id))
with check (public.is_owner(user_id));



  create policy "Allow admin to update books"
  on "public"."books"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Allow admins to create books"
  on "public"."books"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "Allow admins to create categories"
  on "public"."categories"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "Allow admins to update categories"
  on "public"."categories"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Admins can delete any certificate"
  on "public"."certificates"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "Admins can insert any certificate"
  on "public"."certificates"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "Allow users to view their own certificates"
  on "public"."certificates"
  as permissive
  for select
  to authenticated
using (public.is_owner(user_id));



  create policy "Admin can update code"
  on "public"."code"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Enable read access for all users"
  on "public"."code"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Anyone can view a published course"
  on "public"."courses"
  as permissive
  for select
  to public
using (is_published);



  create policy "Admin can create department"
  on "public"."departments"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "Authors and staff can delete discussion posts"
  on "public"."discussion_posts"
  as permissive
  for delete
  to authenticated
using (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))));



  create policy "Authors and staff can update discussion posts"
  on "public"."discussion_posts"
  as permissive
  for update
  to authenticated
using (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))))
with check (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))));



  create policy "Enrolled users and staff can view discussion posts"
  on "public"."discussion_posts"
  as permissive
  for select
  to authenticated
using (((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id))) OR public.is_enrolled_old(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))));



  create policy "Enrolled users can create discussion posts"
  on "public"."discussion_posts"
  as permissive
  for insert
  to authenticated
with check (((user_id = auth.uid()) AND ((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id))) OR public.is_enrolled_old(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id))))));



  create policy "Authors and staff can delete discussion threads"
  on "public"."discussion_threads"
  as permissive
  for delete
  to authenticated
using (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(auth.uid(), course_id)));



  create policy "Authors and staff can update discussion threads"
  on "public"."discussion_threads"
  as permissive
  for update
  to authenticated
using (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(auth.uid(), course_id)))
with check (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(auth.uid(), course_id)));



  create policy "Enrolled users and staff can view discussion threads"
  on "public"."discussion_threads"
  as permissive
  for select
  to authenticated
using (((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(auth.uid(), course_id) OR public.is_enrolled_old(auth.uid(), course_id)));



  create policy "Enrolled users can create discussion threads"
  on "public"."discussion_threads"
  as permissive
  for insert
  to authenticated
with check (((user_id = auth.uid()) AND ((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(auth.uid(), course_id) OR public.is_enrolled_old(auth.uid(), course_id))));



  create policy "Allow users to enroll themselves"
  on "public"."enrollments"
  as permissive
  for insert
  to authenticated
with check (public.is_owner(user_id));



  create policy "Allow users to view their own enrollments"
  on "public"."enrollments"
  as permissive
  for select
  to authenticated
using (public.is_owner(user_id));



  create policy "Allow admin to insert"
  on "public"."faculties"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "Allow admin to update"
  on "public"."faculties"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Allow admin to insert"
  on "public"."forms"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "Allow admin to update"
  on "public"."forms"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Enable read access for all users"
  on "public"."grades"
  as permissive
  for select
  to public
using (true);



  create policy "Anyone can view a published course lesson content"
  on "public"."lesson_content_blocks"
  as permissive
  for select
  to authenticated
using ((public.is_course_published(course_id) AND public.is_enrolled(course_id)));



  create policy "Instructor can create a course lesson"
  on "public"."lessons"
  as permissive
  for insert
  to authenticated
with check (public.is_course_instructor_old(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can delete a course lesson"
  on "public"."lessons"
  as permissive
  for delete
  to authenticated
using (public.is_course_instructor_old(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can read a course lesson"
  on "public"."lessons"
  as permissive
  for select
  to authenticated
using (public.is_course_instructor_old(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can update a course lesson"
  on "public"."lessons"
  as permissive
  for update
  to authenticated
using (public.is_course_instructor_old(( SELECT auth.uid() AS uid), course_id))
with check (public.is_course_instructor_old(( SELECT auth.uid() AS uid), course_id));



  create policy "Allow users to update (mark as read) their own notifications"
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using (public.is_owner(user_id))
with check (public.is_owner(user_id));



  create policy "Allow users to view their own notifications"
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using (public.is_owner(user_id));



  create policy "Allow users to view their own payments"
  on "public"."payments"
  as permissive
  for select
  to authenticated
using (public.is_owner(user_id));



  create policy "Admins can delete any profile"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using ((role = 'admin'::public.user_role));



  create policy "Admins can insert any profile"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((role = 'admin'::public.user_role));



  create policy "Admins can select all profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((public.is_owner(id) OR (role = 'admin'::public.user_role)));



  create policy "Admins can update any profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((role = 'admin'::public.user_role))
with check ((role = 'admin'::public.user_role));



  create policy "Allow users to view their own quiz attempts"
  on "public"."quiz_attempts"
  as permissive
  for select
  to authenticated
using (public.is_owner(user_id));



  create policy "schools owner can update"
  on "public"."schools"
  as permissive
  for update
  to authenticated
using (public.is_school_editor(user_id))
with check (public.is_school_editor(user_id));



  create policy "Allow instructors and admins to create tags"
  on "public"."tags"
  as permissive
  for insert
  to authenticated
with check (public.is_user_any_of(ARRAY['instructor'::public.user_role, 'admin'::public.user_role]));



  create policy "Enable read access for all users"
  on "public"."universities"
  as permissive
  for select
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."universities_faculties"
  as permissive
  for select
  to public
using (true);



