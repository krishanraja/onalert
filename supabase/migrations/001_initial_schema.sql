-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  stripe_customer_id text,
  plan text not null default 'free', -- 'free' | 'premium'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Monitors
create table public.monitors (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null default 'appointment',
  config jsonb not null default '{}',
  -- config for appointment: { location_ids: [5140, 5446], service_type: "GE", last_known_slots: {} }
  active boolean default true,
  created_at timestamptz default now(),
  last_checked_at timestamptz,
  last_alert_at timestamptz
);

-- Alerts
create table public.alerts (
  id uuid default uuid_generate_v4() primary key,
  monitor_id uuid references public.monitors(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  payload jsonb not null,
  -- payload: { location_id, location_name, slot_timestamp, book_url, service_type, narrative }
  channel text not null default 'email', -- 'email' | 'sms'
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Scrape logs
create table public.scrape_logs (
  id uuid default uuid_generate_v4() primary key,
  location_id integer,
  service_type text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  slots_found integer default 0,
  new_alerts_fired integer default 0,
  error text
);

-- Indexes
create index idx_monitors_user_id on public.monitors(user_id);
create index idx_monitors_active on public.monitors(active) where active = true;
create index idx_alerts_user_id on public.alerts(user_id);
create index idx_alerts_created_at on public.alerts(created_at desc);
create index idx_alerts_monitor_id on public.alerts(monitor_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.monitors enable row level security;
alter table public.alerts enable row level security;
alter table public.scrape_logs enable row level security;

-- Profile policies
create policy "Users can read own profile" on public.profiles 
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles 
  for update using (auth.uid() = id);

-- Monitor policies
create policy "Users can read own monitors" on public.monitors 
  for select using (auth.uid() = user_id);
create policy "Users can insert own monitors" on public.monitors 
  for insert with check (auth.uid() = user_id);
create policy "Users can update own monitors" on public.monitors 
  for update using (auth.uid() = user_id);
create policy "Users can delete own monitors" on public.monitors 
  for delete using (auth.uid() = user_id);

-- Alert policies
create policy "Users can read own alerts" on public.alerts 
  for select using (auth.uid() = user_id);
create policy "Users can update own alerts" on public.alerts 
  for update using (auth.uid() = user_id);

-- Scrape logs (read-only for users, service role can insert)
create policy "Users can read scrape logs" on public.scrape_logs 
  for select using (true);

-- Functions
-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for profiles updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();