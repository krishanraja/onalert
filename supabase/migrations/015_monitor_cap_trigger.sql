-- 015: Enforce per-plan monitor caps at the database layer
--
-- Application code may forget the cap or be bypassed (e.g., direct PostgREST
-- INSERT). This trigger is the source of truth.
--
-- Caps mirror src/lib/plans.ts semantics:
--   free:    1 monitor
--   pro:     1 monitor
--   multi:   5 monitors
--   express: 1 monitor
--
-- SECURITY DEFINER so the trigger can read profiles even if the inserting
-- session has stricter SELECT grants (it shouldn't, since RLS allows users
-- to read their own profile, but defensive-by-default).

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_monitor_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan text;
  cap       int;
  current_count int;
BEGIN
  -- Only enforce on active monitors. Pausing (active = false) doesn't count
  -- against the cap.
  IF NEW.active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT plan INTO user_plan
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF user_plan IS NULL THEN
    RAISE EXCEPTION 'enforce_monitor_cap: profile % not found', NEW.user_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  cap := CASE user_plan
    WHEN 'free'    THEN 1
    WHEN 'pro'     THEN 1
    WHEN 'multi'   THEN 5
    WHEN 'express' THEN 1
    ELSE 1
  END;

  SELECT count(*) INTO current_count
  FROM public.monitors
  WHERE user_id = NEW.user_id
    AND active = true;

  IF current_count >= cap THEN
    RAISE EXCEPTION
      'Monitor cap exceeded: plan=% allows %, you already have % active monitor(s)',
      user_plan, cap, current_count
      USING ERRCODE = 'check_violation',
            HINT = 'Pause an existing monitor or upgrade your plan.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_monitor_cap_trigger ON public.monitors;
CREATE TRIGGER enforce_monitor_cap_trigger
  BEFORE INSERT ON public.monitors
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_monitor_cap();

COMMIT;
