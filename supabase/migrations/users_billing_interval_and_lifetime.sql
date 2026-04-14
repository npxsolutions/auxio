-- Applied to Supabase project oiywxhmhabqjvswdwrzc on 2026-04-13.
-- Supports the annual upsell + lifetime-access flow.
-- billing_interval: 'month' | 'year' | 'lifetime' — drives upsell eligibility.
-- stripe_subscription_id: needed to cancel on annual switch.

alter table public.users
  add column if not exists billing_interval text default 'month',
  add column if not exists stripe_subscription_id text,
  add column if not exists lifetime_purchased_at timestamptz;
