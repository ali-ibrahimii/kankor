-- Students browsing the course catalog need to see who teaches a published
-- course. Profiles RLS otherwise only allows selecting your own profile, so
-- the instructor embed in catalog queries silently returned no rows.
create policy "Anyone can view instructor profiles of published courses"
on "public"."profiles"
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.instructor_id = profiles.id
      and c.is_published = true
  )
);
