-- Applied to Supabase project oiywxhmhabqjvswdwrzc on 2026-04-13.
-- Backs the DSAR "Delete account" flow (POST /api/data/delete).
-- Rows are queued here; actual purging happens out-of-band behind an admin gate.

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'pending' check (status in ('pending','processing','completed','cancelled'))
);

create index if not exists deletion_requests_user_id_idx on public.deletion_requests(user_id);
create index if not exists deletion_requests_status_idx on public.deletion_requests(status);

alter table public.deletion_requests enable row level security;

drop policy if exists "deletion_requests_owner_select" on public.deletion_requests;
create policy "deletion_requests_owner_select"
  on public.deletion_requests for select
  using (auth.uid() = user_id);

drop policy if exists "deletion_requests_owner_insert" on public.deletion_requests;
create policy "deletion_requests_owner_insert"
  on public.deletion_requests for insert
  with check (auth.uid() = user_id);

-- service_role bypasses RLS; the cron/admin job reads + updates status.
