-- =============================================================================
-- Phase 1 — Stage D (part 2): drop user Stripe linkage columns.
-- =============================================================================
--
-- After Stage C.4 all Stripe writes route through `organizations`. We kept two
-- compat shims on `users` during the transition:
--
--   - `stripe_customer_id` — deprecated, readers migrated to org.stripe_customer_id
--   - `stripe_subscription_id` — deprecated, readers migrated to org.stripe_subscription_id
--
-- `plan`, `subscription_status`, `billing_interval`, `trial_ends_at`, and
-- `lifetime_purchased_at` are KEPT on users for now — the admin metrics page,
-- AppSidebar plan badge, and enrichment quota all still read from users. A
-- later migration will drop those once those readers migrate to the org row.
--
-- PRE-FLIGHT:
--   1. phase1_stage_d_drop_user_policies.sql applied (Stage D RLS cutover)
--   2. /api/stripe/webhook has been running org-only for 30 days with no
--      failures visible in Sentry / the stripe_webhook_events ledger.
--   3. `SELECT count(*) FROM public.users WHERE stripe_customer_id IS NOT NULL
--        AND id NOT IN (SELECT owner_user_id FROM public.organizations
--                        WHERE stripe_customer_id IS NOT NULL)` = 0
--      (every live stripe_customer_id on users is mirrored on orgs).
--
-- This migration is idempotent — IF EXISTS on every DROP.
-- =============================================================================

BEGIN;

-- Sanity: abort if any user has a stripe_customer_id with no matching org row.
DO $$
DECLARE
  orphans int;
BEGIN
  SELECT COUNT(*)
    INTO orphans
    FROM public.users u
   WHERE u.stripe_customer_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.organizations o
        WHERE o.owner_user_id = u.id
          AND o.stripe_customer_id = u.stripe_customer_id
     );
  IF orphans > 0 THEN
    RAISE EXCEPTION 'Aborting — % users have stripe_customer_id not mirrored on any org', orphans;
  END IF;
END $$;

ALTER TABLE public.users DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS stripe_subscription_id;

COMMIT;

-- =============================================================================
-- Deferred — a later migration removes these once the remaining readers migrate:
--   - users.plan                    (AppSidebar, admin metrics, enrichment quota)
--   - users.subscription_status     (admin metrics, usage cron)
--   - users.billing_interval        (used by lifecycle email copy)
--   - users.trial_ends_at           (trial banner)
--   - users.lifetime_purchased_at   (used by cron report-usage)
-- =============================================================================
