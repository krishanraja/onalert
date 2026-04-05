-- Phase 1: SMS support + booking click tracking

-- Phone number for SMS notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;

-- Booking click tracking (for live counter + survival rate)
CREATE TABLE IF NOT EXISTS public.booking_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id uuid REFERENCES public.alerts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id integer NOT NULL,
  still_available boolean,
  clicked_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_clicks_user ON public.booking_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_clicks_time ON public.booking_clicks(clicked_at DESC);

ALTER TABLE public.booking_clicks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_clicks' AND policyname = 'Users can insert own clicks') THEN
    CREATE POLICY "Users can insert own clicks" ON public.booking_clicks FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_clicks' AND policyname = 'Users can read own clicks') THEN
    CREATE POLICY "Users can read own clicks" ON public.booking_clicks FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_clicks' AND policyname = 'Service role can read all clicks') THEN
    CREATE POLICY "Service role can read all clicks" ON public.booking_clicks FOR SELECT USING (true);
  END IF;
END $$;
