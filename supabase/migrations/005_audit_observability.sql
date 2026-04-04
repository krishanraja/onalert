-- Audit & Observability: enrich scrape_logs, add location_fetch_logs, add is_admin

-- 1. Add columns to scrape_logs for richer per-run telemetry
ALTER TABLE public.scrape_logs
  ADD COLUMN run_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN monitors_eligible integer,
  ADD COLUMN monitors_skipped integer,
  ADD COLUMN locations_fetched integer,
  ADD COLUMN locations_failed integer,
  ADD COLUMN locations_zero_slots integer,
  ADD COLUMN new_slots_detected integer,
  ADD COLUMN alerts_created integer,
  ADD COLUMN alerts_sent integer,
  ADD COLUMN alerts_delayed integer,
  ADD COLUMN duration_ms integer,
  ADD COLUMN cbp_avg_latency_ms integer,
  ADD COLUMN cbp_max_latency_ms integer,
  ADD COLUMN anomaly_flags text[],
  ADD COLUMN metadata jsonb;

-- Index for correlation ID lookups
CREATE INDEX idx_scrape_logs_run_id ON public.scrape_logs(run_id);
-- Index for time-range queries
CREATE INDEX idx_scrape_logs_started_at ON public.scrape_logs(started_at DESC);

-- 2. Per-location fetch detail table
CREATE TABLE public.location_fetch_logs (
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

CREATE INDEX idx_location_fetch_logs_run_id ON public.location_fetch_logs(run_id);
CREATE INDEX idx_location_fetch_logs_location_time ON public.location_fetch_logs(location_id, fetched_at DESC);
CREATE INDEX idx_location_fetch_logs_fetched_at ON public.location_fetch_logs(fetched_at DESC);

-- RLS: read-only for authenticated users, insert via service role
ALTER TABLE public.location_fetch_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read location fetch logs" ON public.location_fetch_logs
  FOR SELECT USING (true);

-- 3. Admin flag on profiles
ALTER TABLE public.profiles
  ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
