-- ─────────────────────────────────────────────────────────────────────────
-- Instructor signup must land in `pending`, not NULL
--
-- The instructor dashboard layout gates access on
-- `profiles.instructor_status === 'active'` and sends everyone else to
-- /verification-pending. The admin dashboard, the admin instructors table,
-- and the Slack approval webhook all treat the "needs approval" state as
-- `instructor_status = 'pending'`.
--
-- But nothing ever wrote 'pending'. handle_new_user_profile_creation()
-- inserted the profile without touching instructor_status, so every
-- instructor who signed up through the form got NULL — a value the UI renders
-- as "Pending approval" while every SQL predicate that filters on 'pending'
-- silently matches nothing.
--
-- Consequences:
--   • get_admin_dashboard_overview().pending_instructors_count stays at 0, so
--     the admin overview never surfaces instructors waiting for review.
--   • The admin instructors list's "pending" status filter returns an empty
--     page, so there is no way to find and approve them from that view.
--   • notify_slack_instructor_signup fires on `is distinct from 'active'`, so
--     Slack still pings — but the approval buttons resolve back to a profile
--     the admin UI says doesn't exist.
--
-- This migration normalizes the column by ROLE at write time (a column default
-- would also stamp 'pending' onto students, who have no approval gate):
--
--   1. A BEFORE INSERT/UPDATE trigger sets instructor_status = 'pending' for
--      instructor rows that have no status, and clears it for non-instructors.
--   2. The signup trigger is rewritten to write the status explicitly, so the
--      insert never depends on another trigger's ordering.
--   3. Existing instructors stuck on NULL are backfilled.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Role-aware normalization -------------------------------------------------
create or replace function public.normalize_instructor_status()
returns trigger
language plpgsql
set search_path = 'public'
as $function$
begin
  if new.role = 'instructor'::public.user_role then
    -- No status means "signed up, waiting for review".
    if new.instructor_status is null then
      new.instructor_status := 'pending'::public.account_status;
    end if;
  else
    -- Students/school staff/admins have no instructor approval gate; a stale
    -- value here would wrongly hide them behind the verification screen if
    -- their role ever changed.
    new.instructor_status := null;
  end if;

  return new;
end;
$function$;

drop trigger if exists "normalize_instructor_status" on "public"."profiles";

create trigger "normalize_instructor_status"
before insert or update on "public"."profiles"
for each row
execute function "public"."normalize_instructor_status"();

-- 2. Signup trigger ----------------------------------------------------------
-- Keeps every column from the previous definition and adds instructor_status.
create or replace function public.handle_new_user_profile_creation()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_role public.user_role;
begin
  v_role := case
    when new.raw_user_meta_data->>'role' in ('instructor', 'student')
      then (new.raw_user_meta_data->>'role')::public.user_role
    else 'student'::public.user_role
  end;

  insert into public.profiles (
    id, full_name, email, phone, avatar_url, role, locale, province_id,
    instructor_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Unknown'),
    coalesce(new.email, null),
    coalesce(new.phone, null),
    coalesce(new.raw_user_meta_data->>'avatar_url', null),
    v_role,
    coalesce(new.raw_user_meta_data->>'locale', 'fa')::public.language_enum,
    (new.raw_user_meta_data->>'province_id')::uuid,
    -- Instructors are gated until an admin approves them; students are not.
    case
      when v_role = 'instructor'::public.user_role
        then 'pending'::public.account_status
      else null
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

-- 3. Backfill ----------------------------------------------------------------
-- Existing instructor profiles with no status are, by definition, accounts the
-- approval predicates above could never see. Only touch NULL: a row that is
-- already active/suspended/disabled/rejected must keep its real state.
--
-- The Slack notify trigger fires AFTER UPDATE when
-- `old.instructor_status is distinct from new.instructor_status`, so this
-- backfill would re-announce instructors that were already posted at signup.
-- Disable it for the duration of the backfill, then re-enable it.
alter table public.profiles
  disable trigger "notify_slack_instructor_signup_update";

update public.profiles
set instructor_status = 'pending'::public.account_status
where role = 'instructor'::public.user_role
  and instructor_status is null;

alter table public.profiles
  enable trigger "notify_slack_instructor_signup_update";
