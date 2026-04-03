-- =========================================
-- PORTFOLIO PRO: USER LEARNING SYSTEM
-- Full Intelligence Database Schema
-- =========================================

-- 1. USER PROFILES - Extended user information
CREATE TABLE public.user_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Business Context
  business_type TEXT, -- 'fractional_executive', 'portfolio_consultant', 'thought_leader', 'multi_service'
  industry TEXT,
  years_experience INTEGER,
  revenue_range TEXT, -- '100k-250k', '250k-500k', '500k-1m', '1m+'
  target_market TEXT,
  service_types TEXT[], -- ['workshops', 'advisory', 'lectures', 'coaching', 'consulting']
  
  -- Personalization
  timezone TEXT DEFAULT 'America/New_York',
  currency TEXT DEFAULT 'USD',
  fiscal_year_start INTEGER DEFAULT 1, -- Month (1-12)
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  onboarding_completed_at TIMESTAMPTZ,
  
  -- Engagement
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  total_sessions INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER PREFERENCES - UI/UX preferences that adapt over time
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Theme & Display
  theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
  accent_color TEXT DEFAULT 'purple',
  compact_mode BOOLEAN DEFAULT FALSE,
  animations_enabled BOOLEAN DEFAULT TRUE,
  
  -- Dashboard Preferences
  default_view TEXT DEFAULT 'pipeline', -- 'pipeline', 'planning', 'ai-strategy', 'analytics'
  sidebar_collapsed BOOLEAN DEFAULT FALSE,
  favorite_metrics TEXT[], -- Array of metric keys user prefers
  hidden_sections TEXT[], -- Sections user has hidden
  widget_order JSONB DEFAULT '[]'::jsonb, -- Custom dashboard widget order
  
  -- Notification Preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  browser_notifications BOOLEAN DEFAULT FALSE,
  daily_digest BOOLEAN DEFAULT TRUE,
  weekly_summary BOOLEAN DEFAULT TRUE,
  goal_reminders BOOLEAN DEFAULT TRUE,
  
  -- AI Preferences
  ai_personality TEXT DEFAULT 'professional', -- 'professional', 'casual', 'mentor', 'analyst'
  ai_proactive_suggestions BOOLEAN DEFAULT TRUE,
  ai_auto_insights BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

-- 3. USER BEHAVIOR LOGS - Track all user interactions for learning
CREATE TABLE public.user_behavior_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL, -- 'page_view', 'feature_use', 'click', 'search', 'goal_update', etc.
  event_category TEXT NOT NULL, -- 'navigation', 'data_entry', 'ai_interaction', 'settings'
  event_action TEXT NOT NULL, -- Specific action taken
  event_label TEXT, -- Additional context
  event_value NUMERIC, -- Optional numeric value
  
  -- Context
  page_path TEXT,
  component_name TEXT,
  session_id UUID,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  device_type TEXT, -- 'desktop', 'tablet', 'mobile'
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. USER INSIGHTS - AI-learned patterns and suggestions
CREATE TABLE public.user_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Insight Details
  insight_type TEXT NOT NULL, -- 'pattern', 'recommendation', 'prediction', 'warning'
  category TEXT NOT NULL, -- 'revenue', 'productivity', 'goals', 'pipeline', 'behavior'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Confidence & Priority
  confidence_score NUMERIC DEFAULT 0.5, -- 0-1 confidence in this insight
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'dismissed', 'actioned', 'expired'
  dismissed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Data
  supporting_data JSONB DEFAULT '{}'::jsonb,
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. USER SESSIONS - Track sessions for behavior analysis
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Session Context
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  
  -- Session Metrics
  pages_viewed INTEGER DEFAULT 0,
  actions_taken INTEGER DEFAULT 0,
  ai_interactions INTEGER DEFAULT 0,
  
  -- Quality
  session_quality_score NUMERIC, -- Calculated based on engagement
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. FEATURE USAGE ANALYTICS - Track feature adoption
CREATE TABLE public.feature_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  feature_key TEXT NOT NULL, -- 'ai_chat', 'pipeline', 'goals', 'sheets', etc.
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  first_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Engagement Metrics
  avg_time_spent_seconds INTEGER,
  completion_rate NUMERIC, -- For multi-step features
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT feature_usage_user_feature_unique UNIQUE (user_id, feature_key)
);

-- =========================================
-- Enable RLS on all tables
-- =========================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- =========================================
-- RLS Policies - Users can only access their own data
-- =========================================

-- user_profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- user_preferences policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_behavior_logs policies
CREATE POLICY "Users can view their own behavior logs"
  ON public.user_behavior_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavior logs"
  ON public.user_behavior_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_insights policies
CREATE POLICY "Users can view their own insights"
  ON public.user_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON public.user_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights"
  ON public.user_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_sessions policies
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- feature_usage policies
CREATE POLICY "Users can view their own feature usage"
  ON public.feature_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature usage"
  ON public.feature_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature usage"
  ON public.feature_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =========================================
-- Triggers for automatic profile creation
-- =========================================

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  
  -- Also create default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_insights_updated_at
  BEFORE UPDATE ON public.user_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_usage_updated_at
  BEFORE UPDATE ON public.feature_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Indexes for performance
-- =========================================

CREATE INDEX idx_user_behavior_logs_user_id ON public.user_behavior_logs(user_id);
CREATE INDEX idx_user_behavior_logs_created_at ON public.user_behavior_logs(created_at DESC);
CREATE INDEX idx_user_behavior_logs_event_type ON public.user_behavior_logs(event_type);
CREATE INDEX idx_user_behavior_logs_session_id ON public.user_behavior_logs(session_id);

CREATE INDEX idx_user_insights_user_id ON public.user_insights(user_id);
CREATE INDEX idx_user_insights_status ON public.user_insights(status);
CREATE INDEX idx_user_insights_type ON public.user_insights(insight_type);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at DESC);

CREATE INDEX idx_feature_usage_user_id ON public.feature_usage(user_id);
CREATE INDEX idx_feature_usage_feature_key ON public.feature_usage(feature_key);