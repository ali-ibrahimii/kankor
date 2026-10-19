-- Agencies module — Phase 2: moderation (see docs/agencies.md)
--
-- Enforces the `schools.suspend`, `instructors.suspend`, and `schools.manage`
-- grants defined in Phase 1 (20260718000000_agencies_module.sql):
--   * agency_set_school_status / agency_set_instructor_status — suspend or
--     reactivate within the grant's scope (global / province / entity list).
--     Agencies can only REVERSE THEIR OWN suspensions; anything set by a
--     super admin (or another agency) is out of reach. Super admins can
--     always override via the existing admin tooling.
--   * agency_update_school — whitelisted detail edits under `schools.manage`.
--     (School membership management stays super-admin/school-admin only for
--     now — see docs/agencies.md.)
--   * Definer views feed the agency moderation UI, gated per caller.
--
-- Suspension side effects come for free: is_content_owner_active() (from
-- 20260717000000) already hides content of suspended schools/instructors,
-- and the school dashboard locks out members of non-active schools.

-- ─────────────────────────────────────────────────────────────────────────
-- Attribution columns — who suspended this account and why. Only definer
-- RPCs write these; profiles' column-listed UPDATE grant (see the credits
-- migration) already keeps authenticated users away from new columns.
-- ─────────────────────────────────────────────────────────────────────────

alter table "public"."schools"
	add column "suspended_by_agency_id" uuid references public.agencies(id) on delete set null,
	add column "suspension_reason" text;

alter table "public"."profiles"
	add column "instructor_suspended_by_agency_id" uuid references public.agencies(id) on delete set null,
	add column "instructor_suspension_reason" text;

-- ─────────────────────────────────────────────────────────────────────────
-- RPCs
-- ─────────────────────────────────────────────────────────────────────────

-- Suspend or reactivate a school within the agency's `schools.suspend` scope.
create or replace function public.agency_set_school_status(
  p_agency_id uuid,
  p_school_id uuid,
  p_action text, -- 'suspend' | 'reactivate'
  p_reason text default null
)
returns public.schools
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor uuid := auth.uid();
  v_school public.schools;
begin
  if p_action not in ('suspend', 'reactivate') then
    raise exception 'invalid_action';
  end if;

  select * into v_school from public.schools where id = p_school_id for update;
  if not found then
    raise exception 'school_not_found';
  end if;

  if not public.agency_has_permission(
    p_agency_id, 'schools.suspend'::public.agency_permission,
    v_actor, v_school.province_id, v_school.id
  ) then
    raise exception 'permission_denied';
  end if;

  if p_action = 'suspend' then
    -- Only active schools can be agency-suspended; verification states
    -- (pending/rejected/disabled) belong to super admins.
    if v_school.status <> 'active' then
      raise exception 'invalid_status_transition';
    end if;
    update public.schools
    set status = 'suspended',
        suspended_by_agency_id = p_agency_id,
        suspension_reason = nullif(trim(coalesce(p_reason, '')), '')
    where id = p_school_id
    returning * into v_school;
  else
    -- Agencies may only reverse suspensions they issued themselves.
    if v_school.status <> 'suspended'
       or v_school.suspended_by_agency_id is distinct from p_agency_id then
      raise exception 'invalid_status_transition';
    end if;
    update public.schools
    set status = 'active',
        suspended_by_agency_id = null,
        suspension_reason = null
    where id = p_school_id
    returning * into v_school;
  end if;

  perform public.log_agency_action(
    p_agency_id, v_actor,
    case when p_action = 'suspend' then 'suspend_school' else 'reactivate_school' end,
    'schools.suspend'::public.agency_permission,
    'school', p_school_id,
    jsonb_build_object('reason', p_reason)
  );

  return v_school;
end;
$function$;

-- Suspend or reactivate an instructor within `instructors.suspend` scope.
create or replace function public.agency_set_instructor_status(
  p_agency_id uuid,
  p_instructor_id uuid,
  p_action text, -- 'suspend' | 'reactivate'
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor uuid := auth.uid();
  v_profile public.profiles;
begin
  if p_action not in ('suspend', 'reactivate') then
    raise exception 'invalid_action';
  end if;

  select * into v_profile from public.profiles
  where id = p_instructor_id and role = 'instructor'
  for update;
  if not found then
    raise exception 'instructor_not_found';
  end if;

  if not public.agency_has_permission(
    p_agency_id, 'instructors.suspend'::public.agency_permission,
    v_actor, v_profile.province_id, v_profile.id
  ) then
    raise exception 'permission_denied';
  end if;

  if p_action = 'suspend' then
    if v_profile.instructor_status <> 'active' then
      raise exception 'invalid_status_transition';
    end if;
    update public.profiles
    set instructor_status = 'suspended',
        instructor_suspended_by_agency_id = p_agency_id,
        instructor_suspension_reason = nullif(trim(coalesce(p_reason, '')), '')
    where id = p_instructor_id;
  else
    if v_profile.instructor_status <> 'suspended'
       or v_profile.instructor_suspended_by_agency_id is distinct from p_agency_id then
      raise exception 'invalid_status_transition';
    end if;
    update public.profiles
    set instructor_status = 'active',
        instructor_suspended_by_agency_id = null,
        instructor_suspension_reason = null
    where id = p_instructor_id;
  end if;

  perform public.log_agency_action(
    p_agency_id, v_actor,
    case when p_action = 'suspend' then 'suspend_instructor' else 'reactivate_instructor' end,
    'instructors.suspend'::public.agency_permission,
    'profile', p_instructor_id,
    jsonb_build_object('reason', p_reason)
  );
end;
$function$;

-- Whitelisted school-detail edits under `schools.manage`. Status changes and
-- membership stay out of reach (status via agency_set_school_status only).
create or replace function public.agency_update_school(
  p_agency_id uuid,
  p_school_id uuid,
  p_name text default null,
  p_address text default null,
  p_admin_email text default null
)
returns public.schools
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor uuid := auth.uid();
  v_school public.schools;
begin
  select * into v_school from public.schools where id = p_school_id for update;
  if not found then
    raise exception 'school_not_found';
  end if;

  if not public.agency_has_permission(
    p_agency_id, 'schools.manage'::public.agency_permission,
    v_actor, v_school.province_id, v_school.id
  ) then
    raise exception 'permission_denied';
  end if;

  update public.schools
  set name = coalesce(nullif(trim(coalesce(p_name, '')), ''), name),
      address = coalesce(p_address, address),
      admin_email = coalesce(p_admin_email, admin_email)
  where id = p_school_id
  returning * into v_school;

  perform public.log_agency_action(
    p_agency_id, v_actor, 'update_school',
    'schools.manage'::public.agency_permission,
    'school', p_school_id,
    jsonb_build_object('name', p_name, 'address', p_address, 'admin_email', p_admin_email)
  );

  return v_school;
end;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- Definer views for the agency moderation UI. One row per (agency, target)
-- pair for the CALLER's active agency memberships, restricted to targets
-- inside the relevant grant's scope. Schools/instructors are business
-- accounts, so contact emails are exposed unmasked (unlike students).
-- ─────────────────────────────────────────────────────────────────────────

create view "public"."agency_moderated_schools_view"  with (security_invoker = on) as
select
  m.agency_id,
  s.id,
  s.name,
  s.admin_email,
  s.address,
  s.status,
  s.province_id,
  pr.name as province_name,
  s.suspended_by_agency_id,
  s.suspension_reason,
  s.created_at,
  public.agency_has_permission(m.agency_id, 'schools.suspend', m.user_id, s.province_id, s.id) as can_suspend,
  public.agency_has_permission(m.agency_id, 'schools.manage', m.user_id, s.province_id, s.id) as can_manage
from public.agency_members m
cross join public.schools s
left join public.provinces pr on pr.id = s.province_id
where m.user_id = auth.uid()
  and m.status = 'active'
  and (
    public.agency_has_permission(m.agency_id, 'schools.suspend', m.user_id, s.province_id, s.id)
    or public.agency_has_permission(m.agency_id, 'schools.manage', m.user_id, s.province_id, s.id)
  );

create view "public"."agency_moderated_instructors_view"  with (security_invoker = on) as
select
  m.agency_id,
  p.id,
  p.full_name,
  p.email,
  p.avatar_url,
  p.instructor_status,
  p.province_id,
  pr.name as province_name,
  p.instructor_suspended_by_agency_id,
  p.instructor_suspension_reason,
  p.created_at,
  public.agency_has_permission(m.agency_id, 'instructors.suspend', m.user_id, p.province_id, p.id) as can_suspend
from public.agency_members m
cross join public.profiles p
left join public.provinces pr on pr.id = p.province_id
where p.role = 'instructor'
  and m.user_id = auth.uid()
  and m.status = 'active'
  and public.agency_has_permission(m.agency_id, 'instructors.suspend', m.user_id, p.province_id, p.id);

grant select on "public"."agency_moderated_schools_view" to "authenticated";
grant select on "public"."agency_moderated_instructors_view" to "authenticated";
grant select on "public"."agency_moderated_schools_view" to "service_role";
grant select on "public"."agency_moderated_instructors_view" to "service_role";

-- ─────────────────────────────────────────────────────────────────────────
-- Function grants
-- ─────────────────────────────────────────────────────────────────────────

grant execute on function public.agency_set_school_status(uuid, uuid, text, text) to "authenticated";
grant execute on function public.agency_set_instructor_status(uuid, uuid, text, text) to "authenticated";
grant execute on function public.agency_update_school(uuid, uuid, text, text, text) to "authenticated";
