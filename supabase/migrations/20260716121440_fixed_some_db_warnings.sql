create extension if not exists "pg_net" with schema "extensions";

drop policy "Instructors can view answers for their course quizzes" on "public"."answers";

drop policy "Course managers can insert course assets" on "public"."course_assets";

drop policy "Authors and staff can delete discussion posts" on "public"."discussion_posts";

drop policy "Authors and staff can update discussion posts" on "public"."discussion_posts";

drop policy "Enrolled users and staff can view discussion posts" on "public"."discussion_posts";

drop policy "Enrolled users can create discussion posts" on "public"."discussion_posts";

drop policy "Authors and staff can delete discussion threads" on "public"."discussion_threads";

drop policy "Authors and staff can update discussion threads" on "public"."discussion_threads";

drop policy "Enrolled users and staff can view discussion threads" on "public"."discussion_threads";

drop policy "Enrolled users can create discussion threads" on "public"."discussion_threads";

drop policy "Classroom members can view their classmates' profiles" on "public"."profiles";

drop extension if exists "pg_net";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_related_courses(p_related_ids uuid[] DEFAULT '{}'::uuid[], p_book_id uuid DEFAULT NULL::uuid, p_subject_id uuid DEFAULT NULL::uuid, p_grade_id uuid DEFAULT NULL::uuid, p_school_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 3)
 RETURNS TABLE(id uuid, slug text, title text, subtitle text, cover_image_url text, is_free boolean, price numeric, price_credits integer, currency character, average_rating numeric, level public.course_level, language public.language_enum, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  if array_length(p_related_ids, 1) > 0 then
    return query
    select c.id, c.slug, c.title, c.subtitle, c.cover_image_url, c.is_free, c.price, c.price_credits, c.currency, c.average_rating, c.level, c.language, c.created_at, c.updated_at
    from public.courses c
    where c.is_published = true
      and c.id = any(p_related_ids);
  else
    return query
    select c.id, c.slug, c.title, c.subtitle, c.cover_image_url, c.is_free, c.price, c.price_credits, c.currency, c.average_rating, c.level, c.language, c.created_at, c.updated_at
    from public.courses c
    where c.is_published = true
      and (
        (p_book_id is not null and c.book_id = p_book_id)
        or (p_subject_id is not null and c.subject_id = p_subject_id)
        or (p_grade_id is not null and c.grade_id = p_grade_id)
        or (p_school_id is not null and c.school_id = p_school_id)
      )
    order by random()
    limit p_limit;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_related_decks(p_related_ids uuid[] DEFAULT '{}'::uuid[], p_book_id uuid DEFAULT NULL::uuid, p_subject_id uuid DEFAULT NULL::uuid, p_grade_id uuid DEFAULT NULL::uuid, p_school_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 3)
 RETURNS TABLE(id uuid, name text, slug text, description text, is_free boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  if array_length(p_related_ids, 1) > 0 then
    return query
    select d.id, d.name, d.slug, d.description, d.is_free
    from public.decks d
    where d.visibility = 'public'
      and d.id = any(p_related_ids);
  else
    return query
    select d.id, d.name, d.slug, d.description, d.is_free
    from public.decks d
    where d.visibility = 'public'
      and (
        (p_book_id is not null and d.book_id = p_book_id)
        or (p_subject_id is not null and d.subject_id = p_subject_id)
        or (p_grade_id is not null and d.grade_id = p_grade_id)
        or (p_school_id is not null and d.school_id = p_school_id)
      )
    order by random()
    limit p_limit;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_related_libraries(p_related_ids uuid[] DEFAULT '{}'::uuid[], p_book_id uuid DEFAULT NULL::uuid, p_subject_id uuid DEFAULT NULL::uuid, p_grade_id uuid DEFAULT NULL::uuid, p_school_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 3)
 RETURNS TABLE(id uuid, title text, slug text, "desc" text, uri text, file_path text, category_id uuid, grade_id uuid, subject_id uuid, book_id uuid, updated_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  if array_length(p_related_ids, 1) > 0 then
    return query
    select l.id, l.title, l.slug, l.desc, l.uri, l.file_path, l.category_id, l.grade_id, l.subject_id, l.book_id, l.updated_at, l.created_at
    from public.libraries l
    where l.id = any(p_related_ids);
  else
    return query
    select l.id, l.title, l.slug, l.desc, l.uri, l.file_path, l.category_id, l.grade_id, l.subject_id, l.book_id, l.updated_at, l.created_at
    from public.libraries l
    where (
      (p_book_id is not null and l.book_id = p_book_id)
      or (p_subject_id is not null and l.subject_id = p_subject_id)
      or (p_grade_id is not null and l.grade_id = p_grade_id)
    )
    order by random()
    limit p_limit;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_related_quizzes(p_related_ids uuid[] DEFAULT '{}'::uuid[], p_book_id uuid DEFAULT NULL::uuid, p_subject_id uuid DEFAULT NULL::uuid, p_grade_id uuid DEFAULT NULL::uuid, p_school_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 3)
 RETURNS TABLE(id uuid, title text, slug text, description text, is_free boolean, time_limit_minutes integer, passing_score_percentage smallint, max_attempts smallint, instructions text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  if array_length(p_related_ids, 1) > 0 then
    return query
    select q.id, q.title, q.slug, q.description, q.is_free, q.time_limit_minutes, q.passing_score_percentage, q.max_attempts, q.instructions, q.created_at
    from public.quizzes q
    where q.visibility = 'public'
      and q.id = any(p_related_ids);
  else
    return query
    select q.id, q.title, q.slug, q.description, q.is_free, q.time_limit_minutes, q.passing_score_percentage, q.max_attempts, q.instructions, q.created_at
    from public.quizzes q
    where q.visibility = 'public'
      and (
        (p_book_id is not null and q.book_id = p_book_id)
        or (p_subject_id is not null and q.subject_id = p_subject_id)
        or (p_grade_id is not null and q.grade_id = p_grade_id)
        or (p_school_id is not null and q.school_id = p_school_id)
      )
    order by random()
    limit p_limit;
  end if;
end;
$function$
;


  create policy "Instructors can view answers for their course quizzes"
  on "public"."answers"
  as permissive
  for select
  to authenticated
using (public.is_course_instructor_old(( SELECT auth.uid() AS uid), ( SELECT l.course_id
   FROM ((public.quiz_attempts qa
     JOIN public.quizzes q ON ((qa.quiz_id = q.id)))
     JOIN public.lessons l ON ((q.lesson_id = l.id)))
  WHERE (qa.id = answers.quiz_attempt_id))));



  create policy "Course managers can insert course assets"
  on "public"."course_assets"
  as permissive
  for insert
  to authenticated
with check ((public.can_manage_course(course_id) AND public.is_owner(uploaded_by)));



  create policy "Authors and staff can delete discussion posts"
  on "public"."discussion_posts"
  as permissive
  for delete
  to authenticated
using ((public.is_owner(user_id) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(( SELECT auth.uid() AS uid), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))));



  create policy "Authors and staff can update discussion posts"
  on "public"."discussion_posts"
  as permissive
  for update
  to authenticated
using ((public.is_owner(user_id) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(( SELECT auth.uid() AS uid), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))))
with check ((public.is_owner(user_id) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(( SELECT auth.uid() AS uid), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))));



  create policy "Enrolled users and staff can view discussion posts"
  on "public"."discussion_posts"
  as permissive
  for select
  to authenticated
using (((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(( SELECT auth.uid() AS uid), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id))) OR public.is_enrolled_old(( SELECT auth.uid() AS uid), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))));



  create policy "Enrolled users can create discussion posts"
  on "public"."discussion_posts"
  as permissive
  for insert
  to authenticated
with check ((public.is_owner(user_id) AND ((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(( SELECT auth.uid() AS uid), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id))) OR public.is_enrolled_old(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id))))));



  create policy "Authors and staff can delete discussion threads"
  on "public"."discussion_threads"
  as permissive
  for delete
  to authenticated
using ((public.is_owner(user_id) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(( SELECT auth.uid() AS uid), course_id)));



  create policy "Authors and staff can update discussion threads"
  on "public"."discussion_threads"
  as permissive
  for update
  to authenticated
using ((public.is_owner(user_id) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(( SELECT auth.uid() AS uid), course_id)))
with check ((public.is_owner(user_id) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(( SELECT auth.uid() AS uid), course_id)));



  create policy "Enrolled users and staff can view discussion threads"
  on "public"."discussion_threads"
  as permissive
  for select
  to authenticated
using (((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(( SELECT auth.uid() AS uid), course_id) OR public.is_enrolled_old(( SELECT auth.uid() AS uid), course_id)));



  create policy "Enrolled users can create discussion threads"
  on "public"."discussion_threads"
  as permissive
  for insert
  to authenticated
with check ((public.is_owner(user_id) AND ((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor_old(( SELECT auth.uid() AS uid), course_id) OR public.is_enrolled_old(( SELECT auth.uid() AS uid), course_id))));



  create policy "Classroom members can view their classmates' profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.classroom_members cm1
     JOIN public.classroom_members cm2 ON ((cm1.classroom_id = cm2.classroom_id)))
  WHERE ((cm1.user_id = ( SELECT auth.uid() AS uid)) AND (cm2.user_id = profiles.id)))));



