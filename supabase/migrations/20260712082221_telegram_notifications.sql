-- Telegram delivery for the notifications system: lets a user link their
-- Telegram account (via a one-time /start <token> deep link) so the
-- notifications cron can also push a Telegram message for each row.

alter table "public"."profiles"
  add column "telegram_chat_id" bigint,
  add column "telegram_linked_at" timestamptz;

alter table "public"."notifications"
  add column "telegram_delivered_at" timestamptz;

create table "public"."telegram_link_tokens" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null references "public"."profiles"("id") on delete cascade,
  "token" text not null,
  "expires_at" timestamptz not null,
  "used_at" timestamptz,
  "created_at" timestamptz not null default now()
);

alter table "public"."telegram_link_tokens" enable row level security;

CREATE UNIQUE INDEX telegram_link_tokens_pkey ON public.telegram_link_tokens USING btree (id);
CREATE UNIQUE INDEX telegram_link_tokens_token_key ON public.telegram_link_tokens USING btree (token);
CREATE INDEX telegram_link_tokens_user_id_idx ON public.telegram_link_tokens USING btree (user_id);

alter table "public"."telegram_link_tokens" add constraint "telegram_link_tokens_pkey" PRIMARY KEY using index "telegram_link_tokens_pkey";
alter table "public"."telegram_link_tokens" add constraint "telegram_link_tokens_token_key" UNIQUE using index "telegram_link_tokens_token_key";

create policy "Users can create their own telegram link tokens"
  on "public"."telegram_link_tokens"
  as permissive
  for insert
  to authenticated
  with check (public.is_owner(user_id));

create policy "Users can view their own telegram link tokens"
  on "public"."telegram_link_tokens"
  as permissive
  for select
  to authenticated
  using (public.is_owner(user_id));

grant delete on table "public"."telegram_link_tokens" to "authenticated";
grant insert on table "public"."telegram_link_tokens" to "authenticated";
grant references on table "public"."telegram_link_tokens" to "authenticated";
grant select on table "public"."telegram_link_tokens" to "authenticated";
grant trigger on table "public"."telegram_link_tokens" to "authenticated";
grant truncate on table "public"."telegram_link_tokens" to "authenticated";
grant update on table "public"."telegram_link_tokens" to "authenticated";

grant delete on table "public"."telegram_link_tokens" to "service_role";
grant insert on table "public"."telegram_link_tokens" to "service_role";
grant references on table "public"."telegram_link_tokens" to "service_role";
grant select on table "public"."telegram_link_tokens" to "service_role";
grant trigger on table "public"."telegram_link_tokens" to "service_role";
grant truncate on table "public"."telegram_link_tokens" to "service_role";
grant update on table "public"."telegram_link_tokens" to "service_role";
