-- The "Admins can ... profile" policies on profiles all checked
-- `role = 'admin'` — the role of THE ROW being read/written, not the
-- calling user's own role (that's what public.is_admin() checks).
--
-- For select, this meant an admin could see their own profile plus any
-- OTHER admin's profile, but no student or instructor profiles at all, so
-- /d/admin/users/students (and every other admin user list) always
-- rendered empty.
--
-- For update/delete it was worse: since the USING clause never referenced
-- the caller at all, ANY authenticated user (not just admins) could
-- update or delete ANY profile row whose role happened to be 'admin' —
-- letting a non-admin tamper with or remove another admin's account.

drop policy "Admins can select all profiles" on "public"."profiles";
drop policy "Admins can update any profile" on "public"."profiles";
drop policy "Admins can delete any profile" on "public"."profiles";

create policy "Admins can select all profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
  using ((public.is_owner(id) OR public.is_admin()));

create policy "Admins can update any profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete any profile"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
  using (public.is_admin());
