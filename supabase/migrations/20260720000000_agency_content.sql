-- Agencies module — Phase 3: agency-owned content (see docs/agencies.md)
--
-- Enforces the `courses.manage_own` / `decks.manage_own` / `quizzes.manage_own`
-- grants (create/edit/delete content owned by the agency) and the higher-trust
-- `*.manage_any` grants (edit/delete ANY content, optionally entity-scoped).
--
-- Ownership model: content rows gain a nullable `agency_id`. The creating
-- member stays on `instructor_id`/`user_id` for provenance, but attribution
-- (sales, earnings) follows `agency_id` first — mirroring how `school_id`
-- already wins over the creating user. Agencies earn on sales under the same
-- revenue model as other content creators (per docs/agencies.md).
--
-- Anti-hijack: RESTRICTIVE policies stop anyone from stamping an agency_id
-- they don't hold `*.manage_own` for — otherwise any instructor could route
-- their sales attribution through an agency.

-- 'agency' seller attribution. NOTE: new enum values must not be used by DML
-- in this same migration (Postgres restriction); only the function body below
-- references it, which is fine (bodies are not validated at create time).
alter type "public"."seller_type" add value if not exists 'agency';

-- ─────────────────────────────────────────────────────────────────────────
-- Columns + indexes
-- ─────────────────────────────────────────────────────────────────────────

alter table "public"."courses"
	add column "agency_id" uuid references public.agencies(id) on delete set null;
alter table "public"."decks"
	add column "agency_id" uuid references public.agencies(id) on delete set null;
alter table "public"."quizzes"
	add column "agency_id" uuid references public.agencies(id) on delete set null;

create index "courses_agency_id_idx" on "public"."courses" using btree ("agency_id");
create index "decks_agency_id_idx" on "public"."decks" using btree ("agency_id");
create index "quizzes_agency_id_idx" on "public"."quizzes" using btree ("agency_id");

alter table "public"."purchases"
	add column "seller_agency_id" uuid references public.agencies(id) on delete set null;
create index "purchases_seller_agency_idx" on "public"."purchases" using btree ("seller_agency_id", "created_at" desc);

-- ─────────────────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────────────────

-- Active member of this agency holding a (globally scoped) content grant.
create or replace function public.is_agency_content_editor(
  p_agency_id uuid,
  p_permission public.agency_permission,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select p_agency_id is not null
     and public.agency_has_permission(p_agency_id, p_permission, p_user_id);
$$;

-- Caller belongs to ANY agency holding p_permission covering p_entity_id
-- (global grant, or entity-scoped grant listing this content id).
create or replace function public.agency_can_manage_any(
  p_permission public.agency_permission,
  p_entity_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.agency_members m
    where m.user_id = p_user_id
      and m.status = 'active'
      and public.agency_has_permission(
        m.agency_id, p_permission, p_user_id, null, p_entity_id
      )
  );
$$;

grant execute on function public.is_agency_content_editor(uuid, public.agency_permission, uuid) to "authenticated";
grant execute on function public.agency_can_manage_any(public.agency_permission, uuid, uuid) to "authenticated";

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — courses
-- ─────────────────────────────────────────────────────────────────────────

create policy "Agency editors can view their agency courses"
  on "public"."courses" as permissive for select to authenticated
  using (public.is_agency_content_editor(agency_id, 'courses.manage_own'));

create policy "Agency editors can create agency courses"
  on "public"."courses" as permissive for insert to authenticated
  with check (public.is_agency_content_editor(agency_id, 'courses.manage_own'));

create policy "Agency editors can update their agency courses"
  on "public"."courses" as permissive for update to authenticated
  using (public.is_agency_content_editor(agency_id, 'courses.manage_own'))
  with check (public.is_agency_content_editor(agency_id, 'courses.manage_own'));

create policy "Agency editors can delete their agency courses"
  on "public"."courses" as permissive for delete to authenticated
  using (public.is_agency_content_editor(agency_id, 'courses.manage_own'));

create policy "Agencies with manage_any can update any course"
  on "public"."courses" as permissive for update to authenticated
  using (public.agency_can_manage_any('courses.manage_any', id))
  with check (public.agency_can_manage_any('courses.manage_any', id));

create policy "Agencies with manage_any can delete any course"
  on "public"."courses" as permissive for delete to authenticated
  using (public.agency_can_manage_any('courses.manage_any', id));

-- Anti-hijack: nobody may write a row carrying an agency_id they don't hold
-- manage_own for (super admins excepted). RESTRICTIVE — ANDed with the
-- permissive policies above and the pre-existing owner/school ones.
create policy "Agency attribution requires the agency grant (insert)"
  on "public"."courses" as restrictive for insert to authenticated
  with check (
    agency_id is null
    or public.is_admin()
    or public.is_agency_content_editor(agency_id, 'courses.manage_own')
  );

create policy "Agency attribution requires the agency grant (update)"
  on "public"."courses" as restrictive for update to authenticated
  with check (
    agency_id is null
    or public.is_admin()
    or public.is_agency_content_editor(agency_id, 'courses.manage_own')
    or public.agency_can_manage_any('courses.manage_any', id)
  );

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — decks
-- ─────────────────────────────────────────────────────────────────────────

create policy "Agency editors can view their agency decks"
  on "public"."decks" as permissive for select to authenticated
  using (public.is_agency_content_editor(agency_id, 'decks.manage_own'));

create policy "Agency editors can create agency decks"
  on "public"."decks" as permissive for insert to authenticated
  with check (public.is_agency_content_editor(agency_id, 'decks.manage_own'));

create policy "Agency editors can update their agency decks"
  on "public"."decks" as permissive for update to authenticated
  using (public.is_agency_content_editor(agency_id, 'decks.manage_own'))
  with check (public.is_agency_content_editor(agency_id, 'decks.manage_own'));

create policy "Agency editors can delete their agency decks"
  on "public"."decks" as permissive for delete to authenticated
  using (public.is_agency_content_editor(agency_id, 'decks.manage_own'));

create policy "Agencies with manage_any can update any deck"
  on "public"."decks" as permissive for update to authenticated
  using (public.agency_can_manage_any('decks.manage_any', id))
  with check (public.agency_can_manage_any('decks.manage_any', id));

create policy "Agencies with manage_any can delete any deck"
  on "public"."decks" as permissive for delete to authenticated
  using (public.agency_can_manage_any('decks.manage_any', id));

create policy "Agency attribution requires the agency grant (insert)"
  on "public"."decks" as restrictive for insert to authenticated
  with check (
    agency_id is null
    or public.is_admin()
    or public.is_agency_content_editor(agency_id, 'decks.manage_own')
  );

create policy "Agency attribution requires the agency grant (update)"
  on "public"."decks" as restrictive for update to authenticated
  with check (
    agency_id is null
    or public.is_admin()
    or public.is_agency_content_editor(agency_id, 'decks.manage_own')
    or public.agency_can_manage_any('decks.manage_any', id)
  );

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — quizzes
-- ─────────────────────────────────────────────────────────────────────────

create policy "Agency editors can view their agency quizzes"
  on "public"."quizzes" as permissive for select to authenticated
  using (public.is_agency_content_editor(agency_id, 'quizzes.manage_own'));

create policy "Agency editors can create agency quizzes"
  on "public"."quizzes" as permissive for insert to authenticated
  with check (public.is_agency_content_editor(agency_id, 'quizzes.manage_own'));

create policy "Agency editors can update their agency quizzes"
  on "public"."quizzes" as permissive for update to authenticated
  using (public.is_agency_content_editor(agency_id, 'quizzes.manage_own'))
  with check (public.is_agency_content_editor(agency_id, 'quizzes.manage_own'));

create policy "Agency editors can delete their agency quizzes"
  on "public"."quizzes" as permissive for delete to authenticated
  using (public.is_agency_content_editor(agency_id, 'quizzes.manage_own'));

create policy "Agencies with manage_any can update any quiz"
  on "public"."quizzes" as permissive for update to authenticated
  using (public.agency_can_manage_any('quizzes.manage_any', id))
  with check (public.agency_can_manage_any('quizzes.manage_any', id));

create policy "Agencies with manage_any can delete any quiz"
  on "public"."quizzes" as permissive for delete to authenticated
  using (public.agency_can_manage_any('quizzes.manage_any', id));

create policy "Agency attribution requires the agency grant (insert)"
  on "public"."quizzes" as restrictive for insert to authenticated
  with check (
    agency_id is null
    or public.is_admin()
    or public.is_agency_content_editor(agency_id, 'quizzes.manage_own')
  );

create policy "Agency attribution requires the agency grant (update)"
  on "public"."quizzes" as restrictive for update to authenticated
  with check (
    agency_id is null
    or public.is_admin()
    or public.is_agency_content_editor(agency_id, 'quizzes.manage_own')
    or public.agency_can_manage_any('quizzes.manage_any', id)
  );

-- ─────────────────────────────────────────────────────────────────────────
-- purchases — agency members can see their agency's sales
-- ─────────────────────────────────────────────────────────────────────────

drop policy "Buyer, seller, and admin can view purchases" on "public"."purchases";

create policy "Buyer, seller, and admin can view purchases"
  on "public"."purchases" as permissive for select to authenticated
  using (
    public.is_owner(buyer_id)
    or public.is_owner(seller_profile_id)
    -- is_school_member (not is_school_editor) deliberately: see the credits
    -- migration for why the editor variant would leak non-school sales.
    or public.is_school_member(seller_school_id)
    or public.is_agency_member(seller_agency_id)
    or public.is_admin()
  );

-- ─────────────────────────────────────────────────────────────────────────
-- purchase_item — agency attribution wins over school, school over profile.
-- Replaces the discount-aware 4-arg version (20260711090000_discounts.sql);
-- the only changes are the agency_id reads, the attribution branch, and
-- seller_agency_id. The stale pre-discounts 3-arg overload is dropped so
-- unqualified calls stay unambiguous.
-- ─────────────────────────────────────────────────────────────────────────

drop function if exists public.purchase_item(public.purchase_item_type, uuid, smallint);

create or replace function public.purchase_item(
  p_item_type public.purchase_item_type,
  p_item_id uuid,
  p_daily_limit smallint default null,
  p_discount_code text default null
)
returns public.purchases
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_buyer_id uuid := auth.uid();
  v_is_free boolean;
  v_price integer;
  v_owner_id uuid;
  v_school_id uuid;
  v_agency_id uuid;
  v_owner_role public.user_role;
  v_seller_type public.seller_type;
  v_seller_profile_id uuid;
  v_seller_school_id uuid;
  v_seller_agency_id uuid;
  v_discount_id uuid;
  v_final_price integer;
  v_txn public.credit_transactions;
  v_purchase public.purchases;
begin
  if v_buyer_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_item_type = 'course' then
    select is_free, price_credits, instructor_id, school_id, agency_id
      into v_is_free, v_price, v_owner_id, v_school_id, v_agency_id
      from public.courses where id = p_item_id;
    if not found then
      raise exception 'Course not found: %', p_item_id;
    end if;
    if exists (select 1 from public.enrollments where course_id = p_item_id and user_id = v_buyer_id) then
      raise exception 'already_purchased';
    end if;

  elsif p_item_type = 'deck' then
    select is_free, price_credits, user_id, school_id, agency_id
      into v_is_free, v_price, v_owner_id, v_school_id, v_agency_id
      from public.decks where id = p_item_id;
    if not found then
      raise exception 'Deck not found: %', p_item_id;
    end if;
    if exists (select 1 from public.enrollments where deck_id = p_item_id and user_id = v_buyer_id) then
      raise exception 'already_purchased';
    end if;

  elsif p_item_type = 'quiz' then
    select is_free, price_credits, user_id, school_id, agency_id
      into v_is_free, v_price, v_owner_id, v_school_id, v_agency_id
      from public.quizzes where id = p_item_id;
    if not found then
      raise exception 'Quiz not found: %', p_item_id;
    end if;
    if not public.quiz_registration_open(p_item_id) then
      raise exception 'registration_closed';
    end if;
    if exists (select 1 from public.quiz_registrations where quiz_id = p_item_id and student_id = v_buyer_id) then
      raise exception 'already_purchased';
    end if;

  else
    raise exception 'Unsupported item type: %', p_item_type;
  end if;

  -- Seller attribution: agency-owned wins, then school-owned, then the
  -- owning profile's own role.
  if v_agency_id is not null then
    v_seller_type := 'agency';
    v_seller_agency_id := v_agency_id;
  elsif v_school_id is not null then
    v_seller_type := 'school';
    v_seller_school_id := v_school_id;
  else
    select role into v_owner_role from public.profiles where id = v_owner_id;
    v_seller_profile_id := v_owner_id;
    if v_owner_role = 'admin'::public.user_role then
      v_seller_type := 'platform';
    elsif v_owner_role = 'student'::public.user_role then
      v_seller_type := 'student';
    else
      v_seller_type := 'instructor';
    end if;
  end if;

  v_final_price := coalesce(v_price, 0);

  if not v_is_free then
    select discount_id, price into v_discount_id, v_final_price
      from public.compute_discounted_price(p_discount_code, p_item_type, p_item_id, coalesce(v_price, 0));
  end if;

  if not v_is_free and v_final_price > 0 then
    v_txn := public.record_credit_transaction(
      p_profile_id => v_buyer_id,
      p_amount => -v_final_price,
      p_type => 'purchase'::public.credit_transaction_type,
      p_reference_type => 'purchase'
    );
  end if;

  insert into public.purchases (
    buyer_id, item_type, item_id, seller_type, seller_profile_id, seller_school_id,
    seller_agency_id, price_credits, credit_transaction_id, discount_id, original_price_credits
  ) values (
    v_buyer_id, p_item_type, p_item_id, v_seller_type, v_seller_profile_id, v_seller_school_id,
    v_seller_agency_id,
    case when v_is_free then 0 else v_final_price end,
    v_txn.id,
    v_discount_id,
    case when v_discount_id is not null and v_final_price <> coalesce(v_price, 0) then v_price else null end
  ) returning * into v_purchase;

  if v_txn.id is not null then
    update public.credit_transactions set reference_id = v_purchase.id where id = v_txn.id;
  end if;

  if p_item_type = 'course' then
    insert into public.enrollments (user_id, course_id) values (v_buyer_id, p_item_id);
  elsif p_item_type = 'deck' then
    insert into public.enrollments (user_id, deck_id, flashcard_daily_limit)
      values (v_buyer_id, p_item_id, coalesce(p_daily_limit, 20));
  elsif p_item_type = 'quiz' then
    insert into public.quiz_registrations (quiz_id, student_id, source, registered_by)
      values (p_item_id, v_buyer_id, 'self', v_buyer_id);
  end if;

  return v_purchase;
end;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- get_agency_overview — add content sales stats
-- ─────────────────────────────────────────────────────────────────────────

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
    'open_disputes', (select count(*) from public.agency_disputes where agency_id = p_agency_id and status = 'open'),
    'sales_count', (select count(*) from public.purchases where seller_agency_id = p_agency_id),
    'sales_total', coalesce((select sum(price_credits) from public.purchases where seller_agency_id = p_agency_id), 0)
  ) into v_result
  from public.agency_topups t
  where t.agency_id = p_agency_id;

  return v_result;
end;
$function$;
