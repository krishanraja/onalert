-- 013: Stripe webhook idempotency + alert dedup indexes
--
-- 1. stripe_events table — primary key on event_id provides at-most-once
--    semantics for Stripe webhook deliveries. Service-role-only (RLS enabled
--    with no policies).
-- 2. Unique partial index on alerts to prevent duplicate slot alerts caused
--    by overlapping CRON runs or retries. Backed by alerts.payload jsonb
--    (confirmed in 001_initial_schema.sql:32 — `payload jsonb not null`).
-- 3. BTREE index on (location_id, created_at) over jsonb path for the
--    getLocationAlertHistory N+1 fix.

BEGIN;

-- ============================================================
-- stripe_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id     text PRIMARY KEY,
  type         text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- No policies = no client (anon/authenticated) access. Service role bypasses
-- RLS, so the stripe-webhook function can insert/select normally.

-- ============================================================
-- Alerts dedup: collapse historical duplicates, then add index
-- ============================================================
-- Production has accumulated duplicate alert rows from overlapping CRON
-- runs (the bug this index now prevents). Before the unique index can be
-- created we have to collapse those duplicates to one row per (monitor,
-- location_id, slot_timestamp). We keep the OLDEST row of each group so
-- the user keeps whichever alert they most likely already saw/acted on.
WITH duplicate_alerts AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY monitor_id,
                   payload ->> 'location_id',
                   payload ->> 'slot_timestamp'
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.alerts
  WHERE (payload ->> 'slot_timestamp') IS NOT NULL
)
DELETE FROM public.alerts a
USING duplicate_alerts d
WHERE a.id = d.id AND d.rn > 1;

-- Prevents two concurrent poll-appointments runs from inserting two alerts
-- for the same (monitor, location, slot_timestamp) tuple.
-- Partial WHERE clause skips rows that don't yet have a slot_timestamp
-- (e.g., test/system alerts or future alert types).
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_unique_slot
  ON public.alerts (
    monitor_id,
    ((payload ->> 'location_id')),
    ((payload ->> 'slot_timestamp'))
  )
  WHERE (payload ->> 'slot_timestamp') IS NOT NULL;

-- ============================================================
-- getLocationAlertHistory perf index
-- ============================================================
-- Powers the per-location historical lookup used to enrich alert narratives.
-- Without this, every alert generation triggers a seq-scan over alerts.
CREATE INDEX IF NOT EXISTS idx_alerts_payload_loc_created
  ON public.alerts ((payload ->> 'location_id'), created_at DESC);

COMMIT;
