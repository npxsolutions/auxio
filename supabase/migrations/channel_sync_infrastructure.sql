-- Channel sync infrastructure — applied via MCP apply_migration on project oiywxhmhabqjvswdwrzc
-- Adds scheduling/retry columns to sync_jobs, introduces dead-letter sync_failures,
-- and adds channels.metadata for per-shop sync cursors.

ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 100;
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS scheduled_for timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS backoff_until timestamptz;
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS channel_type text;
CREATE INDEX IF NOT EXISTS sync_jobs_claim_idx ON public.sync_jobs (status, scheduled_for, priority);

CREATE TABLE IF NOT EXISTS public.sync_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel_type text NOT NULL,
  job_type text NOT NULL,
  error_message text,
  payload jsonb,
  attempts integer NOT NULL DEFAULT 1,
  first_failed_at timestamptz NOT NULL DEFAULT now(),
  last_failed_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS sync_failures_user_idx ON public.sync_failures (user_id, channel_type, resolved_at);
ALTER TABLE public.sync_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_failures_owner_select" ON public.sync_failures;
CREATE POLICY "sync_failures_owner_select" ON public.sync_failures
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sync_failures_owner_update" ON public.sync_failures;
CREATE POLICY "sync_failures_owner_update" ON public.sync_failures
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
