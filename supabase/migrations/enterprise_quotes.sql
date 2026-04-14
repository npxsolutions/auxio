-- Applied to Supabase project oiywxhmhabqjvswdwrzc on 2026-04-13.
-- Enterprise quote-request intake. Anonymous users can POST a quote form;
-- only admins (service role) read. Mirrors partner_applications / demo_requests pattern.

create table if not exists public.enterprise_quotes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  work_email text not null,
  company text,
  role text,
  hq_region text,
  annual_gmv_band text,
  channels_count text,
  main_challenge text,
  preferred_start text,
  status text not null default 'new' check (status in ('new','reviewing','quoted','won','lost','archived')),
  admin_notes text,
  utm jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enterprise_quotes_status_idx on public.enterprise_quotes(status);
create index if not exists enterprise_quotes_created_at_idx on public.enterprise_quotes(created_at desc);

alter table public.enterprise_quotes enable row level security;

drop policy if exists "enterprise_quotes_anon_insert" on public.enterprise_quotes;
create policy "enterprise_quotes_anon_insert"
  on public.enterprise_quotes for insert
  to anon, authenticated
  with check (true);

-- Reads are service_role only — admins use the service key, RLS bypasses.
