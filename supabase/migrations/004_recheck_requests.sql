-- Slot re-check requests for paid users
CREATE TABLE IF NOT EXISTS recheck_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id uuid NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id integer NOT NULL,
  slot_timestamp text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'gone', 'error')),
  created_at timestamptz DEFAULT now(),
  checked_at timestamptz
);

-- Index for CRON processing
CREATE INDEX idx_recheck_pending ON recheck_requests (status) WHERE status = 'pending';
CREATE INDEX idx_recheck_user ON recheck_requests (user_id);

-- RLS
ALTER TABLE recheck_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recheck requests"
  ON recheck_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recheck requests"
  ON recheck_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
