-- Migration: Add pg_cron jobs for notification delivery reconciliation fallback.
-- Runs /api/cron/deliver-telegram-notifications and /api/cron/deliver-push-notifications every 30 minutes.

create extension if not exists "pg_cron";
create extension if not exists "pg_net";

-- Schedule Telegram notification delivery cron every 30 minutes
select cron.schedule(
  'deliver-telegram-notifications-cron',
  '*/30 * * * *',
  $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'notifications_webhook_url') || '/api/cron/deliver-telegram-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'), '')
    )
  );
  $$
);

-- Schedule Push notification delivery cron every 30 minutes
select cron.schedule(
  'deliver-push-notifications-cron',
  '*/30 * * * *',
  $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'notifications_webhook_url') || '/api/cron/deliver-push-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'), '')
    )
  );
  $$
);
