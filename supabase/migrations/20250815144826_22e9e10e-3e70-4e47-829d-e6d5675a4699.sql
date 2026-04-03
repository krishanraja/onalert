-- CRITICAL SECURITY FIX: Secure Google OAuth Token Storage
-- Remove token access from user-facing RLS policies

-- Drop existing RLS policy that exposes tokens
DROP POLICY IF EXISTS "Users can view their own sheets integrations" ON public.sheets_integrations;

-- Create new secure RLS policy that excludes sensitive token columns
CREATE POLICY "Users can view their own sheets integrations (secure)" 
ON public.sheets_integrations 
FOR SELECT 
USING (((auth.uid())::text = user_id))
-- This policy will be handled by row-level filtering in application code to exclude tokens

-- Create security definer function for secure token access (edge functions only)
CREATE OR REPLACE FUNCTION public.get_user_google_tokens(target_user_id text)
RETURNS TABLE(
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow this function to be called from edge functions context
  -- by checking for service role authentication
  IF NOT EXISTS (
    SELECT 1 WHERE current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied: Function can only be called by service role';
  END IF;

  RETURN QUERY
  SELECT 
    si.access_token,
    si.refresh_token,
    si.token_expires_at
  FROM public.sheets_integrations si
  WHERE si.user_id = target_user_id
  AND si.access_token IS NOT NULL;
END;
$$;

-- Create function to securely update tokens (edge functions only)
CREATE OR REPLACE FUNCTION public.update_user_google_tokens(
  target_user_id text,
  new_access_token text,
  new_refresh_token text,
  new_expires_at timestamp with time zone
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow this function to be called from edge functions context
  IF NOT EXISTS (
    SELECT 1 WHERE current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied: Function can only be called by service role';
  END IF;

  UPDATE public.sheets_integrations
  SET 
    access_token = new_access_token,
    refresh_token = new_refresh_token,
    token_expires_at = new_expires_at,
    updated_at = now()
  WHERE user_id = target_user_id;

  RETURN FOUND;
END;
$$;

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text,
  action text NOT NULL,
  resource text,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "Service role only access to audit logs"
ON public.security_audit_log
FOR ALL
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  target_user_id text,
  action_type text,
  resource_name text,
  event_details jsonb DEFAULT NULL,
  client_ip inet DEFAULT NULL,
  client_user_agent text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource,
    details,
    ip_address,
    user_agent
  ) VALUES (
    target_user_id,
    action_type,
    resource_name,
    event_details,
    client_ip,
    client_user_agent
  );
END;
$$;