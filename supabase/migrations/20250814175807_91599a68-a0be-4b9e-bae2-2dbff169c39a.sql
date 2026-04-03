-- Create table for tracking business opportunities
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  type TEXT NOT NULL, -- 'workshop', 'advisory', 'lecture', 'pr'
  title TEXT NOT NULL,
  company TEXT,
  contact_person TEXT,
  stage TEXT NOT NULL DEFAULT 'lead', -- 'lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'
  probability INTEGER DEFAULT 50, -- percentage likelihood of closing
  estimated_value NUMERIC DEFAULT 0,
  estimated_close_date DATE,
  notes TEXT,
  month TEXT NOT NULL, -- YYYY-MM format
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own opportunities" 
ON public.opportunities 
FOR SELECT 
USING (user_id = 'default_user');

CREATE POLICY "Users can create their own opportunities" 
ON public.opportunities 
FOR INSERT 
WITH CHECK (user_id = 'default_user');

CREATE POLICY "Users can update their own opportunities" 
ON public.opportunities 
FOR UPDATE 
USING (user_id = 'default_user');

CREATE POLICY "Users can delete their own opportunities" 
ON public.opportunities 
FOR DELETE 
USING (user_id = 'default_user');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();