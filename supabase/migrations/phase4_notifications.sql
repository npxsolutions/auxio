-- =============================================================================
-- Phase 4 — In-app notifications (MVP).
-- =============================================================================
--
-- Org-scoped notifications surface. Retention triggers (stockout risk, feed
-- rejection, account-health drop, payout anomaly) write rows here; the bell
-- icon in AppSidebar polls /api/notifications for unread count.
--
-- `kind` is a stable machine key (e.g. 'stockout_risk') so clients can route
-- on it. `data` is jsonb for the type-specific payload the UI uses to render
-- a playbook link or drill-down.
--
-- `target_user_id` is optional — null means the notification is for anyone in
-- the org with a role that qualifies. Set it to a specific user_id for
-- personal notifications (e.g. "Your teammate accepted the invite").
--
-- `dedupe_key` + a unique partial index prevents re-notifying on the same
-- condition within a retention-scan run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  target_user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind             text NOT NULL,                    -- 'stockout_risk', 'feed_rejection', 'invite_accepted', ...
  severity         text NOT NULL DEFAULT 'info'
                    CHECK (severity IN ('info','warn','error')),
  title            text NOT NULL,
  body             text,
  action_url       text,
  data             jsonb DEFAULT '{}'::jsonb,
  dedupe_key       text,
  read_at          timestamptz,
  dismissed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_org_unread_idx
  ON public.notifications (organization_id, created_at DESC)
  WHERE read_at IS NULL AND dismissed_at IS NULL;

CREATE INDEX IF NOT EXISTS notifications_user_idx
  ON public.notifications (target_user_id, created_at DESC);

-- One open notification per (org, kind, dedupe_key). A duplicate trigger that
-- fires while the previous is still unread/undismissed is a no-op (23505).
CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_open_idx
  ON public.notifications (organization_id, kind, dedupe_key)
  WHERE dedupe_key IS NOT NULL
    AND read_at IS NULL
    AND dismissed_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
SELECT public.mt_add_org_rls('public.notifications'::regclass);
