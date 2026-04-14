-- email_sends: per-(user, template) idempotency ledger for lifecycle emails.
create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  template text not null,
  sent_at timestamptz default now(),
  unique(user_id, template)
);

alter table public.email_sends enable row level security;

-- Service-role only. Anon/authenticated get no access.
create policy "email_sends_service_only_select" on public.email_sends
  for select using (false);
create policy "email_sends_service_only_insert" on public.email_sends
  for insert with check (false);

create index if not exists email_sends_user_template_idx
  on public.email_sends(user_id, template);
