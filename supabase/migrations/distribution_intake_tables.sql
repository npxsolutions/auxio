-- Distribution intake tables: partner applications, affiliate applications, changelog subscribers.
-- Public-facing forms insert via anon key; reads restricted to service role.
-- Applied via Supabase MCP on 2026-04-13.

create extension if not exists pgcrypto;

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  company text,
  website text,
  country text,
  role text,
  tier text check (tier in ('registered','silver','gold','platinum','custom')) default 'registered',
  partner_type text,
  estimated_accounts integer,
  notes text,
  utm jsonb,
  status text not null default 'new' check (status in ('new','reviewing','approved','rejected','archived')),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists partner_applications_email_idx on public.partner_applications (email);
create index if not exists partner_applications_status_idx on public.partner_applications (status);
create index if not exists partner_applications_created_at_idx on public.partner_applications (created_at desc);

create table if not exists public.affiliate_applications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  audience_type text,
  audience_size integer,
  url text,
  country text,
  payout_method text check (payout_method in ('stripe','wise','paypal','other')) default 'stripe',
  notes text,
  utm jsonb,
  status text not null default 'new' check (status in ('new','reviewing','approved','rejected','archived')),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_applications_email_idx on public.affiliate_applications (email);
create index if not exists affiliate_applications_status_idx on public.affiliate_applications (status);
create index if not exists affiliate_applications_created_at_idx on public.affiliate_applications (created_at desc);

create table if not exists public.changelog_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  confirmed boolean not null default false,
  confirmation_token uuid default gen_random_uuid(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  utm jsonb,
  created_at timestamptz not null default now()
);

create index if not exists changelog_subscribers_confirmed_idx on public.changelog_subscribers (confirmed) where unsubscribed_at is null;
create index if not exists changelog_subscribers_created_at_idx on public.changelog_subscribers (created_at desc);

-- RLS: enable everywhere, allow anon INSERT, no public SELECT (service role only reads).

alter table public.partner_applications enable row level security;
alter table public.affiliate_applications enable row level security;
alter table public.changelog_subscribers enable row level security;

drop policy if exists "anon insert partner applications" on public.partner_applications;
create policy "anon insert partner applications" on public.partner_applications
  for insert to anon, authenticated with check (true);

drop policy if exists "anon insert affiliate applications" on public.affiliate_applications;
create policy "anon insert affiliate applications" on public.affiliate_applications
  for insert to anon, authenticated with check (true);

drop policy if exists "anon insert changelog subscribers" on public.changelog_subscribers;
create policy "anon insert changelog subscribers" on public.changelog_subscribers
  for insert to anon, authenticated with check (true);

drop policy if exists "anon update own changelog subscription by token" on public.changelog_subscribers;
create policy "anon update own changelog subscription by token" on public.changelog_subscribers
  for update to anon, authenticated using (true) with check (true);

comment on table public.partner_applications is 'Public partner-program applications from /partners. Inserts public; reads service-role only.';
comment on table public.affiliate_applications is 'Public affiliate-program applications from /affiliates. Inserts public; reads service-role only.';
comment on table public.changelog_subscribers is 'Public changelog email list from /changelog subscribe block. Double-opt-in via confirmation_token.';
