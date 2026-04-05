-- Phase 2: Slot history for analytics and predictions

CREATE TABLE IF NOT EXISTS public.slot_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id integer NOT NULL,
  service_type text NOT NULL,
  slot_timestamp timestamptz NOT NULL,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  gone_at timestamptz,
  UNIQUE (location_id, service_type, slot_timestamp)
);

CREATE INDEX IF NOT EXISTS idx_slot_history_location ON public.slot_history(location_id, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_slot_history_gone ON public.slot_history(gone_at) WHERE gone_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_slot_history_service ON public.slot_history(service_type, location_id);

ALTER TABLE public.slot_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read slot history" ON public.slot_history
  FOR SELECT USING (true);
