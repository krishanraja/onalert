-- Update monthly_goals table column names
ALTER TABLE public.monthly_goals 
RENAME COLUMN revenue_target TO revenue_forecast;

ALTER TABLE public.monthly_goals 
RENAME COLUMN cost_target TO cost_budget;

-- Remove revenue and cost columns from daily_progress table
ALTER TABLE public.daily_progress 
DROP COLUMN IF EXISTS revenue_progress,
DROP COLUMN IF EXISTS cost_progress;

-- Create revenue_entries table for milestone tracking
CREATE TABLE public.revenue_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL,
  month TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on revenue_entries
ALTER TABLE public.revenue_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for revenue_entries
CREATE POLICY "Users can view their own revenue entries" 
ON public.revenue_entries 
FOR SELECT 
USING (user_id = 'default_user');

CREATE POLICY "Users can create their own revenue entries" 
ON public.revenue_entries 
FOR INSERT 
WITH CHECK (user_id = 'default_user');

CREATE POLICY "Users can update their own revenue entries" 
ON public.revenue_entries 
FOR UPDATE 
USING (user_id = 'default_user');

CREATE POLICY "Users can delete their own revenue entries" 
ON public.revenue_entries 
FOR DELETE 
USING (user_id = 'default_user');

-- Create trigger for automatic timestamp updates on revenue_entries
CREATE TRIGGER update_revenue_entries_updated_at
BEFORE UPDATE ON public.revenue_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();