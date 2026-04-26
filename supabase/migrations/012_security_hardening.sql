-- 012: Security hardening — column-level UPDATE grants and plan CHECK constraint
--
-- Goals:
--   1. Prevent users from elevating their own plan, becoming admin, or
--      reassigning monitors/alerts to other users via PATCH on profile/alert rows.
--   2. Enforce a strict whitelist of plan values via CHECK constraint.
--
-- Background: Row-Level Security alone allows users to UPDATE any column on
-- their own row. We need column-level GRANTs to lock that down.

BEGIN;

-- ============================================================
-- Profiles: column-level UPDATE permissions
-- ============================================================
-- Columns confirmed across migrations 001, 002, 005, 006, 008, 009, 010:
--   id, email, stripe_customer_id, plan, created_at, updated_at,
--   email_alerts_enabled, sms_alerts_enabled, phone_number, is_admin,
--   referral_code, organization_id

-- Revoke ALL UPDATE on profiles, then grant only safe columns back.
-- This is the cleanest way to be exhaustive without listing every server-only
-- column individually.
REVOKE UPDATE ON public.profiles FROM authenticated;

-- Grant UPDATE only on user-controllable preference columns.
-- Excluded (server-only): plan, is_admin, stripe_customer_id, organization_id,
-- referral_code, created_at, updated_at, id.
GRANT UPDATE (
  email,
  email_alerts_enabled,
  sms_alerts_enabled,
  phone_number
) ON public.profiles TO authenticated;

-- NOTE on notification_preferences: migrations do not define a single
-- `notification_preferences` jsonb column on profiles. Individual prefs
-- (email_alerts_enabled, sms_alerts_enabled, phone_number) are listed above.
-- NOTE on referral_code: although the user owns their code, allowing UPDATE
-- enables abuse (overwriting to a celebrity's code, etc.). Server-set only.

-- ============================================================
-- Alerts: column-level UPDATE permissions
-- ============================================================
-- Columns confirmed from migrations 001, 003, 0066:
--   id, monitor_id, user_id, payload, channel, delivered_at, read_at,
--   created_at, delay_until, starred_at

REVOKE UPDATE ON public.alerts FROM authenticated;

-- Users may only mark alerts as read or starred. Everything else is
-- server-managed (delivery state, payload, routing, ownership).
GRANT UPDATE (
  read_at,
  starred_at
) ON public.alerts TO authenticated;

-- ============================================================
-- Plan CHECK constraint
-- ============================================================
-- First normalize any legacy 'family' values to 'multi' so the constraint
-- can be added without violation. (Stripe webhook already does this for new
-- payments, but historical rows may still hold 'family'.)
DO $$
BEGIN
  UPDATE public.profiles SET plan = 'multi' WHERE plan = 'family';
EXCEPTION WHEN OTHERS THEN
  -- table or column missing — skip
  RAISE NOTICE 'Skipping family→multi normalization: %', SQLERRM;
END $$;

-- Drop any pre-existing constraint with the same name so re-runs are safe.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_chk;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_chk
  CHECK (plan IN ('free', 'pro', 'multi', 'express'));

COMMIT;
