-- ============================================================
--  Social Intelligence Schema
--  Run this in Supabase SQL Editor (Database → SQL Editor)
-- ============================================================

-- ── 1. Posts ────────────────────────────────────────────────
create table if not exists public.si_posts (
  id            text primary key,              -- platform native ID
  user_id       uuid not null references auth.users(id) on delete cascade,
  platform      text not null,                 -- tiktok | instagram | facebook_ad | youtube
  content_type  text,                          -- ugc | product_demo | talking_head | tutorial | list | transformation
  caption       text,
  hook          text,                          -- extracted first sentence / opening
  hook_category text,                          -- curiosity | problem | benefit | shock | story | social_proof
  format        text,                          -- short_form_video | long_form_video | image | carousel | text
  duration_sec  integer,                       -- video duration in seconds
  url           text,
  keyword       text,                          -- search keyword that surfaced this post
  posted_at     timestamptz,
  ingested_at   timestamptz default now(),
  processed     boolean default false,
  raw_data      jsonb                          -- original API payload
);

-- ── 2. Engagements ──────────────────────────────────────────
create table if not exists public.si_engagements (
  id                  bigserial primary key,
  post_id             text not null references public.si_posts(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  likes               bigint default 0,
  shares              bigint default 0,
  saves               bigint default 0,
  comments            bigint default 0,
  views               bigint default 0,
  engagement_rate     numeric(8,4),            -- (likes+shares+saves+comments) / views * 100
  share_rate          numeric(8,4),
  save_rate           numeric(8,4),
  comment_rate        numeric(8,4),
  recorded_at         timestamptz default now()
);

-- ── 3. Ads ──────────────────────────────────────────────────
create table if not exists public.si_ads (
  id              text primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  platform        text not null,
  advertiser      text,
  headline        text,
  body_text       text,
  cta             text,
  spend_min       integer,
  spend_max       integer,
  impressions_min integer,
  impressions_max integer,
  ctr             numeric(6,4),
  start_date      date,
  end_date        date,
  status          text,                       -- active | inactive
  keyword         text,
  ingested_at     timestamptz default now(),
  raw_data        jsonb
);

-- ── 4. Comments ─────────────────────────────────────────────
create table if not exists public.si_comments (
  id              bigserial primary key,
  post_id         text not null references public.si_posts(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  comment_text    text not null,
  sentiment       text,                       -- positive | negative | neutral
  intent          text,                       -- buying_intent | objection | question | praise | complaint
  desire          text,                       -- extracted desire / pain point phrase
  posted_at       timestamptz,
  processed       boolean default false
);

-- ── 5. Hook Patterns (aggregated) ───────────────────────────
create table if not exists public.si_hook_patterns (
  id              bigserial primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  keyword         text not null,
  hook_category   text not null,
  example_hook    text,
  post_count      integer default 0,
  avg_engagement  numeric(8,4),
  avg_share_rate  numeric(8,4),
  avg_save_rate   numeric(8,4),
  top_post_id     text,
  computed_at     timestamptz default now()
);

-- ── 6. Audience Insights (aggregated) ───────────────────────
create table if not exists public.si_insights (
  id              bigserial primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  keyword         text not null,
  insight_type    text not null,              -- desire | pain_point | question | objection | trend
  insight_text    text not null,              -- "Audience wants X" / "Audience struggles with Y"
  evidence_count  integer default 1,
  example_comment text,
  computed_at     timestamptz default now()
);

-- ── 7. Ingest Jobs (async tracking) ─────────────────────────
create table if not exists public.si_jobs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  keyword         text not null,
  platforms       text[] not null,
  status          text default 'queued',     -- queued | running | processing | done | error
  apify_runs      jsonb default '{}',        -- { tiktok: 'runId', instagram: 'runId', ... }
  posts_ingested  integer default 0,
  ads_ingested    integer default 0,
  error           text,
  started_at      timestamptz default now(),
  completed_at    timestamptz
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists si_posts_user_keyword   on public.si_posts(user_id, keyword);
create index if not exists si_posts_platform       on public.si_posts(platform);
create index if not exists si_posts_processed      on public.si_posts(processed) where not processed;
create index if not exists si_engagements_post     on public.si_engagements(post_id);
create index if not exists si_comments_post        on public.si_comments(post_id);
create index if not exists si_comments_processed   on public.si_comments(processed) where not processed;
create index if not exists si_jobs_user_status     on public.si_jobs(user_id, status);

-- ── Row Level Security ───────────────────────────────────────
alter table public.si_posts          enable row level security;
alter table public.si_engagements    enable row level security;
alter table public.si_ads            enable row level security;
alter table public.si_comments       enable row level security;
alter table public.si_hook_patterns  enable row level security;
alter table public.si_insights       enable row level security;
alter table public.si_jobs           enable row level security;

-- RLS: users see only their own data
create policy "si_posts_own"         on public.si_posts         for all using (auth.uid() = user_id);
create policy "si_engagements_own"   on public.si_engagements   for all using (auth.uid() = user_id);
create policy "si_ads_own"           on public.si_ads           for all using (auth.uid() = user_id);
create policy "si_comments_own"      on public.si_comments      for all using (auth.uid() = user_id);
create policy "si_hook_patterns_own" on public.si_hook_patterns for all using (auth.uid() = user_id);
create policy "si_insights_own"      on public.si_insights      for all using (auth.uid() = user_id);
create policy "si_jobs_own"          on public.si_jobs          for all using (auth.uid() = user_id);
