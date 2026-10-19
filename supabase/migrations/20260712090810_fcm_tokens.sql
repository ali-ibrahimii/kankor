-- Web push (FCM) delivery for the notifications system: a user's browser
-- registers one row per device/browser it wants pushes on.

alter table "public"."notifications"
  add column "push_delivered_at" timestamptz;

create table "public"."fcm_tokens" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null references "public"."profiles"("id") on delete cascade,
  "token" text not null,
  "user_agent" text,
  "created_at" timestamptz not null default now(),
  "last_seen_at" timestamptz not null default now()
);

alter table "public"."fcm_tokens" enable row level security;

CREATE UNIQUE INDEX fcm_tokens_pkey ON public.fcm_tokens USING btree (id);
CREATE UNIQUE INDEX fcm_tokens_token_key ON public.fcm_tokens USING btree (token);
CREATE INDEX fcm_tokens_user_id_idx ON public.fcm_tokens USING btree (user_id);

alter table "public"."fcm_tokens" add constraint "fcm_tokens_pkey" PRIMARY KEY using index "fcm_tokens_pkey";
alter table "public"."fcm_tokens" add constraint "fcm_tokens_token_key" UNIQUE using index "fcm_tokens_token_key";

create policy "Users can register their own fcm tokens"
  on "public"."fcm_tokens"
  as permissive
  for insert
  to authenticated
  with check (public.is_owner(user_id));

create policy "Users can view their own fcm tokens"
  on "public"."fcm_tokens"
  as permissive
  for select
  to authenticated
  using (public.is_owner(user_id));

create policy "Users can update their own fcm tokens"
  on "public"."fcm_tokens"
  as permissive
  for update
  to authenticated
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

create policy "Users can delete their own fcm tokens"
  on "public"."fcm_tokens"
  as permissive
  for delete
  to authenticated
  using (public.is_owner(user_id));

grant delete on table "public"."fcm_tokens" to "authenticated";
grant insert on table "public"."fcm_tokens" to "authenticated";
grant references on table "public"."fcm_tokens" to "authenticated";
grant select on table "public"."fcm_tokens" to "authenticated";
grant trigger on table "public"."fcm_tokens" to "authenticated";
grant truncate on table "public"."fcm_tokens" to "authenticated";
grant update on table "public"."fcm_tokens" to "authenticated";

grant delete on table "public"."fcm_tokens" to "service_role";
grant insert on table "public"."fcm_tokens" to "service_role";
grant references on table "public"."fcm_tokens" to "service_role";
grant select on table "public"."fcm_tokens" to "service_role";
grant trigger on table "public"."fcm_tokens" to "service_role";
grant truncate on table "public"."fcm_tokens" to "service_role";
grant update on table "public"."fcm_tokens" to "service_role";
