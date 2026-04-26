-- IMPORTANT: This file contained a leaked service-role JWT in git history.
-- The user MUST rotate the service-role key in Supabase dashboard before
-- re-running this script. Replace <SERVICE_ROLE_KEY_PLACEHOLDER> with the
-- new key only at the moment of execution; do NOT commit it back.
--
-- Additionally, the cron jobs below now call functions that authenticate via
-- a shared `x-cron-secret` header (see supabase/functions/_shared/cron-auth.ts).
-- After rotating the service role key, also set CRON_SECRET in both:
--   1. Supabase function secrets (`supabase secrets set CRON_SECRET=...`)
--   2. The pg_cron job headers below (replace <CRON_SECRET_PLACEHOLDER>)

-- OnAlert CRON Jobs Setup
-- Run this in Supabase Dashboard → SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule poll-appointments every 1 minute (Express tier needs 1-min checks)
-- The function itself enforces per-plan intervals (free: 60min, pro/multi: 5min, express: 1min)
SELECT cron.schedule(
  'poll-appointments-every-1-min',
  '*/1 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zcreubinittdqyoxxwtp.supabase.co/functions/v1/poll-appointments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY_PLACEHOLDER>',
      'x-cron-secret', '<CRON_SECRET_PLACEHOLDER>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule process-delayed-alerts every 5 minutes
-- This sends alerts for free users after their 15-minute delay window
SELECT cron.schedule(
  'process-delayed-alerts-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zcreubinittdqyoxxwtp.supabase.co/functions/v1/process-delayed-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY_PLACEHOLDER>',
      'x-cron-secret', '<CRON_SECRET_PLACEHOLDER>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify the jobs were created
SELECT jobid, jobname, schedule, command FROM cron.job;
