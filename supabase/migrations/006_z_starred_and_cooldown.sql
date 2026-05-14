-- Star system for alerts + monitor cooldown tracking
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS starred_at timestamptz DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.monitor_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'deleted')),
  monitor_config jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitor_changes_user ON public.monitor_changes(user_id, created_at DESC);

ALTER TABLE public.monitor_changes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monitor_changes' AND policyname = 'Users can read own monitor changes') THEN
    CREATE POLICY "Users can read own monitor changes" ON public.monitor_changes FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
