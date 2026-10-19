drop policy "Allow authenticated users to view published courses" on "public"."courses";

drop policy "Enable read access for all users" on "public"."lesson_content_blocks";

drop policy "Enable read access for all users" on "public"."lessons";

drop policy "PUBLIC ALLOW TO READ MODULES" on "public"."modules";

drop policy "Allow instructors to create courses" on "public"."courses";

alter table "public"."flashcards" add column "img_path" text;

alter table "public"."lesson_content_blocks" add column "course_id" uuid;

alter table "public"."lesson_content_blocks" add constraint "lesson_content_blocks_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."lesson_content_blocks" validate constraint "lesson_content_blocks_course_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_course_published(p_course_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION public.is_enrolled(check_user_id uuid, check_course_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$begin
  return exists (
    select 1 from public.enrollments
    where course_id = check_course_id and user_id = check_user_id
  );
end;$function$
;

grant update on table "public"."profiles" to "authenticated";


  create policy "Anyone can view a published course"
  on "public"."courses"
  as permissive
  for select
  to public
using (public.is_course_published(id));



  create policy "Instructor can delete their course"
  on "public"."courses"
  as permissive
  for delete
  to authenticated
using (public.is_instructor());



  create policy "Instructor can view their courses"
  on "public"."courses"
  as permissive
  for select
  to authenticated
using (public.is_instructor());



  create policy "Anyone can view a published course lesson content"
  on "public"."lesson_content_blocks"
  as permissive
  for select
  to authenticated
using ((public.is_course_published(course_id) AND public.is_enrolled(( SELECT auth.uid() AS uid), course_id)));



  create policy "Instructor can create a lesson content"
  on "public"."lesson_content_blocks"
  as permissive
  for insert
  to authenticated
with check (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can delete a lesson content"
  on "public"."lesson_content_blocks"
  as permissive
  for delete
  to authenticated
using (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can read a lesson content"
  on "public"."lesson_content_blocks"
  as permissive
  for select
  to authenticated
using (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can update a lesson content"
  on "public"."lesson_content_blocks"
  as permissive
  for update
  to authenticated
using (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id))
with check (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Anyone can view a published course lesson"
  on "public"."lessons"
  as permissive
  for select
  to public
using (public.is_course_published(course_id));



  create policy "Instructor can create a course lesson"
  on "public"."lessons"
  as permissive
  for insert
  to authenticated
with check (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can delete a course lesson"
  on "public"."lessons"
  as permissive
  for delete
  to authenticated
using (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can read a course lesson"
  on "public"."lessons"
  as permissive
  for select
  to authenticated
using (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can update a course lesson"
  on "public"."lessons"
  as permissive
  for update
  to authenticated
using (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id))
with check (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Anyone can view a published course module"
  on "public"."modules"
  as permissive
  for select
  to public
using (public.is_course_published(course_id));



  create policy "Instructor can create a course module"
  on "public"."modules"
  as permissive
  for insert
  to authenticated
with check (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can delete a course module"
  on "public"."modules"
  as permissive
  for delete
  to authenticated
using (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can read a course module"
  on "public"."modules"
  as permissive
  for select
  to authenticated
using (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Instructor can update a course module"
  on "public"."modules"
  as permissive
  for update
  to authenticated
using (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id))
with check (public.is_course_instructor(( SELECT auth.uid() AS uid), course_id));



  create policy "Allow instructors to create courses"
  on "public"."courses"
  as permissive
  for insert
  to authenticated
with check (public.is_instructor());



