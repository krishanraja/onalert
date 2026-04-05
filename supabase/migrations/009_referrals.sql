-- Phase 4: Referral program + predictions + organizations

-- Referral code on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := substr(md5(NEW.id::text || now()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- Referrals tracking
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid REFERENCES auth.users(id),
  referred_id uuid REFERENCES auth.users(id),
  discount_applied boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Slot predictions
CREATE TABLE IF NOT EXISTS public.slot_predictions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id integer NOT NULL,
  service_type text NOT NULL,
  predicted_day text NOT NULL,
  probability float NOT NULL,
  calculated_at timestamptz DEFAULT now()
);

ALTER TABLE public.slot_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read predictions" ON public.slot_predictions
  FOR SELECT USING (true);
