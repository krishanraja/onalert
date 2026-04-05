-- Phase 3: Push notification subscriptions + success stories

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own push subs" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push subs" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own push subs" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Success stories
CREATE TABLE IF NOT EXISTS public.success_stories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story text NOT NULL,
  location_name text,
  wait_days integer,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own stories" ON public.success_stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read approved stories" ON public.success_stories
  FOR SELECT USING (approved = true);
