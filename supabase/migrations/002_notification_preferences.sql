-- Add notification preference columns to profiles
alter table public.profiles
  add column if not exists email_alerts_enabled boolean not null default true,
  add column if not exists sms_alerts_enabled boolean not null default false;

-- Update RLS policies to allow users to update these new columns
-- (existing update policy already covers: auth.uid() = id)
