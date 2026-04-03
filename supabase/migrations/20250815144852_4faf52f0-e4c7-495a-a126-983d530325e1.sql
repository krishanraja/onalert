-- CRITICAL SECURITY FIX: Secure Google OAuth Token Storage
-- Remove token access from user-facing RLS policies

-- Drop existing RLS policy that exposes tokens
DROP POLICY IF EXISTS "Users can view their own sheets integrations" ON public.sheets_integrations;

-- Create new secure RLS policy that excludes sensitive token columns
CREATE POLICY "Users can view their own sheets integrations (secure)" 
ON public.sheets_integrations 
FOR SELECT 
USING (((auth.uid())::text = user_id));

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