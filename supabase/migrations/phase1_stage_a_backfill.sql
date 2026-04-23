-- =============================================================================
-- Phase 1 — Stage A: Backfill.
-- =============================================================================
--
-- Populates the tenancy tables + organization_id on every scoped row.
--
-- Ordering:
--   1. Create one personal org per existing auth.users row
--   2. Create organization_members row for each owner
--   3. Backfill organization_id on each scoped table by joining through user_id
--   4. Verify zero NULLs on every scoped table
--   5. ALTER ... SET NOT NULL on organization_id (gated on verification)
--
-- Idempotent. Safe to re-run. Each UPDATE uses WHERE organization_id IS NULL
-- so subsequent invocations are no-ops on already-backfilled rows.
--
-- PRE-FLIGHT: phase1_stage_a_multitenancy.sql MUST have been applied first.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Create one personal organization per auth.users row.
-- -----------------------------------------------------------------------------
-- Slug convention: 'u-' || first 8 chars of user id. The partial unique index
-- organizations_one_personal_per_owner prevents duplicates on re-run.
-- Name falls back through: business_name → full_name → email → generic.
-- -----------------------------------------------------------------------------

INSERT INTO public.organizations (
  slug,
  name,
  owner_user_id,
  plan,
  subscription_status,
  stripe_subscription_id,
  billing_interval,
  trial_ends_at,
  lifetime_purchased_at
)
SELECT
  'u-' || substr(u.id::text, 1, 8),
  COALESCE(p.business_name, p.full_name, u.email, 'Personal workspace'),
  u.id,
  COALESCE(pu.plan, 'trialing'),
  COALESCE(pu.subscription_status, 'trialing'),
  pu.stripe_subscription_id,
  COALESCE(pu.billing_interval, 'month'),
  pu.trial_ends_at,
  pu.lifetime_purchased_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.user_id = u.id
LEFT JOIN public.users pu ON pu.id = u.id
ON CONFLICT DO NOTHING;  -- caught by organizations_one_personal_per_owner


-- -----------------------------------------------------------------------------
-- 2. Create organization_members row (role = 'owner') for each owner.
-- -----------------------------------------------------------------------------

INSERT INTO public.organization_members (organization_id, user_id, role, accepted_at)
SELECT o.id, o.owner_user_id, 'owner', now()
FROM public.organizations o
WHERE o.slug LIKE 'u-%'
ON CONFLICT (organization_id, user_id) DO NOTHING;


-- -----------------------------------------------------------------------------
-- 3. Backfill organization_id on every scoped table.
-- -----------------------------------------------------------------------------
-- Helper: fill org_id from a direct user_id column.
-- Most scoped tables use this pattern; special cases (referrals, sync_jobs)
-- are handled inline below the helper call.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mt_backfill_org_id_from_user_id(tbl regclass)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  rows_updated bigint;
  tbl_name     text := tbl::text;
  has_user_id  boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = split_part(tbl_name, '.', 1)
      AND table_name = split_part(tbl_name, '.', 2)
      AND column_name = 'user_id'
  ) INTO has_user_id;

  IF NOT has_user_id THEN
    RAISE NOTICE 'skipped %: no user_id column', tbl_name;
    RETURN 0;
  END IF;

  EXECUTE format(
    'UPDATE %s t
     SET organization_id = o.id
     FROM public.organizations o
     WHERE t.user_id = o.owner_user_id
       AND o.slug LIKE %L
       AND t.organization_id IS NULL',
    tbl_name, 'u-%'
  );

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE 'backfilled %: % rows', tbl_name, rows_updated;
  RETURN rows_updated;
END;
$$;

-- Run backfill across all scoped tables that exist.
DO $$
DECLARE
  tbl text;
  scoped_tables text[] := ARRAY[
    'public.user_profiles',
    'public.email_sends',
    'public.deletion_requests',
    'public.referral_codes',
    'public.user_credits',
    'public.nps_responses',
    'public.cancel_surveys',
    'public.feedback_page',
    'public.listing_health',
    'public.listings',
    'public.listing_channel_groups',
    'public.listing_channel_aspects',
    'public.listing_channels',
    'public.channels',
    'public.transactions',
    'public.agent_pending_actions',
    'public.sync_failures',
    'public.feed_rules',
    'public.usage_reports',
    'public.supplier',
    'public.metrics_daily',
    'public.si_posts',
    'public.si_engagements',
    'public.si_ads',
    'public.si_comments',
    'public.si_hook_patterns',
    'public.si_insights',
    'public.si_jobs',
    'public.si_watchlist'
  ];
BEGIN
  FOREACH tbl IN ARRAY scoped_tables LOOP
    IF to_regclass(tbl) IS NOT NULL THEN
      PERFORM public.mt_backfill_org_id_from_user_id(tbl::regclass);
    ELSE
      RAISE NOTICE 'skipped % (table does not exist)', tbl;
    END IF;
  END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 4. Special cases.
-- -----------------------------------------------------------------------------

-- 4a. referrals — has referrer_user_id + referred_user_id. Org = referrer's org.
DO $$
BEGIN
  IF to_regclass('public.referrals') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'referrals'
         AND column_name = 'referrer_user_id'
     ) THEN
    UPDATE public.referrals r
    SET organization_id = o.id
    FROM public.organizations o
    WHERE r.referrer_user_id = o.owner_user_id
      AND o.slug LIKE 'u-%'
      AND r.organization_id IS NULL;
    RAISE NOTICE 'backfilled public.referrals via referrer_user_id';
  END IF;
END $$;

-- 4b. sync_jobs — no direct user_id. Derive via channels table.
-- If sync_jobs has channel_id (likely), join channels → owner's org.
DO $$
DECLARE
  has_channel_id boolean;
  has_user_id    boolean;
BEGIN
  IF to_regclass('public.sync_jobs') IS NULL THEN
    RAISE NOTICE 'sync_jobs does not exist, skipping';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sync_jobs'
      AND column_name = 'user_id'
  ) INTO has_user_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sync_jobs'
      AND column_name = 'channel_id'
  ) INTO has_channel_id;

  IF has_user_id THEN
    UPDATE public.sync_jobs t
    SET organization_id = o.id
    FROM public.organizations o
    WHERE t.user_id = o.owner_user_id
      AND o.slug LIKE 'u-%'
      AND t.organization_id IS NULL;
    RAISE NOTICE 'backfilled public.sync_jobs via user_id';
  ELSIF has_channel_id THEN
    UPDATE public.sync_jobs t
    SET organization_id = o.id
    FROM public.channels c
    JOIN public.organizations o ON o.owner_user_id = c.user_id AND o.slug LIKE 'u-%'
    WHERE t.channel_id = c.id
      AND t.organization_id IS NULL;
    RAISE NOTICE 'backfilled public.sync_jobs via channel_id→channels.user_id';
  ELSE
    RAISE NOTICE 'sync_jobs has neither user_id nor channel_id — manual backfill required';
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 5. Verification.
-- -----------------------------------------------------------------------------
-- Raises an EXCEPTION if any scoped table still has NULL organization_id. The
-- SET NOT NULL step below only runs on a clean verification pass.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  tbl           text;
  null_count    bigint;
  total_nulls   bigint := 0;
  scoped_tables text[] := ARRAY[
    'public.user_profiles',
    'public.email_sends',
    'public.deletion_requests',
    'public.referral_codes',
    'public.referrals',
    'public.user_credits',
    'public.nps_responses',
    'public.cancel_surveys',
    'public.feedback_page',
    'public.listing_health',
    'public.listings',
    'public.listing_channel_groups',
    'public.listing_channel_aspects',
    'public.listing_channels',
    'public.channels',
    'public.transactions',
    'public.agent_pending_actions',
    'public.sync_failures',
    'public.sync_jobs',
    'public.feed_rules',
    'public.usage_reports',
    'public.supplier',
    'public.metrics_daily',
    'public.si_posts',
    'public.si_engagements',
    'public.si_ads',
    'public.si_comments',
    'public.si_hook_patterns',
    'public.si_insights',
    'public.si_jobs',
    'public.si_watchlist'
  ];
BEGIN
  FOREACH tbl IN ARRAY scoped_tables LOOP
    IF to_regclass(tbl) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM %s WHERE organization_id IS NULL', tbl)
        INTO null_count;
      IF null_count > 0 THEN
        RAISE WARNING '% has % rows with NULL organization_id', tbl, null_count;
        total_nulls := total_nulls + null_count;
      END IF;
    END IF;
  END LOOP;

  IF total_nulls > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % rows with NULL organization_id across scoped tables. Fix before running SET NOT NULL step.', total_nulls;
  ELSE
    RAISE NOTICE 'Verification passed: all scoped tables have zero NULL organization_id';
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 6. Apply NOT NULL constraint on organization_id for every scoped table.
-- -----------------------------------------------------------------------------
-- Only reached if the verification block above didn't RAISE EXCEPTION. Future
-- writes that omit organization_id will fail fast at the database layer.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mt_set_org_id_not_null(tbl regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  tbl_name text := tbl::text;
  is_nullable text;
BEGIN
  SELECT c.is_nullable INTO is_nullable
  FROM information_schema.columns c
  WHERE c.table_schema = split_part(tbl_name, '.', 1)
    AND c.table_name = split_part(tbl_name, '.', 2)
    AND c.column_name = 'organization_id';

  IF is_nullable = 'YES' THEN
    EXECUTE format('ALTER TABLE %s ALTER COLUMN organization_id SET NOT NULL', tbl_name);
    RAISE NOTICE '% SET NOT NULL', tbl_name;
  END IF;
END;
$$;

DO $$
DECLARE
  tbl text;
  scoped_tables text[] := ARRAY[
    'public.user_profiles',
    'public.email_sends',
    'public.deletion_requests',
    'public.referral_codes',
    'public.referrals',
    'public.user_credits',
    'public.nps_responses',
    'public.cancel_surveys',
    'public.feedback_page',
    'public.listing_health',
    'public.listings',
    'public.listing_channel_groups',
    'public.listing_channel_aspects',
    'public.listing_channels',
    'public.channels',
    'public.transactions',
    'public.agent_pending_actions',
    'public.sync_failures',
    'public.sync_jobs',
    'public.feed_rules',
    'public.usage_reports',
    'public.supplier',
    'public.metrics_daily',
    'public.si_posts',
    'public.si_engagements',
    'public.si_ads',
    'public.si_comments',
    'public.si_hook_patterns',
    'public.si_insights',
    'public.si_jobs',
    'public.si_watchlist'
  ];
BEGIN
  FOREACH tbl IN ARRAY scoped_tables LOOP
    IF to_regclass(tbl) IS NOT NULL THEN
      PERFORM public.mt_set_org_id_not_null(tbl::regclass);
    END IF;
  END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 7. Final summary.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  org_count         bigint;
  member_count      bigint;
  auth_user_count   bigint;
BEGIN
  SELECT count(*) INTO org_count FROM public.organizations WHERE slug LIKE 'u-%';
  SELECT count(*) INTO member_count FROM public.organization_members WHERE role = 'owner';
  SELECT count(*) INTO auth_user_count FROM auth.users;

  RAISE NOTICE '=== Stage A backfill summary ===';
  RAISE NOTICE 'auth.users: %', auth_user_count;
  RAISE NOTICE 'personal organizations (slug u-*): %', org_count;
  RAISE NOTICE 'owner memberships: %', member_count;

  IF org_count <> auth_user_count THEN
    RAISE WARNING 'Mismatch: % auth users vs % personal orgs. Investigate before Stage B.',
      auth_user_count, org_count;
  END IF;

  IF member_count <> org_count THEN
    RAISE WARNING 'Mismatch: % personal orgs vs % owner memberships. Investigate.',
      org_count, member_count;
  END IF;
END $$;


-- =============================================================================
-- Stage A backfill complete.
-- =============================================================================
--
-- State after successful run:
--   - Every auth.users row has a matching organizations row (slug 'u-*')
--   - Every org has an owner in organization_members (role = 'owner')
--   - Every scoped table has non-null organization_id on every row
--   - App still runs under user-scoped RLS (org tables are unreferenced in code)
--
-- Next: phase1_stage_b_rls.sql — add org-scoped RLS policies alongside the
-- existing user-scoped ones. Dual-enforcement period begins.
-- =============================================================================
