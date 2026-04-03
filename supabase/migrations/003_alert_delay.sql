-- Add delay_until column for free-tier alert delays
-- NULL = send immediately, non-null = wait until this timestamp
alter table public.alerts
  add column delay_until timestamptz default null;

-- Index for the delayed alert processor CRON query
create index idx_alerts_delay_pending
  on public.alerts (delay_until)
  where delay_until is not null and delivered_at is null;
