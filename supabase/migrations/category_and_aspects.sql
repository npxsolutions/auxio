-- Bundle B: category intelligence + aspects enrichment
create table if not exists public.listing_channel_aspects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  listing_id uuid not null,
  channel text not null,
  aspects jsonb not null default '{}'::jsonb,
  category_id text,
  category_path text,
  category_confidence numeric,
  category_source text,
  last_enriched_at timestamptz default now(),
  unique (user_id, listing_id, channel)
);
create index if not exists listing_channel_aspects_user_idx on public.listing_channel_aspects (user_id);
alter table public.listing_channel_aspects enable row level security;
drop policy if exists "users select own aspects" on public.listing_channel_aspects;
create policy "users select own aspects" on public.listing_channel_aspects for select using (auth.uid() = user_id);

create table if not exists public.category_suggestions_cache (
  id uuid primary key default gen_random_uuid(),
  input_hash text not null unique,
  suggestions jsonb not null,
  created_at timestamptz default now()
);
alter table public.category_suggestions_cache enable row level security;
drop policy if exists "no direct access" on public.category_suggestions_cache;
create policy "no direct access" on public.category_suggestions_cache for select using (false);
