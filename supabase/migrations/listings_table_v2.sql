-- listings_table_v2 — operator-grade columns inspired by Linnworks, ChannelAdvisor, Brightpearl,
-- Shopify Admin, Amazon Seller Central, eBay Seller Hub, Etsy, Sellbrite, Skubana, Veeqo.
-- All adds are non-destructive: if not exists + sensible defaults so existing rows are unaffected.

-- Physical / shipping / compliance
alter table public.listings add column if not exists length_mm        integer;
alter table public.listings add column if not exists width_mm         integer;
alter table public.listings add column if not exists height_mm        integer;
alter table public.listings add column if not exists material         text;
alter table public.listings add column if not exists country_of_origin text;
alter table public.listings add column if not exists hs_code          text;

-- Pricing controls (repricer guardrails + external anchors)
alter table public.listings add column if not exists msrp             numeric;
alter table public.listings add column if not exists min_price        numeric;
alter table public.listings add column if not exists max_price        numeric;
alter table public.listings add column if not exists competitor_price numeric;
alter table public.listings add column if not exists fx_currency      text default 'GBP';

-- Economics (derived but materialised for filter/sort speed on 6k+ rows)
alter table public.listings add column if not exists margin_pct        numeric;
alter table public.listings add column if not exists sold_30d          integer not null default 0;
alter table public.listings add column if not exists sell_through_30d  numeric;
alter table public.listings add column if not exists days_of_cover     integer;

-- Channel posture
alter table public.listings add column if not exists channel_count      integer not null default 0;
alter table public.listings add column if not exists primary_channel    text;
alter table public.listings add column if not exists last_sync_at       timestamptz;
alter table public.listings add column if not exists sync_errors_count  integer not null default 0;

-- Media health
alter table public.listings add column if not exists image_count         integer not null default 0;
alter table public.listings add column if not exists image_health_score  integer;

-- Discoverability
alter table public.listings add column if not exists tags               text[] not null default '{}'::text[];
alter table public.listings add column if not exists seo_title          text;
alter table public.listings add column if not exists seo_description    text;

-- Variant / parent / bundle
alter table public.listings add column if not exists parent_listing_id  uuid references public.listings(id) on delete set null;
alter table public.listings add column if not exists variant_axis       jsonb;
alter table public.listings add column if not exists is_bundle          boolean not null default false;
alter table public.listings add column if not exists bundle_components  jsonb;

-- Lifecycle
alter table public.listings add column if not exists first_listed_at    timestamptz;
alter table public.listings add column if not exists last_sold_at       timestamptz;
alter table public.listings add column if not exists supplier_id        uuid references public.suppliers(id) on delete set null;

-- Indexes on columns we'll filter/sort on frequently
create index if not exists idx_listings_user_last_sync   on public.listings(user_id, last_sync_at desc nulls last);
create index if not exists idx_listings_user_margin      on public.listings(user_id, margin_pct);
create index if not exists idx_listings_user_quantity    on public.listings(user_id, quantity);
create index if not exists idx_listings_user_sold_30d    on public.listings(user_id, sold_30d desc);
create index if not exists idx_listings_parent           on public.listings(parent_listing_id);
create index if not exists idx_listings_primary_channel  on public.listings(user_id, primary_channel);
create index if not exists idx_listings_sync_errors      on public.listings(user_id, sync_errors_count) where sync_errors_count > 0;
create index if not exists idx_listings_is_bundle        on public.listings(user_id) where is_bundle = true;
create index if not exists idx_listings_tags             on public.listings using gin(tags);

comment on column public.listings.margin_pct is 'Cached margin % = (price - cost_price) / price * 100. Materialised for sort/filter performance.';
comment on column public.listings.sold_30d is 'Units sold in the last 30 days, updated nightly by sync job.';
comment on column public.listings.channel_count is 'Number of marketplaces this listing is currently live on.';
comment on column public.listings.parent_listing_id is 'For variants: FK to the parent listing. Null for standalone or parent rows.';
