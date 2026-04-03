-- Enhanced Security: Add token audit logging and rotation tracking
-- Add columns for better token security management

ALTER TABLE public.sheets_integrations 
ADD COLUMN IF NOT EXISTS token_last_rotated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS token_access_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_token_compromised boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS security_hash text;

-- Create trigger to automatically hash tokens for integrity verification
CREATE OR REPLACE FUNCTION public.generate_token_security_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a hash of the encrypted token for integrity verification
  -- This allows us to detect if tokens have been tampered with
  IF NEW.access_token IS NOT NULL THEN
    NEW.security_hash = encode(sha256(NEW.access_token::bytea), 'hex');
  END IF;
  
  -- Set token rotation time
  IF NEW.access_token IS DISTINCT FROM OLD.access_token THEN
    NEW.token_last_rotated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS token_security_trigger ON public.sheets_integrations;
CREATE TRIGGER token_security_trigger
  BEFORE INSERT OR UPDATE ON public.sheets_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_token_security_hash();

-- Enhanced security function to validate token integrity
CREATE OR REPLACE FUNCTION public.verify_token_integrity(target_user_id text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  integration_record RECORD;
  computed_hash text;
BEGIN
  -- Get integration record
  SELECT access_token, security_hash 
  INTO integration_record
  FROM public.sheets_integrations 
  WHERE user_id = target_user_id
  AND access_token IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Compute current hash
  computed_hash := encode(sha256(integration_record.access_token::bytea), 'hex');
  
  -- Verify integrity
  RETURN computed_hash = integration_record.security_hash;
END;
$$;

-- Enhanced security audit function with more details
CREATE OR REPLACE FUNCTION public.log_token_access(
  target_user_id text,
  access_type text,
  success boolean DEFAULT true,
  additional_info jsonb DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log the access attempt
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource,
    details,
    created_at
  ) VALUES (
    target_user_id,
    'token_access',
    'google_oauth_tokens',
    jsonb_build_object(
      'access_type', access_type,
      'success', success,
      'additional_info', additional_info,
      'timestamp', extract(epoch from now())
    ),
    now()
  );
  
  -- Increment access counter if successful
  IF success THEN
    UPDATE public.sheets_integrations 
    SET token_access_count = COALESCE(token_access_count, 0) + 1
    WHERE user_id = target_user_id;
  END IF;
END;
$$;