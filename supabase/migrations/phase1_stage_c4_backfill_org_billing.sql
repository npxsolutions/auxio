-- =============================================================================
-- Phase 1 / Stage C.4 — Backfill org billing from users
-- =============================================================================
--
-- The `organizations` table (added in Stage A) already has all billing
-- columns: plan, subscription_status, stripe_customer_id,
-- stripe_subscription_id, billing_interval, trial_ends_at, lifetime_purchased_at.
--
-- Stage A backfill created a personal org per user (slug 'u-<uid>'). This
-- migration copies the user's current billing state into their personal org so
-- the Stripe webhook can cut over to org-scoped lookups without a cold start.
--
-- Safe to re-run — UPDATE is idempotent; DO NOT overwrite an org that has
-- already been edited manually (check via updated_at heuristic).
-- =============================================================================

BEGIN;

-- Copy snapshot from users into each user's personal org.
-- We only touch rows whose stripe_customer_id is still NULL to avoid clobbering
-- any manual edits or subsequent webhook updates.
UPDATE public.organizations AS o
   SET plan                   = u.plan,
       subscription_status    = u.subscription_status,
       stripe_customer_id     = u.stripe_customer_id,
       stripe_subscription_id = u.stripe_subscription_id,
       billing_interval       = COALESCE(u.billing_interval, o.billing_interval),
       trial_ends_at          = u.trial_ends_at,
       lifetime_purchased_at  = u.lifetime_purchased_at,
       updated_at             = now()
  FROM public.users AS u
 WHERE o.owner_user_id = u.id
   AND o.slug LIKE 'u-%'
   AND o.stripe_customer_id IS NULL;

-- Sanity: no duplicate stripe_customer_id across orgs (the UNIQUE index on
-- organizations.stripe_customer_id enforces this — this SELECT should return 0).
DO $$
DECLARE
  dup_count int;
BEGIN
  SELECT COUNT(*)
    INTO dup_count
    FROM (
      SELECT stripe_customer_id
        FROM public.organizations
       WHERE stripe_customer_id IS NOT NULL
       GROUP BY stripe_customer_id
      HAVING COUNT(*) > 1
    ) dupes;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'duplicate stripe_customer_id across organizations (%s groups) — manual reconciliation required', dup_count;
  END IF;
END $$;

-- Log what we did (so ops can diff the two sources before we cut over).
CREATE TABLE IF NOT EXISTS public.billing_backfill_audit (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at         timestamptz NOT NULL DEFAULT now(),
  orgs_updated   int NOT NULL,
  users_with_sub int NOT NULL
);

INSERT INTO public.billing_backfill_audit (orgs_updated, users_with_sub)
VALUES (
  (SELECT COUNT(*) FROM public.organizations
    WHERE slug LIKE 'u-%' AND stripe_customer_id IS NOT NULL),
  (SELECT COUNT(*) FROM public.users WHERE stripe_customer_id IS NOT NULL)
);

COMMIT;

-- =============================================================================
-- Stage C.4 follow-up plan (code side)
-- =============================================================================
-- 1. Stripe webhook: resolve org by stripe_customer_id (orgs table) instead of
--    user by stripe_customer_id (users table). Fall back to user-based lookup
--    for a deprecation window if the org row is missing.
-- 2. Checkout routes: add metadata.organization_id to every Checkout Session.
--    On session.completed, webhook reads that metadata and attaches
--    customer_id to the named org (not the user).
-- 3. Billing portal: read org.stripe_customer_id, not user.stripe_customer_id.
-- 4. Usage reports: scope by organization_id once orgs are the billing unit.
-- 5. DEPRECATE: after the webhook has been running org-scoped for 30 days and
--    rls_migration_audit stays at zero, drop the users.stripe_* columns.
-- =============================================================================
