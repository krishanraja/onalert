-- Fix UUID type mismatch for user_id columns
-- Change user_id from UUID to TEXT to support string identifiers like 'default_user'

ALTER TABLE public.ai_conversations 
ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE public.user_business_context 
ALTER COLUMN user_id TYPE TEXT;