-- Discounts: coupon codes an item's owner (or, for platform-wide codes, an
-- admin) can create, scoped to a single item, a curated group of items
-- (mixed course/deck/quiz), or the whole platform. Redemption is entirely
-- code-driven — nothing applies automatically — so a buyer must type a code
-- at purchase time; see `purchase_item`'s new `p_discount_code` argument.

create type "public"."discount_type" as enum ('percentage', 'fixed');
create type "public"."discount_scope" as enum ('item', 'group', 'all');

-- ─────────────────────────────────────────────────────────────────────────
-- discounts / discount_targets
-- ─────────────────────────────────────────────────────────────────────────

create table "public"."discounts" (
  "id" uuid not null default gen_random_uuid(),
  "code" text not null,
  "type" public.discount_type not null,
  "value" numeric(10,2) not null,
  "scope" public.discount_scope not null,
  "owner_type" public.seller_type not null,
  "owner_profile_id" uuid references public.profiles(id) on delete cascade,
  "owner_school_id" uuid references public.schools(id) on delete cascade,
  "is_active" boolean not null default true,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

alter table "public"."discounts" enable row level security;

create unique index "discounts_pkey" on "public"."discounts" using btree ("id");
alter table "public"."discounts" add constraint "discounts_pkey" primary key using index "discounts_pkey";

create unique index "discounts_code_upper_idx" on "public"."discounts" using btree (upper(code));
alter table "public"."discounts" add constraint "discounts_value_positive_check" check (value > 0);
alter table "public"."discounts" add constraint "discounts_percentage_range_check" check (type <> 'percentage'::public.discount_type or value <= 100);

create index "discounts_owner_profile_idx" on "public"."discounts" using btree ("owner_profile_id");
create index "discounts_owner_school_idx" on "public"."discounts" using btree ("owner_school_id");

grant select on table "public"."discounts" to "authenticated";
grant delete, insert, references, select, trigger, truncate, update on table "public"."discounts" to "service_role";

create policy "Owner, school member, and admin can view discounts"
  on "public"."discounts"
  as permissive
  for select
  to authenticated
  using (public.is_owner(owner_profile_id) or public.is_school_member(owner_school_id) or public.is_admin());

create table "public"."discount_targets" (
  "id" uuid not null default gen_random_uuid(),
  "discount_id" uuid not null references public.discounts(id) on delete cascade,
  "item_type" public.purchase_item_type not null,
  "item_id" uuid not null
);

alter table "public"."discount_targets" enable row level security;

create unique index "discount_targets_pkey" on "public"."discount_targets" using btree ("id");
alter table "public"."discount_targets" add constraint "discount_targets_pkey" primary key using index "discount_targets_pkey";

create unique index "discount_targets_unique" on "public"."discount_targets" using btree ("discount_id", "item_type", "item_id");
create index "discount_targets_item_idx" on "public"."discount_targets" using btree ("item_type", "item_id");

grant select on table "public"."discount_targets" to "authenticated";
grant delete, insert, references, select, trigger, truncate, update on table "public"."discount_targets" to "service_role";

create policy "Owner, school member, and admin can view discount targets"
  on "public"."discount_targets"
  as permissive
  for select
  to authenticated
  using (
    exists (
      select 1 from public.discounts d
      where d.id = discount_targets.discount_id
        and (public.is_owner(d.owner_profile_id) or public.is_school_member(d.owner_school_id) or public.is_admin())
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- purchases gains discount attribution
-- ─────────────────────────────────────────────────────────────────────────

alter table "public"."purchases" add column "discount_id" uuid references public.discounts(id) on delete set null;
alter table "public"."purchases" add column "original_price_credits" integer;

-- ─────────────────────────────────────────────────────────────────────────
-- Functions
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.compute_discounted_price(
  p_code text,
  p_item_type public.purchase_item_type,
  p_item_id uuid,
  p_base_price integer
)
returns table(discount_id uuid, price integer)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_discount public.discounts;
  v_price integer;
begin
  if p_code is null or trim(p_code) = '' or p_base_price <= 0 then
    return query select null::uuid, p_base_price;
    return;
  end if;

  select * into v_discount
  from public.discounts d
  where upper(d.code) = upper(trim(p_code))
    and d.is_active
    and (d.starts_at is null or d.starts_at <= now())
    and (d.ends_at is null or d.ends_at >= now());

  if not found then
    raise exception 'invalid_discount_code';
  end if;

  if v_discount.scope <> 'all' then
    if not exists (
      select 1 from public.discount_targets t
      where t.discount_id = v_discount.id
        and t.item_type = p_item_type
        and t.item_id = p_item_id
    ) then
      raise exception 'discount_not_applicable';
    end if;
  end if;

  if v_discount.type = 'percentage' then
    v_price := round(p_base_price * (1 - v_discount.value / 100.0));
  else
    v_price := p_base_price - round(v_discount.value);
  end if;

  v_price := greatest(v_price, 0);

  return query select v_discount.id, v_price;
end;
$function$;

create or replace function public.validate_discount_code(
  p_code text,
  p_item_type public.purchase_item_type,
  p_item_id uuid
)
returns table(discounted_price integer, original_price integer)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_is_free boolean;
  v_base_price integer;
  v_result record;
begin
  if p_item_type = 'course' then
    select is_free, price_credits into v_is_free, v_base_price from public.courses where id = p_item_id;
  elsif p_item_type = 'deck' then
    select is_free, price_credits into v_is_free, v_base_price from public.decks where id = p_item_id;
  elsif p_item_type = 'quiz' then
    select is_free, price_credits into v_is_free, v_base_price from public.quizzes where id = p_item_id;
  else
    raise exception 'Unsupported item type: %', p_item_type;
  end if;

  if not found then
    raise exception 'Item not found: %', p_item_id;
  end if;

  if v_is_free then
    return query select 0, 0;
    return;
  end if;

  select * into v_result from public.compute_discounted_price(p_code, p_item_type, p_item_id, v_base_price);
  return query select v_result.price, v_base_price;
end;
$function$;

create or replace function public.can_manage_discount(
  p_discount_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
set search_path to 'public'
as $function$
declare
  v_discount public.discounts;
begin
  select * into v_discount from public.discounts where id = p_discount_id;
  if not found then
    return false;
  end if;
  if public.is_admin(p_user_id) then
    return true;
  end if;
  if v_discount.owner_profile_id is not null and v_discount.owner_profile_id = p_user_id then
    return true;
  end if;
  if v_discount.owner_school_id is not null and public.is_school_editor(v_discount.owner_school_id, p_user_id) then
    return true;
  end if;
  return false;
end;
$function$;

create or replace function public.create_discount(
  p_code text,
  p_type public.discount_type,
  p_value numeric,
  p_scope public.discount_scope,
  p_targets jsonb default '[]'::jsonb,
  p_school_id uuid default null,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null
)
returns public.discounts
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner_type public.seller_type;
  v_discount public.discounts;
  v_target jsonb;
  v_item_type public.purchase_item_type;
  v_item_id uuid;
  v_target_count integer := 0;
  v_owns boolean;
begin
  if p_code is null or trim(p_code) = '' then
    raise exception 'A discount code is required';
  end if;
  if p_value is null or p_value <= 0 then
    raise exception 'Discount value must be positive';
  end if;
  if p_type = 'percentage' and p_value > 100 then
    raise exception 'Percentage discounts must be between 0 and 100';
  end if;

  if p_scope = 'all' then
    if not public.is_admin() then
      raise exception 'Only admins can create platform-wide discounts';
    end if;
    v_owner_type := 'platform';
  elsif p_school_id is not null then
    if not public.is_school_editor(p_school_id) then
      raise exception 'Not authorized to create discounts for this school';
    end if;
    v_owner_type := 'school';
  else
    select (case when role = 'student'::public.user_role then 'student' else 'instructor' end)::public.seller_type
      into v_owner_type
      from public.profiles where id = auth.uid();
    if v_owner_type is null then
      raise exception 'Not authenticated';
    end if;
  end if;

  insert into public.discounts (
    code, type, value, scope, owner_type, owner_profile_id, owner_school_id, starts_at, ends_at
  ) values (
    p_code, p_type, p_value, p_scope, v_owner_type,
    case when p_scope <> 'all' and p_school_id is null then auth.uid() else null end,
    case when p_scope <> 'all' then p_school_id else null end,
    p_starts_at, p_ends_at
  ) returning * into v_discount;

  if p_scope in ('item', 'group') then
    for v_target in select * from jsonb_array_elements(p_targets)
    loop
      v_item_type := (v_target->>'item_type')::public.purchase_item_type;
      v_item_id := (v_target->>'item_id')::uuid;

      if v_item_type = 'course' then
        v_owns := exists (
          select 1 from public.courses c
          where c.id = v_item_id and public.can_manage_course(c.id, p_school_id)
        );
      elsif v_item_type = 'deck' then
        v_owns := exists (
          select 1 from public.decks d
          where d.id = v_item_id and (public.is_owner(d.user_id) or public.is_school_editor(d.school_id))
        );
      elsif v_item_type = 'quiz' then
        v_owns := exists (
          select 1 from public.quizzes q
          where q.id = v_item_id and public.can_manage_quiz(q.id)
        );
      else
        v_owns := false;
      end if;

      if not v_owns then
        raise exception 'You do not have permission to discount item %', v_item_id;
      end if;

      insert into public.discount_targets (discount_id, item_type, item_id)
        values (v_discount.id, v_item_type, v_item_id)
      on conflict do nothing;
      v_target_count := v_target_count + 1;
    end loop;

    if v_target_count = 0 then
      raise exception 'At least one item must be selected';
    end if;
    if p_scope = 'item' and v_target_count <> 1 then
      raise exception 'A single-item discount must target exactly one item';
    end if;
  end if;

  return v_discount;
end;
$function$;

create or replace function public.update_discount(
  p_discount_id uuid,
  p_code text,
  p_value numeric,
  p_is_active boolean,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null
)
returns public.discounts
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_discount public.discounts;
begin
  if not public.can_manage_discount(p_discount_id) then
    raise exception 'Not authorized to edit this discount';
  end if;

  if p_code is null or trim(p_code) = '' then
    raise exception 'A discount code is required';
  end if;
  if p_value is null or p_value <= 0 then
    raise exception 'Discount value must be positive';
  end if;

  update public.discounts set
    code = p_code,
    value = p_value,
    is_active = p_is_active,
    starts_at = p_starts_at,
    ends_at = p_ends_at,
    updated_at = now()
  where id = p_discount_id
  returning * into v_discount;

  return v_discount;
end;
$function$;

create or replace function public.delete_discount(p_discount_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.can_manage_discount(p_discount_id) then
    raise exception 'Not authorized to delete this discount';
  end if;
  delete from public.discounts where id = p_discount_id;
end;
$function$;

grant execute on function public.compute_discounted_price(text, public.purchase_item_type, uuid, integer) to "authenticated";
grant execute on function public.validate_discount_code(text, public.purchase_item_type, uuid) to "authenticated";
grant execute on function public.create_discount(text, public.discount_type, numeric, public.discount_scope, jsonb, uuid, timestamptz, timestamptz) to "authenticated";
grant execute on function public.update_discount(uuid, text, numeric, boolean, timestamptz, timestamptz) to "authenticated";
grant execute on function public.delete_discount(uuid) to "authenticated";

-- ─────────────────────────────────────────────────────────────────────────
-- purchase_item: add discount-code redemption. Signature changes (a new
-- trailing default param), so the old overload must be dropped explicitly —
-- `create or replace` alone would just add a second overload instead of
-- replacing this one.
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
  v_owner_role public.user_role;
  v_seller_type public.seller_type;
  v_seller_profile_id uuid;
  v_seller_school_id uuid;
  v_discount_id uuid;
  v_final_price integer;
  v_txn public.credit_transactions;
  v_purchase public.purchases;
begin
  if v_buyer_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_item_type = 'course' then
    select is_free, price_credits, instructor_id, school_id
      into v_is_free, v_price, v_owner_id, v_school_id
      from public.courses where id = p_item_id;
    if not found then
      raise exception 'Course not found: %', p_item_id;
    end if;
    if exists (select 1 from public.enrollments where course_id = p_item_id and user_id = v_buyer_id) then
      raise exception 'already_purchased';
    end if;

  elsif p_item_type = 'deck' then
    select is_free, price_credits, user_id, school_id
      into v_is_free, v_price, v_owner_id, v_school_id
      from public.decks where id = p_item_id;
    if not found then
      raise exception 'Deck not found: %', p_item_id;
    end if;
    if exists (select 1 from public.enrollments where deck_id = p_item_id and user_id = v_buyer_id) then
      raise exception 'already_purchased';
    end if;

  elsif p_item_type = 'quiz' then
    select is_free, price_credits, user_id, school_id
      into v_is_free, v_price, v_owner_id, v_school_id
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

  -- Seller attribution: school-owned items win regardless of a creating
  -- user_id; otherwise attribute to the owning profile's own role.
  if v_school_id is not null then
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
    price_credits, credit_transaction_id, discount_id, original_price_credits
  ) values (
    v_buyer_id, p_item_type, p_item_id, v_seller_type, v_seller_profile_id, v_seller_school_id,
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

grant execute on function public.purchase_item(public.purchase_item_type, uuid, smallint, text) to "authenticated";
