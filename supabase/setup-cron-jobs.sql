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

-- Idempotent: drop existing jobs first so re-running this script (e.g. after a
-- secret rotation) doesn't create duplicates. unschedule() errors if the job
-- doesn't exist, so guard each with a DO block.
DO $$
BEGIN
  PERFORM cron.unschedule('poll-appointments-every-1-min');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$
BEGIN
  PERFORM cron.unschedule('process-delayed-alerts-every-5-min');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$
BEGIN
  PERFORM cron.unschedule('process-rechecks-every-5-min');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$
BEGIN
  PERFORM cron.unschedule('predict-slots-daily');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

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

-- Schedule process-rechecks every 5 minutes
-- Re-polls locations a user explicitly asked to re-check (recheck_requests),
-- decoupled from the main per-plan poll cadence. Was previously UNSCHEDULED in
-- prod, so the recheck feature was dead — this wires it on.
SELECT cron.schedule(
  'process-rechecks-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zcreubinittdqyoxxwtp.supabase.co/functions/v1/process-rechecks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY_PLACEHOLDER>',
      'x-cron-secret', '<CRON_SECRET_PLACEHOLDER>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule predict-slots once daily at 08:00 UTC
-- Recomputes day-of-week slot-likelihood predictions from 90 days of
-- slot_history. Heavy + only needs to run occasionally; was UNSCHEDULED in prod
-- so slot_predictions never refreshed — this wires it on.
SELECT cron.schedule(
  'predict-slots-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zcreubinittdqyoxxwtp.supabase.co/functions/v1/predict-slots',
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
