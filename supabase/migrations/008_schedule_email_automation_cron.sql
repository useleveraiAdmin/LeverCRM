-- Daily invocation of the send-automation-emails Edge Function via pg_cron + pg_net.
-- SECURITY: replace <SERVICE_ROLE_KEY> below with the project's actual
-- service_role key before running this file directly — it is intentionally
-- redacted here since this file is committed to git. The live database
-- already has the real key applied (set directly via the Supabase MCP, never
-- committed) — this file is a redacted record of that migration, not a
-- script safe to re-run as-is.
select cron.schedule(
  'send-automation-emails-daily',
  '0 14 * * *',
  $$
  select net.http_post(
    url := 'https://dvscivtzmquwwmzhetgh.supabase.co/functions/v1/send-automation-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);
