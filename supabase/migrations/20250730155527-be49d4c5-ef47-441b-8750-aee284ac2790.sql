-- Create the update timestamp function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for AI conversations and context
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB,
  conversation_type TEXT NOT NULL DEFAULT 'quick_insight', -- 'quick_insight' or 'strategic'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own conversations" 
ON public.ai_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.ai_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create table for user business context
CREATE TABLE public.user_business_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  business_type TEXT,
  target_market TEXT,
  main_challenges TEXT[],
  priorities TEXT[],
  communication_style TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_business_context ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own business context" 
ON public.user_business_context 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business context" 
ON public.user_business_context 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business context" 
ON public.user_business_context 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for business context timestamps
CREATE TRIGGER update_user_business_context_updated_at
BEFORE UPDATE ON public.user_business_context
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();