-- Admin dashboard support: multi-admin schools + pending-review signups
--
-- Context: public.profiles.role ('student' | 'instructor' | 'admin') and
-- public.schools.manager (a single uuid) currently model at most ONE admin
-- per school and no distinction between "platform super admin" and
-- "school admin". The admin app needs:
--   - super admin (profiles.role = 'admin', unchanged — just documented here)
--   - instructor: standalone, platform-wide role (profiles.role = 'instructor',
--     unchanged — publishes courses/exams independent of any school)
--   - school staff: MULTIPLE people per school, each with their own role
--     (owner / admin / staff) — this is new, via school_members below
--   - pending-review signups for self-serve schools and instructors
--
-- This migration is additive only: it does not touch profiles.role, does not
-- rename anything, and does not change existing RLS on other tables. See
-- SCHEMA_REVIEW.md for unrelated pre-existing issues this migration does not
-- attempt to fix (RLS gaps on questions/answers, bigint/uuid mismatches,
-- the committed powersync_role password, etc.) — those need their own pass.

-- 1. Per-school staff roles -----------------------------------------------

create type "public"."school_member_role" as enum ('owner', 'admin', 'staff');

create table "public"."school_members" (
  "id" uuid not null default gen_random_uuid(),
  "school_id" uuid not null references public.schools(id) on delete cascade,
  "user_id" uuid not null references public.profiles(id) on delete cascade,
  "role" public.school_member_role not null default 'staff',
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint school_members_pkey primary key (id),
  constraint school_members_school_user_unique unique (school_id, user_id)
);

create index idx_school_members_school_id on public.school_members(school_id);
create index idx_school_members_user_id on public.school_members(user_id);

create trigger set_school_members_updated_at
  before update on public.school_members
  for each row execute function public.handle_updated_at();
-- NB: assumes a public.handle_updated_at() trigger function already exists
-- (per SCHEMA_REVIEW.md §6, most tables already use one of this shape). If
-- your existing trigger function has a different name, update this line —
-- do not let the migration apply silently against the wrong function.

-- 2. Pending-review signups ------------------------------------------------

create type "public"."account_status" as enum ('pending', 'active', 'rejected');

alter table "public"."schools"
  add column "status" public.account_status not null default 'pending';

alter table "public"."profiles"
  add column "instructor_status" public.account_status;
-- Null for everyone except instructors. Set to 'pending' at signup time when
-- role = 'instructor', then flipped to 'active'/'rejected' by a super admin.
-- Kept separate from a generic "profiles.status" so it doesn't accidentally
-- gate students or school staff logins.

-- 3. Helper functions used by RLS policies and the admin app --------------

create or replace function public.is_super_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

create or replace function public.school_member_role(
  p_school_id uuid,
  uid uuid default auth.uid()
)
returns public.school_member_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.school_members
  where school_id = p_school_id and user_id = uid;
$$;

create or replace function public.is_school_admin(
  p_school_id uuid,
  uid uuid default auth.uid()
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_super_admin(uid) or exists (
    select 1 from public.school_members
    where school_id = p_school_id
      and user_id = uid
      and role in ('owner', 'admin')
  );
$$;

-- 4. RLS ---------------------------------------------------------------

alter table "public"."school_members" enable row level security;

create policy "Super admins manage all school members"
  on public.school_members for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "School admins manage members of their own school"
  on public.school_members for all
  using (public.is_school_admin(school_id))
  with check (public.is_school_admin(school_id));

create policy "School members can see their fellow members"
  on public.school_members for select
  using (
    exists (
      select 1 from public.school_members me
      where me.school_id = school_members.school_id
        and me.user_id = auth.uid()
    )
  );

-- 5. Backfill from the old single-manager model ----------------------------
-- schools.manager defaulted to gen_random_uuid() instead of NULL in the
-- original migration (SCHEMA_REVIEW.md §5), so most existing values are
-- almost certainly dangling, not real profile ids. Only backfill rows where
-- the manager id actually resolves to a real profile, otherwise this insert
-- would violate the FK on school_members.user_id.
insert into public.school_members (school_id, user_id, role)
select s.id, s.manager, 'owner'
from public.schools s
where s.manager is not null
  and exists (select 1 from public.profiles p where p.id = s.manager)
on conflict (school_id, user_id) do nothing;

-- Existing schools predate the pending-review flow — don't retroactively
-- lock anyone out.
update public.schools set status = 'active' where status = 'pending';
