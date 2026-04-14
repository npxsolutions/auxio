-- demo_requests: inbound demo / sales leads from /demo page.
create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  company text,
  role text,
  monthly_gmv text,
  channels text[],
  notes text,
  status text default 'new' check (status in ('new','scheduled','completed','no_show','cancelled')),
  utm jsonb,
  created_at timestamptz default now()
);

alter table public.demo_requests enable row level security;

-- Anon can submit, no-one can read except via service role.
create policy "demo_requests_anon_insert" on public.demo_requests
  for insert with check (true);
create policy "demo_requests_service_select" on public.demo_requests
  for select using (false);

create index if not exists demo_requests_email_idx on public.demo_requests(email);
create index if not exists demo_requests_status_idx on public.demo_requests(status);
create index if not exists demo_requests_created_at_idx on public.demo_requests(created_at desc);
