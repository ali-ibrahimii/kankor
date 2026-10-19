-- Manual-approval Slack notifications. When an instructor signs up or a school
-- is registered, fire a webhook into the Next.js app, which posts a message
-- (with an "Approve" button) into the abzarkankor Slack channel. Clicking
-- Approve flips the account's status to `active` (see
-- src/app/api/slack/webhook/* and src/app/api/slack/interactions).
--
-- Mirrors the notifications webhook (20260712143835_notifications_webhook.sql):
-- the app base URL and the shared secret are read at call-time from Vault, so
-- nothing environment-specific is committed here. Required Vault secrets:
--   - notifications_webhook_url : the app base URL (reused; already created for
--                                 the notifications webhook).
--   - slack_db_webhook_secret   : sent as the `x-webhook-secret` header and
--                                 checked by the routes against
--                                 SLACK_DB_WEBHOOK_SECRET. Seeded for local dev
--                                 from env via config.toml's [db.vault] block.
-- If either secret is missing, the trigger silently no-ops so inserts/updates
-- are never blocked by missing webhook config.

create extension if not exists "pg_net";

-- ─── Instructor signups (public.profiles) ─────────────────────────────────────

create or replace function "public"."notify_slack_instructor_signup"()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook_url text;
  webhook_secret text;
begin
  select decrypted_secret into webhook_url
  from vault.decrypted_secrets
  where name = 'notifications_webhook_url';

  if webhook_url is null then
    return new;
  end if;

  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'slack_db_webhook_secret';

  perform net.http_post(
    url := webhook_url || '/api/slack/webhook/instructor-signup',
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(new),
      'old_record', case when TG_OP = 'UPDATE' then to_jsonb(old) else null end
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', coalesce(webhook_secret, '')
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

revoke all on function "public"."notify_slack_instructor_signup"() from public;

-- Only notify while the account still needs approval, and (on update) only when
-- the account just became a pending instructor — avoids re-notifying on every
-- unrelated profile edit.
create trigger "notify_slack_instructor_signup_insert"
after insert on "public"."profiles"
for each row
when (new.role = 'instructor' and new.instructor_status is distinct from 'active')
execute function "public"."notify_slack_instructor_signup"();

create trigger "notify_slack_instructor_signup_update"
after update on "public"."profiles"
for each row
when (
  new.role = 'instructor'
  and new.instructor_status is distinct from 'active'
  and (
    old.role is distinct from new.role
    or old.instructor_status is distinct from new.instructor_status
  )
)
execute function "public"."notify_slack_instructor_signup"();

-- ─── School registrations (public.schools) ────────────────────────────────────

create or replace function "public"."notify_slack_school_created"()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook_url text;
  webhook_secret text;
begin
  select decrypted_secret into webhook_url
  from vault.decrypted_secrets
  where name = 'notifications_webhook_url';

  if webhook_url is null then
    return new;
  end if;

  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'slack_db_webhook_secret';

  perform net.http_post(
    url := webhook_url || '/api/slack/webhook/school-created',
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(new),
      'old_record', case when TG_OP = 'UPDATE' then to_jsonb(old) else null end
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', coalesce(webhook_secret, '')
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

revoke all on function "public"."notify_slack_school_created"() from public;

create trigger "notify_slack_school_created_insert"
after insert on "public"."schools"
for each row
when (new.status is distinct from 'active')
execute function "public"."notify_slack_school_created"();

create trigger "notify_slack_school_created_update"
after update on "public"."schools"
for each row
when (
  new.status is distinct from 'active'
  and old.status is distinct from new.status
)
execute function "public"."notify_slack_school_created"();
