-- Drop existing RLS policies that depend on user_id columns
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can view their own business context" ON public.user_business_context;
DROP POLICY IF EXISTS "Users can create their own business context" ON public.user_business_context;
DROP POLICY IF EXISTS "Users can update their own business context" ON public.user_business_context;

-- Change user_id columns from UUID to TEXT
ALTER TABLE public.ai_conversations 
ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE public.user_business_context 
ALTER COLUMN user_id TYPE TEXT;

-- Recreate RLS policies with TEXT user_id
CREATE POLICY "Users can view their own conversations" 
ON public.ai_conversations 
FOR SELECT 
USING (user_id = 'default_user');

CREATE POLICY "Users can create their own conversations" 
ON public.ai_conversations 
FOR INSERT 
WITH CHECK (user_id = 'default_user');

CREATE POLICY "Users can view their own business context" 
ON public.user_business_context 
FOR SELECT 
USING (user_id = 'default_user');

CREATE POLICY "Users can create their own business context" 
ON public.user_business_context 
FOR INSERT 
WITH CHECK (user_id = 'default_user');

CREATE POLICY "Users can update their own business context" 
ON public.user_business_context 
FOR UPDATE 
USING (user_id = 'default_user');