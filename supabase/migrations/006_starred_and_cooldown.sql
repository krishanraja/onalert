-- Star system for alerts
ALTER TABLE public.alerts ADD COLUMN starred_at timestamptz DEFAULT NULL;

-- Monitor change log for cooldown enforcement
CREATE TABLE public.monitor_changes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'deleted')),
  monitor_config jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_monitor_changes_user ON public.monitor_changes(user_id, created_at DESC);

ALTER TABLE public.monitor_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own monitor changes" ON public.monitor_changes
  FOR SELECT USING (auth.uid() = user_id);
