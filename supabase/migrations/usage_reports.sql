-- Applied to Supabase project oiywxhmhabqjvswdwrzc on 2026-04-13.
-- Tracks daily usage reports pushed to Stripe Billing meters.
-- Idempotent per (user_id, period_end) so a cron retry on the same UTC day
-- is a no-op. Service-role writes; users can read their own history.

create table if not exists public.usage_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start timestamptz not null,
  period_end   timestamptz not null,
  orders_count integer not null default 0,
  listings_count integer not null default 0,
  orders_overage integer not null default 0,
  listings_overage integer not null default 0,
  overage_cents integer not null default 0,
  plan text,
  stripe_orders_usage_record_id   text,
  stripe_listings_usage_record_id text,
  created_at timestamptz not null default now(),
  unique (user_id, period_end)
);

create index if not exists usage_reports_user_id_idx on public.usage_reports(user_id);
create index if not exists usage_reports_period_end_idx on public.usage_reports(period_end desc);

alter table public.usage_reports enable row level security;

drop policy if exists "usage_reports_owner_select" on public.usage_reports;
create policy "usage_reports_owner_select"
  on public.usage_reports for select
  using (auth.uid() = user_id);

-- service_role bypasses RLS; the cron job inserts.
