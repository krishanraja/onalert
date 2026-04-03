-- PULSE Database Schema
-- Tables for clients, activity logs, and weekly summaries

-- Clients table - User's portfolio clients/engagements
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8B5CF6',
  engagement_type TEXT DEFAULT 'retainer', -- retainer, project, advisory
  monthly_revenue_target NUMERIC(10,2),
  hours_weekly INTEGER,
  status TEXT DEFAULT 'active', -- active, paused, completed
  notes TEXT,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activity logs table - Voice/text activity entries
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES public.clients ON DELETE SET NULL,
  activity_type TEXT NOT NULL DEFAULT 'work', -- meeting, call, email, work, admin, networking, other
  summary TEXT NOT NULL,
  notes TEXT,
  duration_minutes INTEGER,
  revenue NUMERIC(10,2),
  transcript_raw TEXT,
  created_via_voice BOOLEAN DEFAULT false,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weekly summaries table - AI-generated weekly briefs
CREATE TABLE public.weekly_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_revenue NUMERIC(10,2),
  total_hours NUMERIC(5,1),
  total_activities INTEGER,
  top_clients JSONB, -- [{client_id, name, hours, revenue}]
  highlights TEXT[], -- Key accomplishments
  ai_summary TEXT, -- AI-generated narrative summary
  insights JSONB, -- AI-generated insights
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP WITH TIME ZONE,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients" 
  ON public.clients FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" 
  ON public.clients FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
  ON public.clients FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
  ON public.clients FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own activity logs" 
  ON public.activity_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity logs" 
  ON public.activity_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity logs" 
  ON public.activity_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity logs" 
  ON public.activity_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for weekly_summaries
CREATE POLICY "Users can view their own weekly summaries" 
  ON public.weekly_summaries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weekly summaries" 
  ON public.weekly_summaries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly summaries" 
  ON public.weekly_summaries FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_client_id ON public.activity_logs(client_id);
CREATE INDEX idx_activity_logs_logged_at ON public.activity_logs(logged_at DESC);
CREATE INDEX idx_weekly_summaries_user_id ON public.weekly_summaries(user_id);
CREATE INDEX idx_weekly_summaries_week_start ON public.weekly_summaries(week_start DESC);

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_logs_updated_at
  BEFORE UPDATE ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update client's last_activity_date when activity is logged
CREATE OR REPLACE FUNCTION public.update_client_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    UPDATE public.clients 
    SET last_activity_date = NEW.logged_at 
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_activity_on_log
  AFTER INSERT ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_client_last_activity();