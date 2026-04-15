-- Multi-tenant feed benchmarking foundation (Meridia moat).
-- Aggregated, anonymised rollups + pattern observations for cross-merchant learning.
-- Both tables are service-role only (privacy review required before user exposure).

create table if not exists public.feed_health_rollups (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  channel text not null,
  category_bucket text not null,          -- e.g. 'apparel-mens', 'home-kitchen', 'unknown'
  gmv_band text not null,                  -- 'under_10k', '10k_100k', '100k_500k', '500k_plus'
  listings_total integer not null default 0,
  avg_health_score numeric(5,2),
  avg_errors_per_listing numeric(5,2),
  avg_warnings_per_listing numeric(5,2),
  pct_with_images numeric(5,2),
  pct_with_gtin numeric(5,2),
  pct_with_brand numeric(5,2),
  pct_with_condition numeric(5,2),
  pct_with_category_mapped numeric(5,2),
  pct_with_business_policies numeric(5,2),
  sample_size integer not null,            -- number of distinct users contributing
  computed_at timestamptz default now(),
  unique (period_start, period_end, channel, category_bucket, gmv_band)
);
create index if not exists feed_health_rollups_channel_bucket_band_idx
  on public.feed_health_rollups (channel, category_bucket, gmv_band);

create table if not exists public.feed_pattern_observations (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  category_bucket text not null,
  pattern_kind text not null check (pattern_kind in (
    'title_length', 'image_count', 'bullet_count', 'aspect_completeness',
    'price_position', 'gtin_presence', 'brand_presence'
  )),
  pattern_value text not null,             -- e.g. "title_length:60-80"
  sample_size integer not null,
  outcome_metric text not null,            -- 'publish_success_rate', 'listing_live_duration', 'sync_error_rate'
  outcome_value numeric,
  computed_at timestamptz default now()
);
create index if not exists feed_pattern_observations_lookup_idx
  on public.feed_pattern_observations (channel, category_bucket, pattern_kind);

-- Service-role only; no user-visible reads yet (privacy review before exposing)
alter table public.feed_health_rollups enable row level security;
alter table public.feed_pattern_observations enable row level security;
drop policy if exists "service role only rollups" on public.feed_health_rollups;
create policy "service role only rollups" on public.feed_health_rollups
  for all using (false) with check (false);
drop policy if exists "service role only patterns" on public.feed_pattern_observations;
create policy "service role only patterns" on public.feed_pattern_observations
  for all using (false) with check (false);
