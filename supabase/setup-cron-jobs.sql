-- OnAlert CRON Jobs Setup
-- Run this in Supabase Dashboard → SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule poll-appointments every 5 minutes
-- This polls CBP API for new appointment slots and creates alerts
SELECT cron.schedule(
  'poll-appointments-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zcreubinittdqyoxxwtp.supabase.co/functions/v1/poll-appointments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjcmV1YmluaXR0ZHF5b3h4d3RwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyODc0NSwiZXhwIjoyMDkwODA0NzQ1fQ.JKaimLyMMYx9lckVqwEtnXDnnc3h7dEhThSoMbxugvE'
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
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjcmV1YmluaXR0ZHF5b3h4d3RwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyODc0NSwiZXhwIjoyMDkwODA0NzQ1fQ.JKaimLyMMYx9lckVqwEtnXDnnc3h7dEhThSoMbxugvE'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify the jobs were created
SELECT jobid, jobname, schedule, command FROM cron.job;
