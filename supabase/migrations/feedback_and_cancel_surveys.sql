-- feedback_and_cancel_surveys: NPS, page feedback, cancel surveys
create table if not exists public.nps_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  score integer not null check (score between 0 and 10),
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists nps_responses_user_idx on public.nps_responses(user_id);

create table if not exists public.page_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  route text not null,
  sentiment text not null check (sentiment in ('up','down')),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists page_feedback_route_idx on public.page_feedback(route);
create index if not exists page_feedback_created_idx on public.page_feedback(created_at desc);

create table if not exists public.cancel_surveys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reason text not null,
  detail text,
  save_offered text,
  save_accepted boolean default false,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cancel_surveys_user_idx on public.cancel_surveys(user_id);

alter table public.nps_responses enable row level security;
alter table public.page_feedback enable row level security;
alter table public.cancel_surveys enable row level security;

drop policy if exists "users insert own nps" on public.nps_responses;
create policy "users insert own nps" on public.nps_responses for insert with check (auth.uid() = user_id);
drop policy if exists "users select own nps" on public.nps_responses;
create policy "users select own nps" on public.nps_responses for select using (auth.uid() = user_id);

drop policy if exists "anyone insert page feedback" on public.page_feedback;
create policy "anyone insert page feedback" on public.page_feedback for insert with check (true);

drop policy if exists "users insert own cancel" on public.cancel_surveys;
create policy "users insert own cancel" on public.cancel_surveys for insert with check (auth.uid() = user_id);
drop policy if exists "users select own cancel" on public.cancel_surveys;
create policy "users select own cancel" on public.cancel_surveys for select using (auth.uid() = user_id);
