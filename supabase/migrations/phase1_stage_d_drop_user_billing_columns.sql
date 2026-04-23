-- =============================================================================
-- Phase 1 — Stage D (final): drop remaining user billing columns.
-- =============================================================================
--
-- After this migration, subscription / plan / trial / lifetime state lives
-- exclusively on public.organizations. Readers that previously hit
-- users.plan / users.subscription_status / users.billing_interval /
-- users.trial_ends_at / users.lifetime_purchased_at have been migrated in the
-- same deploy.
--
-- Preserved on users (still valid):
--   - email_alerts       (user preference, not billing)
--   - min_margin         (user safety rail)
--   - max_acos           (user safety rail)
--   - agent_mode         (user choice)
--   - other profile fields
--
-- Pre-flight: every org whose subscription_status is 'active' / 'trialing' /
-- 'past_due' must have its fields mirrored from the (pre-drop) users row, and
-- the Stage C.4 backfill migration has already done that copy.
--
-- This migration is idempotent — IF EXISTS on every DROP.
-- =============================================================================

ALTER TABLE public.users DROP COLUMN IF EXISTS plan;
ALTER TABLE public.users DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE public.users DROP COLUMN IF EXISTS billing_interval;
ALTER TABLE public.users DROP COLUMN IF EXISTS trial_ends_at;
ALTER TABLE public.users DROP COLUMN IF EXISTS lifetime_purchased_at;
