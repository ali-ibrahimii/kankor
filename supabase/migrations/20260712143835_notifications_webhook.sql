-- Instant delivery: fire a webhook into the Next.js app the moment a
-- notification row is inserted, instead of waiting for the polling cron
-- (/api/cron/deliver-telegram-notifications, /api/cron/deliver-push-notifications)
-- to pick it up on its next 5-minute tick. The cron jobs stay in place as a
-- lower-frequency reconciliation fallback (see vercel.json) since pg_net
-- webhook calls are fire-and-forget with no automatic retry.
--
-- Mirrors the Slack approval webhooks (20260716000000_slack_approval_webhooks.sql):
-- the app base URL and the shared secret are read at call-time from Vault, so
-- nothing environment-specific is committed here. Required Vault secrets:
--   - notifications_webhook_url : the app base URL (shared with the Slack
--                                 webhooks). Seeded for local dev from the
--                                 SUPABASE_DB_WEBHOOK_URL env var via
--                                 config.toml's [db.vault] block.
--   - cron_secret               : sent as `Authorization: Bearer` and checked
--                                 by the routes against the same CRON_SECRET
--                                 the /api/cron/* routes already use. Seeded
--                                 for local dev from env via config.toml's
--                                 [db.vault] block.
-- If either secret is missing, the trigger silently no-ops so notification
-- inserts are never blocked by missing webhook config. In hosted projects,
-- create the same two secrets once via the SQL editor:
--   select vault.create_secret('<deployed base url>', 'notifications_webhook_url');
--   select vault.create_secret('<CRON_SECRET value>', 'cron_secret');

create extension if not exists "pg_net";

create or replace function "public"."notify_notification_webhook"()
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
  where name = 'cron_secret';

  perform net.http_post(
    url := webhook_url || '/api/webhooks/notification-created',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(new),
      'old_record', null
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(webhook_secret, '')
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

revoke all on function "public"."notify_notification_webhook"() from public;

create trigger "notify_notification_webhook"
after insert on "public"."notifications"
for each row
execute function "public"."notify_notification_webhook"();
