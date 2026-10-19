-- Credit-based purchasing: students top up an account balance (1 credit = 1 AFN)
-- in cash at a physical office; the balance then buys courses, decks, and quiz
-- registrations. Instructors, schools, students (decks only), and the platform
-- itself can list priced items. See `purchase_item`/`admin_topup_credits` below
-- for the only two write paths into the credit ledger.

create type "public"."credit_transaction_type" as enum ('topup', 'purchase', 'refund', 'adjustment');
create type "public"."purchase_item_type" as enum ('course', 'deck', 'quiz');
create type "public"."seller_type" as enum ('platform', 'instructor', 'school', 'student');

-- ─────────────────────────────────────────────────────────────────────────
-- Columns
-- ─────────────────────────────────────────────────────────────────────────

alter table "public"."profiles" add column "credit_balance" integer not null default 0;
alter table "public"."profiles" add constraint "profiles_credit_balance_check" check (credit_balance >= 0);

-- Users can otherwise update their own profile row (see "Allow users to update
-- their own profile"), which has no column restriction — without this, any
-- authenticated user could set their own credit_balance via a raw table
-- update. Writes only happen through record_credit_transaction() below, whose
-- SECURITY DEFINER owner is unaffected by this revoke.
--
-- A plain `revoke update (credit_balance) ... from authenticated` does NOT
-- work here: "authenticated" already holds an unqualified table-level UPDATE
-- grant (from 20260630152325_added_rls_for_courses_related_table.sql), and
-- Postgres column-privilege revokes cannot subtract from a broader
-- table-level grant that has no column list. The only way to actually block
-- one column is to revoke the table-level grant and re-grant UPDATE on an
-- explicit column list that excludes it.
revoke update on table "public"."profiles" from "authenticated";
grant update (
  id, email, full_name, avatar_url, bio, website_url, phone,
  province_id, school_id, active_school_id, instructor_status,
  locale, slug, role, created_at, updated_at
) on table "public"."profiles" to "authenticated";

alter table "public"."courses" add column "price_credits" integer not null default 0;
alter table "public"."courses" add constraint "courses_price_credits_check" check (price_credits >= 0);

alter table "public"."decks" add column "price_credits" integer not null default 0;
alter table "public"."decks" add constraint "decks_price_credits_check" check (price_credits >= 0);
alter table "public"."decks" add column "school_id" uuid references public.schools(id) on delete set null;

alter table "public"."quizzes" add column "is_free" boolean not null default true;
alter table "public"."quizzes" add column "price_credits" integer not null default 0;
alter table "public"."quizzes" add constraint "quizzes_price_credits_check" check (price_credits >= 0);

create index "decks_school_id_idx" on "public"."decks" using btree ("school_id");

-- ─────────────────────────────────────────────────────────────────────────
-- credit_transactions — append-only ledger; profiles.credit_balance is a
-- materialized cache maintained exclusively by record_credit_transaction().
-- ─────────────────────────────────────────────────────────────────────────

create table "public"."credit_transactions" (
  "id" uuid not null default gen_random_uuid(),
  "profile_id" uuid not null references public.profiles(id) on delete cascade,
  "amount" integer not null,
  "type" public.credit_transaction_type not null,
  "reference_type" text,
  "reference_id" uuid,
  "balance_after" integer not null,
  "note" text,
  "created_by" uuid references public.profiles(id) on delete set null,
  "created_at" timestamptz not null default now()
);

alter table "public"."credit_transactions" enable row level security;

create unique index "credit_transactions_pkey" on "public"."credit_transactions" using btree ("id");
alter table "public"."credit_transactions" add constraint "credit_transactions_pkey" primary key using index "credit_transactions_pkey";

create index "credit_transactions_profile_id_idx" on "public"."credit_transactions" using btree ("profile_id", "created_at" desc);

grant select on table "public"."credit_transactions" to "authenticated";
grant delete, insert, references, select, trigger, truncate, update on table "public"."credit_transactions" to "service_role";

create policy "Owner and admin can view credit transactions"
  on "public"."credit_transactions"
  as permissive
  for select
  to authenticated
  using (public.is_owner(profile_id) or public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- purchases — one row per completed sale; seller attribution is snapshotted
-- at purchase time so later ownership changes don't rewrite earnings history.
-- ─────────────────────────────────────────────────────────────────────────

create table "public"."purchases" (
  "id" uuid not null default gen_random_uuid(),
  "buyer_id" uuid not null references public.profiles(id) on delete cascade,
  "item_type" public.purchase_item_type not null,
  "item_id" uuid not null,
  "seller_type" public.seller_type not null,
  "seller_profile_id" uuid references public.profiles(id) on delete set null,
  "seller_school_id" uuid references public.schools(id) on delete set null,
  "price_credits" integer not null,
  "credit_transaction_id" uuid references public.credit_transactions(id) on delete set null,
  "created_at" timestamptz not null default now()
);

alter table "public"."purchases" enable row level security;

create unique index "purchases_pkey" on "public"."purchases" using btree ("id");
alter table "public"."purchases" add constraint "purchases_pkey" primary key using index "purchases_pkey";

alter table "public"."purchases" add constraint "purchases_price_credits_check" check (price_credits >= 0);

create unique index "purchases_buyer_item_unique" on "public"."purchases" using btree ("buyer_id", "item_type", "item_id");
create index "purchases_seller_profile_idx" on "public"."purchases" using btree ("seller_profile_id", "created_at" desc);
create index "purchases_seller_school_idx" on "public"."purchases" using btree ("seller_school_id", "created_at" desc);

grant select on table "public"."purchases" to "authenticated";
grant delete, insert, references, select, trigger, truncate, update on table "public"."purchases" to "service_role";

create policy "Buyer, seller, and admin can view purchases"
  on "public"."purchases"
  as permissive
  for select
  to authenticated
  using (
    public.is_owner(buyer_id)
    or public.is_owner(seller_profile_id)
    -- is_school_member (not is_school_editor) deliberately: is_school_editor
    -- falls back to the viewer's own active_school_id when its argument is
    -- null, which would leak non-school sales (seller_school_id is null) to
    -- any school editor. is_school_member has no such fallback.
    or public.is_school_member(seller_school_id)
    or public.is_admin()
  );

-- ─────────────────────────────────────────────────────────────────────────
-- Functions
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.record_credit_transaction(
  p_profile_id uuid,
  p_amount integer,
  p_type public.credit_transaction_type,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_note text default null,
  p_created_by uuid default null
)
returns public.credit_transactions
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_current_balance integer;
  v_new_balance integer;
  v_txn public.credit_transactions;
begin
  select credit_balance into v_current_balance
  from public.profiles
  where id = p_profile_id
  for update;

  if not found then
    raise exception 'Profile not found: %', p_profile_id;
  end if;

  v_new_balance := v_current_balance + p_amount;

  if v_new_balance < 0 then
    raise exception 'insufficient_credits';
  end if;

  insert into public.credit_transactions (
    profile_id, amount, type, reference_type, reference_id, balance_after, note, created_by
  ) values (
    p_profile_id, p_amount, p_type, p_reference_type, p_reference_id, v_new_balance, p_note, p_created_by
  ) returning * into v_txn;

  update public.profiles set credit_balance = v_new_balance where id = p_profile_id;

  return v_txn;
end;
$function$;

create or replace function public.admin_topup_credits(
  p_user_id uuid,
  p_amount integer,
  p_note text default null
)
returns public.credit_transactions
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_admin() then
    raise exception 'Only admins can top up credits';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Top-up amount must be positive';
  end if;

  return public.record_credit_transaction(
    p_profile_id => p_user_id,
    p_amount => p_amount,
    p_type => 'topup'::public.credit_transaction_type,
    p_note => p_note,
    p_created_by => auth.uid()
  );
end;
$function$;

create or replace function public.purchase_item(
  p_item_type public.purchase_item_type,
  p_item_id uuid,
  p_daily_limit smallint default null
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

  if not v_is_free and coalesce(v_price, 0) > 0 then
    v_txn := public.record_credit_transaction(
      p_profile_id => v_buyer_id,
      p_amount => -v_price,
      p_type => 'purchase'::public.credit_transaction_type,
      p_reference_type => 'purchase'
    );
  end if;

  insert into public.purchases (
    buyer_id, item_type, item_id, seller_type, seller_profile_id, seller_school_id,
    price_credits, credit_transaction_id
  ) values (
    v_buyer_id, p_item_type, p_item_id, v_seller_type, v_seller_profile_id, v_seller_school_id,
    case when v_is_free then 0 else coalesce(v_price, 0) end,
    v_txn.id
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

grant execute on function public.record_credit_transaction(uuid, integer, public.credit_transaction_type, text, uuid, text, uuid) to "service_role";
grant execute on function public.admin_topup_credits(uuid, integer, text) to "authenticated";
grant execute on function public.purchase_item(public.purchase_item_type, uuid, smallint) to "authenticated";

-- ─────────────────────────────────────────────────────────────────────────
-- decks RLS: extend owner-only policies to also allow school editors, now
-- that a deck can be school-owned (school_id). Mirrors the equivalent
-- courses policies (see 20260702151515_review_db_rls.sql).
-- ─────────────────────────────────────────────────────────────────────────

drop policy "Users can create their own decks" on "public"."decks";
drop policy "Users can update their own decks" on "public"."decks";
drop policy "Users can delete their own decks" on "public"."decks";
drop policy "Users can view their own decks" on "public"."decks";

create policy "Users and school editors can create decks"
  on "public"."decks"
  as permissive
  for insert
  to authenticated
  with check (public.is_owner(user_id) or public.is_school_editor(school_id));

create policy "Users and school editors can update decks"
  on "public"."decks"
  as permissive
  for update
  to authenticated
  using (public.is_owner(user_id) or public.is_school_editor(school_id))
  with check (public.is_owner(user_id) or public.is_school_editor(school_id));

create policy "Users and school editors can delete decks"
  on "public"."decks"
  as permissive
  for delete
  to authenticated
  using (public.is_owner(user_id) or public.is_school_editor(school_id));

create policy "Users and school members can view decks"
  on "public"."decks"
  as permissive
  for select
  to authenticated
  using (public.is_owner(user_id) or public.is_school_member(school_id));
