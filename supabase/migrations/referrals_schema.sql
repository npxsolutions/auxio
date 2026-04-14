-- Referral program: codes, referrals, credits
create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_referral_codes_code on public.referral_codes(code);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null,
  referred_user_id uuid,
  referred_email text,
  code text not null,
  signup_at timestamptz,
  first_payment_at timestamptz,
  status text not null default 'pending' check (status in ('pending','signed_up','paid','credited','void')),
  credit_amount_cents integer not null default 5000,
  discount_applied text,
  created_at timestamptz not null default now()
);
create index if not exists idx_referrals_referrer on public.referrals(referrer_user_id);
create index if not exists idx_referrals_status on public.referrals(status);
create unique index if not exists uq_referrals_referred_user on public.referrals(referred_user_id) where referred_user_id is not null;

create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount_cents integer not null,
  source text not null,
  source_ref text,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_credits_user_applied on public.user_credits(user_id, applied);
create unique index if not exists uq_user_credits_source_ref on public.user_credits(source, source_ref) where source_ref is not null;

-- RLS
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.user_credits enable row level security;

drop policy if exists referral_codes_select_own on public.referral_codes;
create policy referral_codes_select_own on public.referral_codes for select using (auth.uid() = user_id);

drop policy if exists referrals_select_own on public.referrals;
create policy referrals_select_own on public.referrals for select using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

drop policy if exists user_credits_select_own on public.user_credits;
create policy user_credits_select_own on public.user_credits for select using (auth.uid() = user_id);
-- Writes restricted to service role (bypasses RLS). No insert/update/delete policies defined for anon/authenticated.
