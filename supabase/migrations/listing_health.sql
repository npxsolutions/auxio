-- listing_health: persisted pre-flight validation results per (user, listing, channel)
create table if not exists public.listing_health (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  listing_id uuid not null,
  channel text not null,
  health_score integer not null,
  errors_count integer not null default 0,
  warnings_count integer not null default 0,
  issues jsonb,
  last_validated_at timestamptz default now(),
  unique (user_id, listing_id, channel)
);
create index if not exists listing_health_user_score_idx on public.listing_health (user_id, health_score);
create index if not exists listing_health_user_channel_errors_idx on public.listing_health (user_id, channel) where errors_count > 0;
alter table public.listing_health enable row level security;
drop policy if exists "users select own listing_health" on public.listing_health;
create policy "users select own listing_health" on public.listing_health for select using (auth.uid() = user_id);
