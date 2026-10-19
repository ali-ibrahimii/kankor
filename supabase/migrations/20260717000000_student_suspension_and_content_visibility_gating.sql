-- ─────────────────────────────────────────────────────────────────────────
-- Student suspension + enforce content visibility gating on suspended
-- instructor/school/student accounts.
--
-- 20260714000000_admin_instructor_school_management.sql added the
-- 'suspended'/'disabled' account_status values and the admin UI to set them
-- on instructors and schools, but never wired the actual effect: the public
-- read policies on courses/decks/quizzes only ever checked
-- is_published/visibility, never the owner's account status. So suspending
-- an instructor or school today does not hide their content.
--
-- This migration:
-- 1. Adds profiles.student_status so students can be suspended/disabled too
--    (not null default 'active' — unlike instructor_status, students never
--    go through a pending-verification step, so there's no null-as-pending
--    state to model).
-- 2. Adds public.is_content_owner_active(), a STABLE SECURITY DEFINER helper
--    (same shape as is_admin/is_owner) that a public read policy can call to
--    check whether the owning instructor/student and/or owning school is
--    suspended or disabled.
-- 3. ANDs that check into the public read policies for courses, decks, and
--    quizzes. Owner/admin/school-member access policies are untouched —
--    only public discoverability is gated, so an admin or the account owner
--    can still see their own suspended content in their dashboard.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Student suspension status ------------------------------------------------
alter table "public"."profiles"
	add column "student_status" public.account_status not null default 'active';
-- Meaningful only when role = 'student'. Defaults to 'active' (not null,
-- unlike instructor_status) since students aren't subject to a verification
-- workflow — only suspend/disable/reactivate ever apply.

-- 20260710090000_credits_and_purchases.sql revoked authenticated's unqualified
-- table-level UPDATE grant on profiles and replaced it with an explicit
-- column list (to keep credit_balance write-protected). That list predates
-- this column, so without this grant an admin's update({student_status})
-- fails with "permission denied for table profiles" before RLS is even
-- evaluated.
grant update (student_status) on table "public"."profiles" to "authenticated";

-- 2. Content-owner-active helper ----------------------------------------------
create or replace function public.is_content_owner_active(
	p_owner_id uuid,
	p_school_id uuid default null
)
returns boolean
language plpgsql
stable security definer
set search_path = public, pg_catalog
as $function$
declare
	v_owner_role public.user_role;
	v_owner_instructor_status public.account_status;
	v_owner_student_status public.account_status;
	v_school_status public.account_status;
begin
	if p_school_id is not null then
		select s.status into v_school_status
		from public.schools s
		where s.id = p_school_id;

		if v_school_status in ('suspended', 'disabled') then
			return false;
		end if;
	end if;

	if p_owner_id is null then
		return true;
	end if;

	select p.role, p.instructor_status, p.student_status
	into v_owner_role, v_owner_instructor_status, v_owner_student_status
	from public.profiles p
	where p.id = p_owner_id;

	if v_owner_role = 'instructor' and v_owner_instructor_status in ('suspended', 'disabled') then
		return false;
	end if;

	if v_owner_role = 'student' and v_owner_student_status in ('suspended', 'disabled') then
		return false;
	end if;

	return true;
end;
$function$;

grant execute on function public.is_content_owner_active(uuid, uuid) to authenticated, anon;

-- 3. Gate public read policies on owner/school active status -----------------

drop policy "Anyone can view a published course" on "public"."courses";

create policy "Anyone can view a published course"
on "public"."courses"
as permissive
for select
to public
using (is_published and public.is_content_owner_active(instructor_id, school_id));

drop policy "Anyone can see public decks" on "public"."decks";

create policy "Anyone can see public decks"
on "public"."decks"
as permissive
for select
to public
using (
	visibility = 'public'::public.visibility
	and public.is_content_owner_active(user_id, school_id)
);

drop policy "Anonymous users can view public quizzes" on "public"."quizzes";

create policy "Anonymous users can view public quizzes"
on "public"."quizzes"
as permissive
for select
to anon
using (
	visibility = 'public'::public.visibility
	and public.is_content_owner_active(user_id, school_id)
);

drop policy "Anyone can read public quizzes" on "public"."quizzes";

create policy "Anyone can read public quizzes"
on "public"."quizzes"
as permissive
for select
to authenticated
using (
	visibility = 'public'::public.visibility
	and public.is_content_owner_active(user_id, school_id)
);
