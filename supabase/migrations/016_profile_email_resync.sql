-- 016: Keep profiles.email in sync with auth.users.email
--
-- The handle_new_user() trigger (001:93) seeds profiles.email at signup, but
-- if a user later changes their email via Supabase Auth, profiles.email
-- becomes stale. That's the address every alert email is sent to, so this
-- bug silently breaks notifications.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run when email actually changed (defense in depth — the trigger
  -- WHEN clause already guarantees this).
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (NEW.email IS DISTINCT FROM OLD.email)
  EXECUTE FUNCTION public.handle_user_email_update();

COMMIT;
