-- `courses` had insert/select/delete RLS policies but no UPDATE policy after
-- 20260702151515_review_db_rls.sql dropped the old "Admin can manage course"
-- (for all) policy without a replacement — this silently broke
-- setCoursePublished and would block the new course-details edit action
-- (course-builder.tsx header "edit details" button / updateCourse).

create policy "Instructor, admin, and school editor can update their course"
  on "public"."courses"
  as permissive
  for update
  to authenticated
  using (public.can_manage_course(id))
  with check (public.can_manage_course(id));
