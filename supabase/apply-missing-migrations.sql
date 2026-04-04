-- Apply missing migrations to OnAlert database
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================
-- Migration 002: Notification Preferences
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_alerts_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_alerts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_number text;

-- ============================================
-- Migration 003: Alert Delay
-- ============================================
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS delay_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_alerts_delay_until ON public.alerts(delay_until)
  WHERE delay_until IS NOT NULL AND delivered_at IS NULL;

-- ============================================
-- Migration 004: Recheck Requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.recheck_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id uuid REFERENCES public.alerts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  location_id integer NOT NULL,
  slot_timestamp text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  result jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_recheck_requests_status ON public.recheck_requests(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_recheck_requests_user_id ON public.recheck_requests(user_id);

ALTER TABLE public.recheck_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own recheck requests" ON public.recheck_requests;
CREATE POLICY "Users can read own recheck requests" ON public.recheck_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recheck requests" ON public.recheck_requests;
CREATE POLICY "Users can insert own recheck requests" ON public.recheck_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Migration 005: Audit & Observability
-- ============================================
ALTER TABLE public.scrape_logs
  ADD COLUMN IF NOT EXISTS run_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS monitors_eligible integer,
  ADD COLUMN IF NOT EXISTS monitors_skipped integer,
  ADD COLUMN IF NOT EXISTS locations_fetched integer,
  ADD COLUMN IF NOT EXISTS locations_failed integer,
  ADD COLUMN IF NOT EXISTS locations_zero_slots integer,
  ADD COLUMN IF NOT EXISTS new_slots_detected integer,
  ADD COLUMN IF NOT EXISTS alerts_created integer,
  ADD COLUMN IF NOT EXISTS alerts_sent integer,
  ADD COLUMN IF NOT EXISTS alerts_delayed integer,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS cbp_avg_latency_ms integer,
  ADD COLUMN IF NOT EXISTS cbp_max_latency_ms integer,
  ADD COLUMN IF NOT EXISTS anomaly_flags text[],
  ADD COLUMN IF NOT EXISTS metadata jsonb;

CREATE INDEX IF NOT EXISTS idx_scrape_logs_run_id ON public.scrape_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_started_at ON public.scrape_logs(started_at DESC);

CREATE TABLE IF NOT EXISTS public.location_fetch_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id uuid NOT NULL,
  location_id integer NOT NULL,
  http_status integer,
  latency_ms integer,
  slots_returned integer DEFAULT 0,
  response_valid boolean DEFAULT true,
  error text,
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_fetch_logs_run_id ON public.location_fetch_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_location_fetch_logs_location_time ON public.location_fetch_logs(location_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_fetch_logs_fetched_at ON public.location_fetch_logs(fetched_at DESC);

ALTER TABLE public.location_fetch_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read location fetch logs" ON public.location_fetch_logs;
CREATE POLICY "Anyone can read location fetch logs" ON public.location_fetch_logs
  FOR SELECT USING (true);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- ============================================
-- Verify: Show all tables and their columns
-- ============================================
SELECT 'Migrations applied successfully!' as status;
