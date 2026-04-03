-- Fix function search_path security warnings
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_client_last_activity() SET search_path = public;