-- Create tables for enhanced BI tracking of customer tools

-- Customer tool sessions tracking
CREATE TABLE public.customer_tool_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('leadership_assessment', 'ai_agent_analysis', 'idea_blueprint', 'enterprise_assessment')),
  session_duration INTEGER DEFAULT 0, -- in seconds
  questions_asked INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  return_visit BOOLEAN DEFAULT false,
  session_quality_score INTEGER DEFAULT 0 CHECK (session_quality_score >= 0 AND session_quality_score <= 100),
  ip_address TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead scoring and qualification
CREATE TABLE public.lead_scoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  lead_source TEXT NOT NULL, -- which tool generated this lead
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  conversion_probability INTEGER DEFAULT 0 CHECK (conversion_probability >= 0 AND conversion_probability <= 100),
  lead_temperature TEXT DEFAULT 'cold' CHECK (lead_temperature IN ('cold', 'warm', 'hot')),
  tool_usage_frequency INTEGER DEFAULT 1,
  cross_tool_usage_count INTEGER DEFAULT 1,
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT now(),
  consultation_booked BOOLEAN DEFAULT false,
  seminar_attended BOOLEAN DEFAULT false,
  converted_to_paid BOOLEAN DEFAULT false,
  estimated_value NUMERIC DEFAULT 0,
  actual_value NUMERIC DEFAULT 0,
  conversion_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tool performance aggregated metrics
CREATE TABLE public.tool_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('leadership_assessment', 'ai_agent_analysis', 'idea_blueprint', 'enterprise_assessment')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_sessions INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  avg_completion_rate INTEGER DEFAULT 0,
  total_leads_generated INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  consultation_bookings INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  revenue_attributed NUMERIC DEFAULT 0,
  customer_acquisition_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tool_type, date)
);

-- Customer journey tracking
CREATE TABLE public.customer_journey_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  journey_stage TEXT DEFAULT 'awareness' CHECK (journey_stage IN ('awareness', 'consideration', 'decision', 'retention', 'advocacy')),
  touchpoints JSONB DEFAULT '[]'::jsonb, -- array of touchpoint objects
  first_tool_used TEXT,
  tools_used TEXT[] DEFAULT '{}',
  progression_velocity INTEGER DEFAULT 0, -- days from first touch to conversion
  total_engagement_time INTEGER DEFAULT 0, -- total time across all tools
  last_touchpoint TIMESTAMP WITH TIME ZONE DEFAULT now(),
  conversion_path TEXT[], -- array showing the path to conversion
  revenue_attribution NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, customer_email)
);

-- Real-time engagement analytics
CREATE TABLE public.engagement_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('active_sessions', 'daily_usage', 'conversion_events', 'lead_temperature_changes')),
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customer_tool_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_journey_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own customer tool sessions" 
ON public.customer_tool_sessions FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own customer tool sessions" 
ON public.customer_tool_sessions FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own customer tool sessions" 
ON public.customer_tool_sessions FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own lead scoring" 
ON public.lead_scoring FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own lead scoring" 
ON public.lead_scoring FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own lead scoring" 
ON public.lead_scoring FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own tool performance metrics" 
ON public.tool_performance_metrics FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own tool performance metrics" 
ON public.tool_performance_metrics FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own tool performance metrics" 
ON public.tool_performance_metrics FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own customer journey tracking" 
ON public.customer_journey_tracking FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own customer journey tracking" 
ON public.customer_journey_tracking FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own customer journey tracking" 
ON public.customer_journey_tracking FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own engagement analytics" 
ON public.engagement_analytics FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own engagement analytics" 
ON public.engagement_analytics FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Create indexes for better performance
CREATE INDEX idx_customer_tool_sessions_user_id ON public.customer_tool_sessions(user_id);
CREATE INDEX idx_customer_tool_sessions_tool_type ON public.customer_tool_sessions(tool_type);
CREATE INDEX idx_customer_tool_sessions_created_at ON public.customer_tool_sessions(created_at);

CREATE INDEX idx_lead_scoring_user_id ON public.lead_scoring(user_id);
CREATE INDEX idx_lead_scoring_lead_temperature ON public.lead_scoring(lead_temperature);
CREATE INDEX idx_lead_scoring_conversion_probability ON public.lead_scoring(conversion_probability);

CREATE INDEX idx_tool_performance_metrics_user_id ON public.tool_performance_metrics(user_id);
CREATE INDEX idx_tool_performance_metrics_date ON public.tool_performance_metrics(date);

CREATE INDEX idx_customer_journey_user_id ON public.customer_journey_tracking(user_id);
CREATE INDEX idx_customer_journey_stage ON public.customer_journey_tracking(journey_stage);

CREATE INDEX idx_engagement_analytics_user_id ON public.engagement_analytics(user_id);
CREATE INDEX idx_engagement_analytics_timestamp ON public.engagement_analytics(timestamp);

-- Create triggers for updated_at columns
CREATE TRIGGER update_customer_tool_sessions_updated_at
BEFORE UPDATE ON public.customer_tool_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_scoring_updated_at
BEFORE UPDATE ON public.lead_scoring
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tool_performance_metrics_updated_at
BEFORE UPDATE ON public.tool_performance_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_journey_tracking_updated_at
BEFORE UPDATE ON public.customer_journey_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();