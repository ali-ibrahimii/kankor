-- profiles SELECT RLS only allows a user to see their own profile (or an
-- admin to see any), so classroom rosters render every OTHER member as
-- "Unknown user" — nobody outside admins could actually read a classmate's
-- name/avatar.
--
-- Add: any classroom member (owner included — the owner is auto-inserted
-- into classroom_members on classroom creation) can view the profile of
-- any other member of a classroom they share.

create policy "Classroom members can view their classmates' profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.classroom_members cm1
      join public.classroom_members cm2 on cm1.classroom_id = cm2.classroom_id
      where cm1.user_id = auth.uid()
        and cm2.user_id = profiles.id
    )
  );
