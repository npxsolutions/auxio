-- users_trial_clarity: add trial_ends_at for trial banner state
alter table public.users add column if not exists trial_ends_at timestamptz;
alter table public.users add column if not exists subscription_status text;
update public.users set subscription_status = coalesce(subscription_status, 'trialing');
alter table public.users alter column subscription_status set default 'trialing';
