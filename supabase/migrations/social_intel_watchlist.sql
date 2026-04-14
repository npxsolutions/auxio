-- ============================================================
--  Social Intelligence Watchlist
--  Adds scheduled re-ingestion of tracked keywords per user.
-- ============================================================

create table if not exists public.si_watchlist (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  keyword               text not null,
  platforms             text[] not null default '{tiktok,instagram,youtube}',
  frequency_minutes     integer not null default 1440,
  max_items             integer not null default 50,
  active                boolean not null default true,
  last_run_at           timestamptz,
  last_run_job_id       uuid,
  last_error            text,
  consecutive_failures  integer not null default 0,
  created_at            timestamptz not null default now()
);

-- Claim ordering: "never run" first, then oldest last_run_at.
create index if not exists si_watchlist_claim_idx
  on public.si_watchlist (active, last_run_at nulls first);

-- One watch per keyword per user.
create unique index if not exists si_watchlist_user_keyword_uk
  on public.si_watchlist (user_id, keyword);

-- Dedupe constraint on si_posts so concurrent ingests don't create duplicates.
-- si_posts already has id (text) as PK which is the platform-native id; but it
-- is not scoped per user+platform. Add a composite unique key to be safe.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'si_posts_user_external_platform_uk'
  ) then
    -- Safe to add: (user_id, id, platform) is a superset of PK(id) so values remain unique.
    alter table public.si_posts
      add constraint si_posts_user_external_platform_uk unique (user_id, id, platform);
  end if;
end$$;

alter table public.si_watchlist enable row level security;

drop policy if exists "si_watchlist_select_own" on public.si_watchlist;
drop policy if exists "si_watchlist_insert_own" on public.si_watchlist;
drop policy if exists "si_watchlist_update_own" on public.si_watchlist;
drop policy if exists "si_watchlist_delete_own" on public.si_watchlist;

create policy "si_watchlist_select_own"
  on public.si_watchlist for select
  using (auth.uid() = user_id);

create policy "si_watchlist_insert_own"
  on public.si_watchlist for insert
  with check (auth.uid() = user_id);

create policy "si_watchlist_update_own"
  on public.si_watchlist for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "si_watchlist_delete_own"
  on public.si_watchlist for delete
  using (auth.uid() = user_id);
