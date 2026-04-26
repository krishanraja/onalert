-- 014: Plug RLS gaps and lock down audit tables
--
-- Issues fixed:
--   1. monitor_changes had RLS + a SELECT policy but no INSERT policy, so
--      authenticated users couldn't actually log changes — only service role
--      could (defeating the whole point of client-side audit logging).
--   2. recheck_requests INSERT policy verified only user_id ownership; an
--      attacker could insert a recheck for anyone else's alert.
--   3. scrape_logs / location_fetch_logs / slot_history / slot_predictions
--      were SELECT-able by anyone (auth or anon) via `using(true)`. These
--      tables expose internal monitoring infrastructure and competitive
--      intelligence (which locations OnAlert checks, success rates, etc.).
--      Lock down to admin-only. Public-facing /wait-times reads service-role
--      via the public-wait-times edge function, so anon doesn't need direct
--      table access.

BEGIN;

-- ============================================================
-- 1. monitor_changes INSERT policy
-- ============================================================
DROP POLICY IF EXISTS "users insert own monitor_changes" ON public.monitor_changes;
CREATE POLICY "users insert own monitor_changes"
  ON public.monitor_changes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. recheck_requests INSERT policy — verify alert ownership
-- ============================================================
-- The original policy from 004_recheck_requests.sql:24 only checked
-- `auth.uid() = user_id`, not that the alert belongs to that user.
DROP POLICY IF EXISTS "Users can insert own recheck requests" ON public.recheck_requests;
DROP POLICY IF EXISTS "Users can insert own recheck request" ON public.recheck_requests;

CREATE POLICY "Users can insert own recheck requests"
  ON public.recheck_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.alerts
      WHERE alerts.id = recheck_requests.alert_id
        AND alerts.user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. Lock down audit/observability tables to admin-only
-- ============================================================
-- scrape_logs (defined in 001:88 as `using(true)`)
DROP POLICY IF EXISTS "Users can read scrape logs" ON public.scrape_logs;
CREATE POLICY "Admins can read scrape logs"
  ON public.scrape_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- location_fetch_logs (defined in 005:46 as `using(true)`)
DROP POLICY IF EXISTS "Anyone can read location fetch logs" ON public.location_fetch_logs;
CREATE POLICY "Admins can read location fetch logs"
  ON public.location_fetch_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- slot_history (defined in 007:20 as `using(true)`)
-- Public consumption goes via the public-wait-times edge function which uses
-- the service-role key and bypasses RLS, so anon needs no direct access here.
DROP POLICY IF EXISTS "Anyone can read slot history" ON public.slot_history;
CREATE POLICY "Admins can read slot history"
  ON public.slot_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- slot_predictions (defined in 009:46 as `using(true)`)
DROP POLICY IF EXISTS "Anyone can read predictions" ON public.slot_predictions;
CREATE POLICY "Admins can read predictions"
  ON public.slot_predictions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

COMMIT;
