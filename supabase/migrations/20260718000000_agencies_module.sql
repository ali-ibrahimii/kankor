-- Agencies module (Phase 1: core + money) — see docs/agencies.md
--
-- Agencies are third-party organizations with strictly defined, deny-by-default
-- permissions. Phase 1 ships the org structure (agencies / members / grants),
-- the cash top-up flow (agency collects cash from a student, 1 credit = 1 AFN,
-- and credits their account), postpaid liability tracking + settlements with a
-- platform-paid commission, disputes, and an append-only audit log.
--
-- Enforcement model:
--   * Agency members get NO broad table access. They can read only their own
--     agency's rows; every action goes through SECURITY DEFINER RPCs that call
--     agency_has_permission() (agency active + member active + grant exists +
--     target inside the grant's scope).
--   * `students.charge` deliberately grants no SELECT on profiles — the email
--     lookup happens inside agency_charge_student() and only a masked
--     confirmation is returned.

-- ─────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────

create type "public"."agency_status" as enum ('active', 'suspended');
create type "public"."agency_member_role" as enum ('owner', 'admin', 'staff');
create type "public"."agency_member_status" as enum ('active', 'disabled');

-- Platform-defined permission catalog. Adding a capability is a deliberate
-- migration, never ad-hoc. Phase 1 only enforces `students.charge`; the rest
-- are defined so grants can be configured ahead of Phases 2–3.
create type "public"."agency_permission" as enum (
  'students.charge',
  'schools.suspend',
  'instructors.suspend',
  'schools.manage',
  'courses.manage_own',
  'decks.manage_own',
  'quizzes.manage_own',
  'courses.manage_any',
  'decks.manage_any',
  'quizzes.manage_any'
);

create type "public"."agency_grant_scope" as enum ('global', 'province', 'entities');
create type "public"."agency_settlement_method" as enum ('bank', 'hawala', 'cash', 'other');
create type "public"."agency_dispute_status" as enum ('open', 'resolved', 'rejected');

-- ─────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────

create table "public"."agencies" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "province_id" uuid references public.provinces(id) on delete set null,
  "contact_email" text,
  "contact_phone" text,
  "address" text,
  "status" public.agency_status not null default 'active',
  -- Commission the platform pays the agency on charged volume, applied at
  -- settlement time (e.g. 0.05 = 5%).
  "commission_rate" numeric(5, 4) not null default 0,
  -- Mandatory risk cap: charging is blocked once outstanding (charged minus
  -- settled) would exceed this. 1 credit = 1 AFN.
  "liability_limit" integer not null,
  "created_by" uuid references public.profiles(id) on delete set null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "agencies_pkey" primary key ("id"),
  constraint "agencies_commission_rate_check" check (commission_rate >= 0 and commission_rate < 1),
  constraint "agencies_liability_limit_check" check (liability_limit > 0)
);

create table "public"."agency_members" (
  "id" uuid not null default gen_random_uuid(),
  "agency_id" uuid not null references public.agencies(id) on delete cascade,
  "user_id" uuid not null references public.profiles(id) on delete cascade,
  "role" public.agency_member_role not null default 'staff',
  "status" public.agency_member_status not null default 'active',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "agency_members_pkey" primary key ("id"),
  constraint "agency_members_agency_user_unique" unique ("agency_id", "user_id")
);

create table "public"."agency_grants" (
  "id" uuid not null default gen_random_uuid(),
  "agency_id" uuid not null references public.agencies(id) on delete cascade,
  "permission" public.agency_permission not null,
  "scope_type" public.agency_grant_scope not null default 'global',
  -- province scope: {"province_ids": [uuid, ...]}
  -- entities scope: {"entity_ids": [uuid, ...]}
  "scope" jsonb,
  "granted_by" uuid references public.profiles(id) on delete set null,
  "created_at" timestamptz not null default now(),
  constraint "agency_grants_pkey" primary key ("id"),
  constraint "agency_grants_agency_permission_unique" unique ("agency_id", "permission"),
  constraint "agency_grants_scope_shape_check" check (
    (scope_type = 'global' and scope is null)
    or (scope_type = 'province' and jsonb_typeof(scope -> 'province_ids') = 'array')
    or (scope_type = 'entities' and jsonb_typeof(scope -> 'entity_ids') = 'array')
  )
);

-- One row per cash top-up an agency performs for a student. The student-side
-- ledger entry lives in credit_transactions (type 'topup', reference_type
-- 'agency_topup'); this table is the agency-side liability record.
create table "public"."agency_topups" (
  "id" uuid not null default gen_random_uuid(),
  "agency_id" uuid not null references public.agencies(id) on delete restrict,
  -- The individual employee who performed the charge — per-person accountability.
  "member_id" uuid not null references public.profiles(id) on delete restrict,
  "student_id" uuid not null references public.profiles(id) on delete restrict,
  "amount" integer not null,
  "credit_transaction_id" uuid references public.credit_transactions(id) on delete set null,
  "note" text,
  "created_at" timestamptz not null default now(),
  constraint "agency_topups_pkey" primary key ("id"),
  constraint "agency_topups_amount_check" check (amount > 0)
);

create index "agency_topups_agency_idx" on "public"."agency_topups" using btree ("agency_id", "created_at" desc);
create index "agency_topups_student_idx" on "public"."agency_topups" using btree ("student_id", "created_at" desc);
create index "agency_topups_member_idx" on "public"."agency_topups" using btree ("member_id", "created_at" desc);

-- One row per cash transfer from the agency to Abzar Kankor. Commission is
-- computed and snapshotted here (gross = commission + net). Cadence: weekly
-- or monthly per agency, never longer than monthly (enforced operationally).
create table "public"."agency_settlements" (
  "id" uuid not null default gen_random_uuid(),
  "agency_id" uuid not null references public.agencies(id) on delete restrict,
  "gross_amount" integer not null,
  "commission_amount" integer not null,
  "net_received" integer not null,
  "method" public.agency_settlement_method not null default 'cash',
  "period_start" date,
  "period_end" date,
  "note" text,
  "recorded_by" uuid references public.profiles(id) on delete set null,
  "created_at" timestamptz not null default now(),
  constraint "agency_settlements_pkey" primary key ("id"),
  constraint "agency_settlements_gross_check" check (gross_amount > 0),
  constraint "agency_settlements_commission_check" check (commission_amount >= 0),
  constraint "agency_settlements_sum_check" check (gross_amount = commission_amount + net_received)
);

create index "agency_settlements_agency_idx" on "public"."agency_settlements" using btree ("agency_id", "created_at" desc);

-- Student-raised disputes over a top-up ("I paid 500, got 300"). Visible to
-- both the agency (view + respond) and super admins (resolve, optionally with
-- a compensating credit adjustment).
create table "public"."agency_disputes" (
  "id" uuid not null default gen_random_uuid(),
  "agency_id" uuid not null references public.agencies(id) on delete cascade,
  "topup_id" uuid not null references public.agency_topups(id) on delete cascade,
  "student_id" uuid not null references public.profiles(id) on delete cascade,
  "status" public.agency_dispute_status not null default 'open',
  "student_note" text not null,
  "agency_response" text,
  "resolution_note" text,
  "resolved_by" uuid references public.profiles(id) on delete set null,
  "adjustment_transaction_id" uuid references public.credit_transactions(id) on delete set null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "agency_disputes_pkey" primary key ("id"),
  constraint "agency_disputes_topup_unique" unique ("topup_id")
);

create index "agency_disputes_agency_idx" on "public"."agency_disputes" using btree ("agency_id", "status", "created_at" desc);
create index "agency_disputes_student_idx" on "public"."agency_disputes" using btree ("student_id", "created_at" desc);

-- Append-only audit trail of every agency action. No UPDATE/DELETE for any
-- API role; rows are written exclusively by the SECURITY DEFINER RPCs below.
create table "public"."agency_audit_log" (
  "id" uuid not null default gen_random_uuid(),
  "agency_id" uuid not null references public.agencies(id) on delete cascade,
  "actor_id" uuid references public.profiles(id) on delete set null,
  "permission_used" public.agency_permission,
  "action" text not null,
  "target_type" text,
  "target_id" uuid,
  "payload" jsonb,
  "created_at" timestamptz not null default now(),
  constraint "agency_audit_log_pkey" primary key ("id")
);

create index "agency_audit_log_agency_idx" on "public"."agency_audit_log" using btree ("agency_id", "created_at" desc);

-- updated_at maintenance (same helper the rest of the schema uses)
create trigger "agencies_updated_at" before update on "public"."agencies"
  for each row execute function public.handle_updated_at();
create trigger "agency_members_updated_at" before update on "public"."agency_members"
  for each row execute function public.handle_updated_at();
create trigger "agency_disputes_updated_at" before update on "public"."agency_disputes"
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Helper functions (RLS + RPC building blocks)
-- ─────────────────────────────────────────────────────────────────────────

-- Active membership check. SECURITY DEFINER so RLS on agency_members can use
-- it without recursing into itself (same pattern as is_school_member).
create or replace function public.is_agency_member(
  p_agency_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select p_agency_id is not null and exists (
    select 1 from public.agency_members
    where agency_id = p_agency_id
      and user_id = p_user_id
      and status = 'active'
  );
$$;

create or replace function public.agency_member_role(
  p_agency_id uuid,
  p_user_id uuid default auth.uid()
)
returns public.agency_member_role
language sql
stable
security definer
set search_path to 'public'
as $$
  select role from public.agency_members
  where agency_id = p_agency_id and user_id = p_user_id and status = 'active';
$$;

-- Super admin, or an active owner/admin member of the agency.
create or replace function public.is_agency_admin(
  p_agency_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select public.is_admin(p_user_id) or exists (
    select 1 from public.agency_members
    where agency_id = p_agency_id
      and user_id = p_user_id
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;

-- THE single authorization gate for agency actions. Deny by default:
--   agency active  AND  caller is an active member  AND  a grant row exists
--   AND the target falls inside the grant's scope.
-- Scope semantics:
--   global   → always passes
--   province → p_target_province must be listed in scope.province_ids
--   entities → p_target_entity must be listed in scope.entity_ids
-- A grant scoped in a dimension the caller can't satisfy (null target) fails.
create or replace function public.agency_has_permission(
  p_agency_id uuid,
  p_permission public.agency_permission,
  p_user_id uuid default auth.uid(),
  p_target_province uuid default null,
  p_target_entity uuid default null
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.agencies a
    join public.agency_members m
      on m.agency_id = a.id and m.user_id = p_user_id and m.status = 'active'
    join public.agency_grants g
      on g.agency_id = a.id and g.permission = p_permission
    where a.id = p_agency_id
      and a.status = 'active'
      and (
        g.scope_type = 'global'
        or (
          g.scope_type = 'province'
          and p_target_province is not null
          and g.scope -> 'province_ids' @> to_jsonb(array[p_target_province])
        )
        or (
          g.scope_type = 'entities'
          and p_target_entity is not null
          and g.scope -> 'entity_ids' @> to_jsonb(array[p_target_entity])
        )
      )
  );
$$;

-- Outstanding liability = everything charged minus everything settled (gross).
create or replace function public.agency_outstanding_liability(p_agency_id uuid)
returns bigint
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce((select sum(amount) from public.agency_topups where agency_id = p_agency_id), 0)
       - coalesce((select sum(gross_amount) from public.agency_settlements where agency_id = p_agency_id), 0);
$$;

-- Internal audit writer. Not exposed: only called from the RPCs below.
create or replace function public.log_agency_action(
  p_agency_id uuid,
  p_actor_id uuid,
  p_action text,
  p_permission public.agency_permission default null,
  p_target_type text default null,
  p_target_id uuid default null,
  p_payload jsonb default null
)
returns void
language sql
security definer
set search_path to 'public'
as $$
  insert into public.agency_audit_log (
    agency_id, actor_id, action, permission_used, target_type, target_id, payload
  ) values (
    p_agency_id, p_actor_id, p_action, p_permission, p_target_type, p_target_id, p_payload
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPCs
-- ─────────────────────────────────────────────────────────────────────────

-- The Phase-1 core flow: a student hands the agency cash; the agency charges
-- their account by email. Returns only a masked confirmation — holding
-- `students.charge` never exposes student lists or profiles.
create or replace function public.agency_charge_student(
  p_agency_id uuid,
  p_student_email text,
  p_amount integer,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor uuid := auth.uid();
  v_agency public.agencies;
  v_student public.profiles;
  v_outstanding bigint;
  v_txn public.credit_transactions;
  v_topup public.agency_topups;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  -- Lock the agency row: serializes concurrent charges so the liability
  -- limit can't be overshot by parallel requests.
  select * into v_agency from public.agencies where id = p_agency_id for update;
  if not found then
    raise exception 'agency_not_found';
  end if;

  select * into v_student
  from public.profiles
  where lower(email) = lower(trim(p_student_email))
    and role = 'student'
  limit 1;
  if not found then
    raise exception 'student_not_found';
  end if;

  -- Deny-by-default gate (agency active + member active + grant + scope).
  -- Province-scoped grants are checked against the student's province.
  if not public.agency_has_permission(
    p_agency_id, 'students.charge'::public.agency_permission,
    v_actor, v_student.province_id
  ) then
    raise exception 'permission_denied';
  end if;

  v_outstanding := public.agency_outstanding_liability(p_agency_id);
  if v_outstanding + p_amount > v_agency.liability_limit then
    raise exception 'liability_limit_exceeded';
  end if;

  v_txn := public.record_credit_transaction(
    p_profile_id => v_student.id,
    p_amount => p_amount,
    p_type => 'topup'::public.credit_transaction_type,
    p_reference_type => 'agency_topup',
    p_note => p_note,
    p_created_by => v_actor
  );

  insert into public.agency_topups (
    agency_id, member_id, student_id, amount, credit_transaction_id, note
  ) values (
    p_agency_id, v_actor, v_student.id, p_amount, v_txn.id, p_note
  ) returning * into v_topup;

  update public.credit_transactions set reference_id = v_topup.id where id = v_txn.id;

  perform public.log_agency_action(
    p_agency_id, v_actor, 'charge_student',
    'students.charge'::public.agency_permission,
    'profile', v_student.id,
    jsonb_build_object('topup_id', v_topup.id, 'amount', p_amount)
  );

  return jsonb_build_object(
    'topup_id', v_topup.id,
    'amount', p_amount,
    'student_name', v_student.full_name,
    'student_email_masked',
      left(split_part(v_student.email, '@', 1), 2) || '***@' || split_part(v_student.email, '@', 2),
    'balance_after', v_txn.balance_after,
    'created_at', v_topup.created_at
  );
end;
$function$;

-- Agency owner/admin (or super admin) adds a member by email. Needed because
-- agency staff deliberately have no SELECT on profiles, so the email→user
-- lookup must happen inside a definer function. Only super admins can seat
-- an 'owner'.
create or replace function public.add_agency_member(
  p_agency_id uuid,
  p_email text,
  p_role public.agency_member_role default 'staff'
)
returns public.agency_members
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor uuid := auth.uid();
  v_user public.profiles;
  v_member public.agency_members;
begin
  if not public.is_agency_admin(p_agency_id, v_actor) then
    raise exception 'permission_denied';
  end if;

  if p_role = 'owner' and not public.is_admin(v_actor) then
    raise exception 'permission_denied';
  end if;

  select * into v_user
  from public.profiles
  where lower(email) = lower(trim(p_email))
  limit 1;
  if not found then
    raise exception 'user_not_found';
  end if;

  insert into public.agency_members (agency_id, user_id, role)
  values (p_agency_id, v_user.id, p_role)
  on conflict (agency_id, user_id)
    do update set role = excluded.role, status = 'active'
  returning * into v_member;

  perform public.log_agency_action(
    p_agency_id, v_actor, 'add_member', null,
    'profile', v_user.id, jsonb_build_object('role', p_role)
  );

  return v_member;
end;
$function$;

-- Super admin records a cash transfer received from an agency. Commission is
-- computed from the agency's current rate and snapshotted on the row.
create or replace function public.record_agency_settlement(
  p_agency_id uuid,
  p_gross_amount integer,
  p_method public.agency_settlement_method default 'cash',
  p_period_start date default null,
  p_period_end date default null,
  p_note text default null
)
returns public.agency_settlements
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_agency public.agencies;
  v_commission integer;
  v_settlement public.agency_settlements;
begin
  if not public.is_admin() then
    raise exception 'permission_denied';
  end if;

  if p_gross_amount is null or p_gross_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into v_agency from public.agencies where id = p_agency_id for update;
  if not found then
    raise exception 'agency_not_found';
  end if;

  if p_gross_amount > public.agency_outstanding_liability(p_agency_id) then
    raise exception 'settlement_exceeds_outstanding';
  end if;

  v_commission := floor(p_gross_amount * v_agency.commission_rate)::integer;

  insert into public.agency_settlements (
    agency_id, gross_amount, commission_amount, net_received,
    method, period_start, period_end, note, recorded_by
  ) values (
    p_agency_id, p_gross_amount, v_commission, p_gross_amount - v_commission,
    p_method, p_period_start, p_period_end, p_note, auth.uid()
  ) returning * into v_settlement;

  perform public.log_agency_action(
    p_agency_id, auth.uid(), 'record_settlement', null,
    'agency_settlement', v_settlement.id,
    jsonb_build_object('gross', p_gross_amount, 'commission', v_commission)
  );

  return v_settlement;
end;
$function$;

-- Student opens a dispute against one of their own top-ups.
create or replace function public.open_agency_topup_dispute(
  p_topup_id uuid,
  p_note text
)
returns public.agency_disputes
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor uuid := auth.uid();
  v_topup public.agency_topups;
  v_dispute public.agency_disputes;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;
  if p_note is null or length(trim(p_note)) = 0 then
    raise exception 'note_required';
  end if;

  select * into v_topup from public.agency_topups where id = p_topup_id;
  if not found or v_topup.student_id <> v_actor then
    raise exception 'topup_not_found';
  end if;

  insert into public.agency_disputes (agency_id, topup_id, student_id, student_note)
  values (v_topup.agency_id, p_topup_id, v_actor, trim(p_note))
  returning * into v_dispute;

  perform public.log_agency_action(
    v_topup.agency_id, v_actor, 'open_dispute', null,
    'agency_dispute', v_dispute.id, jsonb_build_object('topup_id', p_topup_id)
  );

  return v_dispute;
end;
$function$;

-- Agency responds to a dispute against one of its transactions.
create or replace function public.respond_agency_dispute(
  p_dispute_id uuid,
  p_response text
)
returns public.agency_disputes
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor uuid := auth.uid();
  v_dispute public.agency_disputes;
begin
  select * into v_dispute from public.agency_disputes where id = p_dispute_id for update;
  if not found or not public.is_agency_member(v_dispute.agency_id, v_actor) then
    raise exception 'dispute_not_found';
  end if;
  if v_dispute.status <> 'open' then
    raise exception 'dispute_closed';
  end if;
  if p_response is null or length(trim(p_response)) = 0 then
    raise exception 'response_required';
  end if;

  update public.agency_disputes
  set agency_response = trim(p_response)
  where id = p_dispute_id
  returning * into v_dispute;

  perform public.log_agency_action(
    v_dispute.agency_id, v_actor, 'respond_dispute', null,
    'agency_dispute', p_dispute_id, null
  );

  return v_dispute;
end;
$function$;

-- Super admin resolves a dispute, optionally issuing a compensating credit
-- adjustment to the student (positive = credit the student).
create or replace function public.resolve_agency_dispute(
  p_dispute_id uuid,
  p_status public.agency_dispute_status,
  p_resolution_note text default null,
  p_adjustment_amount integer default null
)
returns public.agency_disputes
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_dispute public.agency_disputes;
  v_txn public.credit_transactions;
begin
  if not public.is_admin() then
    raise exception 'permission_denied';
  end if;
  if p_status not in ('resolved', 'rejected') then
    raise exception 'invalid_status';
  end if;

  select * into v_dispute from public.agency_disputes where id = p_dispute_id for update;
  if not found then
    raise exception 'dispute_not_found';
  end if;
  if v_dispute.status <> 'open' then
    raise exception 'dispute_closed';
  end if;

  if p_adjustment_amount is not null and p_adjustment_amount <> 0 then
    v_txn := public.record_credit_transaction(
      p_profile_id => v_dispute.student_id,
      p_amount => p_adjustment_amount,
      p_type => 'adjustment'::public.credit_transaction_type,
      p_reference_type => 'agency_dispute',
      p_reference_id => p_dispute_id,
      p_note => p_resolution_note,
      p_created_by => auth.uid()
    );
  end if;

  update public.agency_disputes
  set status = p_status,
      resolution_note = p_resolution_note,
      resolved_by = auth.uid(),
      adjustment_transaction_id = v_txn.id
  where id = p_dispute_id
  returning * into v_dispute;

  perform public.log_agency_action(
    v_dispute.agency_id, auth.uid(), 'resolve_dispute', null,
    'agency_dispute', p_dispute_id,
    jsonb_build_object('status', p_status, 'adjustment', p_adjustment_amount)
  );

  return v_dispute;
end;
$function$;

-- Aggregate stats for the agency dashboard (and the admin's per-agency view).
create or replace function public.get_agency_overview(p_agency_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
begin
  if not (public.is_admin() or public.is_agency_member(p_agency_id)) then
    raise exception 'permission_denied';
  end if;

  select jsonb_build_object(
    'charged_total', coalesce(sum(t.amount), 0),
    'topup_count', count(t.id),
    'students_charged', count(distinct t.student_id),
    'charged_last_30d', coalesce(sum(t.amount) filter (where t.created_at > now() - interval '30 days'), 0),
    'settled_gross', coalesce((select sum(gross_amount) from public.agency_settlements where agency_id = p_agency_id), 0),
    'commission_earned', coalesce((select sum(commission_amount) from public.agency_settlements where agency_id = p_agency_id), 0),
    'outstanding', public.agency_outstanding_liability(p_agency_id),
    'liability_limit', (select liability_limit from public.agencies where id = p_agency_id),
    'open_disputes', (select count(*) from public.agency_disputes where agency_id = p_agency_id and status = 'open')
  ) into v_result
  from public.agency_topups t
  where t.agency_id = p_agency_id;

  return v_result;
end;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- Liability summary view (admin dashboard). security_invoker so the
-- underlying agencies RLS applies to the caller.
-- ─────────────────────────────────────────────────────────────────────────

create view "public"."agency_liability_summary"
with (security_invoker = true)
as
select
  a.id,
  a.name,
  a.status,
  a.commission_rate,
  a.liability_limit,
  coalesce(t.charged_total, 0) as charged_total,
  coalesce(s.settled_gross, 0) as settled_gross,
  coalesce(s.commission_total, 0) as commission_total,
  coalesce(t.charged_total, 0) - coalesce(s.settled_gross, 0) as outstanding,
  t.last_topup_at,
  s.last_settlement_at
from public.agencies a
left join (
  select agency_id, sum(amount) as charged_total, max(created_at) as last_topup_at
  from public.agency_topups group by agency_id
) t on t.agency_id = a.id
left join (
  select agency_id, sum(gross_amount) as settled_gross,
         sum(commission_amount) as commission_total,
         max(created_at) as last_settlement_at
  from public.agency_settlements group by agency_id
) s on s.agency_id = a.id;

grant select on "public"."agency_liability_summary" to "authenticated";
grant select on "public"."agency_liability_summary" to "service_role";

-- ─────────────────────────────────────────────────────────────────────────
-- Curated definer views. Agency staff deliberately have no SELECT on
-- profiles, but the UI still needs member names and student receipts.
-- These run as owner (bypassing profiles RLS) and gate access in WHERE:
-- super admins, members of that agency, or (for topups/disputes) the
-- student involved. Only masked student emails are ever exposed.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.mask_email(p_email text)
returns text
language sql
immutable
as $$
  select case
    when p_email is null or position('@' in p_email) = 0 then null
    else left(split_part(p_email, '@', 1), 2) || '***@' || split_part(p_email, '@', 2)
  end;
$$;

create view "public"."agency_members_view" with (security_invoker = on) as
select
  m.id,
  m.agency_id,
  m.user_id,
  m.role,
  m.status,
  m.created_at,
  p.full_name,
  p.email,
  p.avatar_url
from public.agency_members m
join public.profiles p on p.id = m.user_id
where public.is_admin() or public.is_agency_member(m.agency_id);

create view "public"."agency_topups_view"  with (security_invoker = on) as
select
  t.id,
  t.agency_id,
  t.member_id,
  t.student_id,
  t.amount,
  t.note,
  t.created_at,
  pm.full_name as member_name,
  ps.full_name as student_name,
  public.mask_email(ps.email) as student_email_masked,
  d.id as dispute_id,
  d.status as dispute_status
from public.agency_topups t
left join public.profiles pm on pm.id = t.member_id
left join public.profiles ps on ps.id = t.student_id
left join public.agency_disputes d on d.topup_id = t.id
where public.is_admin()
   or public.is_agency_member(t.agency_id)
   or t.student_id = auth.uid();

create view "public"."agency_disputes_view"  with (security_invoker = on) as
select
  d.id,
  d.agency_id,
  d.topup_id,
  d.student_id,
  d.status,
  d.student_note,
  d.agency_response,
  d.resolution_note,
  d.created_at,
  d.updated_at,
  t.amount as topup_amount,
  t.created_at as topup_created_at,
  ps.full_name as student_name,
  public.mask_email(ps.email) as student_email_masked
from public.agency_disputes d
join public.agency_topups t on t.id = d.topup_id
left join public.profiles ps on ps.id = d.student_id
where public.is_admin()
   or public.is_agency_member(d.agency_id)
   or d.student_id = auth.uid();

grant select on "public"."agency_members_view" to "authenticated";
grant select on "public"."agency_topups_view" to "authenticated";
grant select on "public"."agency_disputes_view" to "authenticated";
grant select on "public"."agency_members_view" to "service_role";
grant select on "public"."agency_topups_view" to "service_role";
grant select on "public"."agency_disputes_view" to "service_role";
grant execute on function public.mask_email(text) to "authenticated";

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — deny by default; reads scoped to own agency; writes via RPCs only
-- (except agencies/members/grants management, which is RLS-gated directly).
-- ─────────────────────────────────────────────────────────────────────────

alter table "public"."agencies" enable row level security;
alter table "public"."agency_members" enable row level security;
alter table "public"."agency_grants" enable row level security;
alter table "public"."agency_topups" enable row level security;
alter table "public"."agency_settlements" enable row level security;
alter table "public"."agency_disputes" enable row level security;
alter table "public"."agency_audit_log" enable row level security;

-- agencies: members can see their own agency; only super admins manage.
grant select, insert, update, delete on table "public"."agencies" to "authenticated";
grant all on table "public"."agencies" to "service_role";

create policy "Members and admins can view agencies"
  on "public"."agencies" as permissive for select to authenticated
  using (public.is_admin() or public.is_agency_member(id));

create policy "Super admins manage agencies"
  on "public"."agencies" as permissive for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- agency_members: visible inside the agency; managed by super admins and
-- agency owner/admin (who cannot mint owners — only super admins can).
grant select, insert, update, delete on table "public"."agency_members" to "authenticated";
grant all on table "public"."agency_members" to "service_role";

create policy "Agency members can view their roster"
  on "public"."agency_members" as permissive for select to authenticated
  using (public.is_admin() or public.is_agency_member(agency_id));

create policy "Super admins manage agency members"
  on "public"."agency_members" as permissive for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Agency admins manage non-owner members"
  on "public"."agency_members" as permissive for all to authenticated
  using (public.is_agency_admin(agency_id) and role <> 'owner')
  with check (public.is_agency_admin(agency_id) and role <> 'owner');

-- agency_grants: transparent to the agency, writable only by super admins.
grant select, insert, update, delete on table "public"."agency_grants" to "authenticated";
grant all on table "public"."agency_grants" to "service_role";

create policy "Agency members can view their grants"
  on "public"."agency_grants" as permissive for select to authenticated
  using (public.is_admin() or public.is_agency_member(agency_id));

create policy "Super admins manage agency grants"
  on "public"."agency_grants" as permissive for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- agency_topups: read-only (writes only via agency_charge_student). The
-- charged student can see their own top-ups too.
grant select on table "public"."agency_topups" to "authenticated";
grant all on table "public"."agency_topups" to "service_role";

create policy "Agency, student, and admins can view topups"
  on "public"."agency_topups" as permissive for select to authenticated
  using (
    public.is_admin()
    or public.is_agency_member(agency_id)
    or public.is_owner(student_id)
  );

-- agency_settlements: read-only (writes only via record_agency_settlement).
grant select on table "public"."agency_settlements" to "authenticated";
grant all on table "public"."agency_settlements" to "service_role";

create policy "Agency and admins can view settlements"
  on "public"."agency_settlements" as permissive for select to authenticated
  using (public.is_admin() or public.is_agency_member(agency_id));

-- agency_disputes: read-only (writes only via the dispute RPCs).
grant select on table "public"."agency_disputes" to "authenticated";
grant all on table "public"."agency_disputes" to "service_role";

create policy "Parties can view disputes"
  on "public"."agency_disputes" as permissive for select to authenticated
  using (
    public.is_admin()
    or public.is_agency_member(agency_id)
    or public.is_owner(student_id)
  );

-- agency_audit_log: append-only; written exclusively by SECURITY DEFINER
-- functions. No UPDATE/DELETE for any API role.
grant select on table "public"."agency_audit_log" to "authenticated";
grant all on table "public"."agency_audit_log" to "service_role";

create policy "Agency and admins can view audit log"
  on "public"."agency_audit_log" as permissive for select to authenticated
  using (public.is_admin() or public.is_agency_member(agency_id));

-- ─────────────────────────────────────────────────────────────────────────
-- Function grants
-- ─────────────────────────────────────────────────────────────────────────

grant execute on function public.is_agency_member(uuid, uuid) to "authenticated";
grant execute on function public.agency_member_role(uuid, uuid) to "authenticated";
grant execute on function public.is_agency_admin(uuid, uuid) to "authenticated";
grant execute on function public.agency_has_permission(uuid, public.agency_permission, uuid, uuid, uuid) to "authenticated";
grant execute on function public.agency_outstanding_liability(uuid) to "authenticated";
grant execute on function public.agency_charge_student(uuid, text, integer, text) to "authenticated";
grant execute on function public.add_agency_member(uuid, text, public.agency_member_role) to "authenticated";
grant execute on function public.record_agency_settlement(uuid, integer, public.agency_settlement_method, date, date, text) to "authenticated";
grant execute on function public.open_agency_topup_dispute(uuid, text) to "authenticated";
grant execute on function public.respond_agency_dispute(uuid, text) to "authenticated";
grant execute on function public.resolve_agency_dispute(uuid, public.agency_dispute_status, text, integer) to "authenticated";
grant execute on function public.get_agency_overview(uuid) to "authenticated";

-- log_agency_action is internal: revoke the default public execute so only
-- the definer-owned RPCs above can call it.
revoke execute on function public.log_agency_action(uuid, uuid, text, public.agency_permission, text, uuid, jsonb) from public, anon, authenticated;
