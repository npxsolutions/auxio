-- user_profiles — captured during the post-signup onboarding wizard.
-- One row per Supabase auth user. Populated progressively across 5 steps.
-- Every step saves; drop-off at step 3 still captures steps 1+2.
--
-- Fields for ICP qualification (business, GMV, channels, problem) + B2B
-- legal fields (business name, country, type, company number, VAT/tax ID)
-- + attribution (UTM, source). PE diligence reads country + business-type
-- + tax_id for revenue-recognition compliance.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Step 1 — You
  full_name text,
  role text check (role in (
    'founder_ceo','ops_manager','head_of_ecom','agency','developer','other'
  )),

  -- Step 2 — Your business
  business_name text,
  country text,                -- ISO 3166-1 alpha-2 (e.g. 'GB','US','AU')
  business_type text check (business_type in (
    'limited_company','sole_trader','partnership','plc','non_profit','other'
  )),
  company_number text,         -- e.g. Companies House number, EIN, ABN
  tax_id text,                 -- e.g. VAT number, GST number, ABN tax portion

  -- Step 3 — Your store
  shopify_url text,
  gmv_band text check (gmv_band in (
    'under_10k','10k_100k','100k_500k','500k_plus'
  )),
  current_channels text[],     -- e.g. ARRAY['shopify','ebay','amazon']

  -- Step 4 — Your problem
  primary_problem text check (primary_problem in (
    'feed_errors','pnl_blindness','channel_breadth',
    'listing_mgmt','pricing_rules','category_mapping','other'
  )),
  free_text_context text,      -- verbatim "anything else we should know"

  -- Step 5 — Attribution
  acquisition_source text check (acquisition_source in (
    'app_store','linkedin','google','blog','friend','other'
  )),

  -- Metadata
  onboarding_step int not null default 0,
  onboarding_completed_at timestamptz,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  signup_ip text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_country_idx     on public.user_profiles(country);
create index if not exists user_profiles_gmv_band_idx    on public.user_profiles(gmv_band);
create index if not exists user_profiles_role_idx        on public.user_profiles(role);
create index if not exists user_profiles_acquisition_idx on public.user_profiles(acquisition_source);
create index if not exists user_profiles_completed_idx   on public.user_profiles(onboarding_completed_at) where onboarding_completed_at is not null;

alter table public.user_profiles enable row level security;

-- Users read + write their own profile
drop policy if exists "user_profiles_self_read" on public.user_profiles;
create policy "user_profiles_self_read"
  on public.user_profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_profiles_self_write" on public.user_profiles;
create policy "user_profiles_self_write"
  on public.user_profiles for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at on any write
create or replace function public.user_profiles_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_profiles_touch_updated_at_trig on public.user_profiles;
create trigger user_profiles_touch_updated_at_trig
  before update on public.user_profiles
  for each row execute function public.user_profiles_touch_updated_at();
