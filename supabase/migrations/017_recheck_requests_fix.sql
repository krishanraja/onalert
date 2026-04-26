-- 017: Reconcile recheck_requests with the legacy apply-missing-migrations.sql
--
-- Background: there were two competing sources of truth for the
-- recheck_requests table:
--   • supabase/migrations/004_recheck_requests.sql (the migration we keep)
--     — has columns: id, alert_id, user_id, location_id, slot_timestamp,
--       status, created_at, checked_at  +  CHECK status IN (...)
--   • supabase/apply-missing-migrations.sql (now deleted)
--     — additionally added: result jsonb, processed_at timestamptz
--       (and named the timestamp column `processed_at` rather than
--       `checked_at`; no CHECK constraint).
--
-- The edge function `process-rechecks/index.ts` only reads/writes
-- `status` and `checked_at`. Neither `result` nor `processed_at` is
-- referenced anywhere in the codebase. They appear to be vestigial.
--
-- Defensive approach: add the extras as nullable so any production database
-- that was bootstrapped from the deleted apply-missing-migrations.sql
-- doesn't drift, and so the migration is purely additive (idempotent).
--
-- This is intentionally a no-op on a database that already has these columns.

BEGIN;

ALTER TABLE public.recheck_requests
  ADD COLUMN IF NOT EXISTS result       jsonb,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- Document the relationship for future maintainers.
COMMENT ON COLUMN public.recheck_requests.result
  IS 'Optional structured re-check result (vestigial; edge function does not currently populate).';
COMMENT ON COLUMN public.recheck_requests.processed_at
  IS 'Vestigial alias for checked_at — kept for backward compat with legacy apply-missing-migrations.sql.';

COMMIT;
