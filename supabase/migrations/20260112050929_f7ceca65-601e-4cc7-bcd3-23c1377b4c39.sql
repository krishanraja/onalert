-- Fix search_path for functions created in previous migration
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;