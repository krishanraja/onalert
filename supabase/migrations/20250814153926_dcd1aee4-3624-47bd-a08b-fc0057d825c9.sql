-- Create tables for the redesigned goal tracking system

-- Monthly goals for target-based metrics (Revenue, Workshops, Advisory, Lectures, PR)
CREATE TABLE public.monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  month TEXT NOT NULL, -- YYYY-MM format
  revenue_target DECIMAL DEFAULT 0,
  cost_target DECIMAL DEFAULT 0,
  workshops_target INTEGER DEFAULT 0,
  advisory_target INTEGER DEFAULT 0,
  lectures_target INTEGER DEFAULT 0,
  pr_target INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Monthly snapshots for current state metrics (Site Visits, Social Followers)
CREATE TABLE public.monthly_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  month TEXT NOT NULL, -- YYYY-MM format
  site_visits INTEGER DEFAULT 0,
  social_followers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Daily progress tracking for targets
CREATE TABLE public.daily_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  date DATE NOT NULL, -- YYYY-MM-DD format
  month TEXT NOT NULL, -- YYYY-MM format
  revenue_progress DECIMAL DEFAULT 0,
  cost_progress DECIMAL DEFAULT 0,
  workshops_progress INTEGER DEFAULT 0,
  advisory_progress INTEGER DEFAULT 0,
  lectures_progress INTEGER DEFAULT 0,
  pr_progress INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Spreadsheet integration settings
CREATE TABLE public.spreadsheet_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  google_sheet_id TEXT,
  sync_enabled BOOLEAN DEFAULT false,
  sync_frequency TEXT DEFAULT 'daily', -- real-time, hourly, daily
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending', -- pending, syncing, success, error
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheet_sync ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monthly_goals
CREATE POLICY "Users can view their own monthly goals" 
ON public.monthly_goals 
FOR SELECT 
USING (user_id = 'default_user');

CREATE POLICY "Users can create their own monthly goals" 
ON public.monthly_goals 
FOR INSERT 
WITH CHECK (user_id = 'default_user');

CREATE POLICY "Users can update their own monthly goals" 
ON public.monthly_goals 
FOR UPDATE 
USING (user_id = 'default_user');

CREATE POLICY "Users can delete their own monthly goals" 
ON public.monthly_goals 
FOR DELETE 
USING (user_id = 'default_user');

-- Create RLS policies for monthly_snapshots
CREATE POLICY "Users can view their own monthly snapshots" 
ON public.monthly_snapshots 
FOR SELECT 
USING (user_id = 'default_user');

CREATE POLICY "Users can create their own monthly snapshots" 
ON public.monthly_snapshots 
FOR INSERT 
WITH CHECK (user_id = 'default_user');

CREATE POLICY "Users can update their own monthly snapshots" 
ON public.monthly_snapshots 
FOR UPDATE 
USING (user_id = 'default_user');

CREATE POLICY "Users can delete their own monthly snapshots" 
ON public.monthly_snapshots 
FOR DELETE 
USING (user_id = 'default_user');

-- Create RLS policies for daily_progress
CREATE POLICY "Users can view their own daily progress" 
ON public.daily_progress 
FOR SELECT 
USING (user_id = 'default_user');

CREATE POLICY "Users can create their own daily progress" 
ON public.daily_progress 
FOR INSERT 
WITH CHECK (user_id = 'default_user');

CREATE POLICY "Users can update their own daily progress" 
ON public.daily_progress 
FOR UPDATE 
USING (user_id = 'default_user');

CREATE POLICY "Users can delete their own daily progress" 
ON public.daily_progress 
FOR DELETE 
USING (user_id = 'default_user');

-- Create RLS policies for spreadsheet_sync
CREATE POLICY "Users can view their own spreadsheet sync" 
ON public.spreadsheet_sync 
FOR SELECT 
USING (user_id = 'default_user');

CREATE POLICY "Users can create their own spreadsheet sync" 
ON public.spreadsheet_sync 
FOR INSERT 
WITH CHECK (user_id = 'default_user');

CREATE POLICY "Users can update their own spreadsheet sync" 
ON public.spreadsheet_sync 
FOR UPDATE 
USING (user_id = 'default_user');

CREATE POLICY "Users can delete their own spreadsheet sync" 
ON public.spreadsheet_sync 
FOR DELETE 
USING (user_id = 'default_user');

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_monthly_goals_updated_at
BEFORE UPDATE ON public.monthly_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_snapshots_updated_at
BEFORE UPDATE ON public.monthly_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_progress_updated_at
BEFORE UPDATE ON public.daily_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spreadsheet_sync_updated_at
BEFORE UPDATE ON public.spreadsheet_sync
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();