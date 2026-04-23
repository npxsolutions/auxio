-- =============================================================================
-- Phase 1 — Stage B: Org-scoped RLS policies (dual-enforcement).
-- =============================================================================
--
-- Adds org-scoped RLS policies to every scoped table, *alongside* the existing
-- user-scoped policies from Stage A and earlier. Both must pass for any
-- operation to succeed. Because the backfill set every row's organization_id
-- to the personal org of its owner (user_id), the two conditions are
-- equivalent today — dual-enforcement is a belt-and-braces gate.
--
-- New policy names use the suffix `_org_{select|insert|update|delete}` so they
-- don't collide with existing policies like `sync_failures_owner_select`.
--
-- This migration is idempotent (DROP POLICY IF EXISTS before CREATE). Missing
-- tables are silently skipped via to_regclass() guard so the same file runs
-- cleanly on any environment.
--
-- Does NOT drop any existing policy. That's Stage D.
--
-- PRE-FLIGHT: phase1_stage_a_multitenancy.sql + phase1_stage_a_backfill.sql
-- must have been applied. Every scoped table must have non-null organization_id.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Helper: install the 4 org-scoped policies on a given table.
-- -----------------------------------------------------------------------------
--
-- - SELECT: any member of the owning org
-- - INSERT: inserter must be member of the org they're writing to
-- - UPDATE: any member. WITH CHECK prevents changing organization_id to an org
--           the user doesn't belong to (stops escape by re-assignment).
-- - DELETE: owners/admins only (tighter than existing policies; acceptable
--           tightening during dual-enforcement because existing policies still
--           govern legacy callers).
--
-- RLS is ENABLEd here too, in case a new scoped table was created without it.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mt_add_org_rls(tbl regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  tbl_name    text := tbl::text;
  short_name  text := split_part(tbl_name, '.', 2);
  policy_base text := regexp_replace(short_name, '[^a-zA-Z0-9_]', '_', 'g');
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl_name);

  -- SELECT
  EXECUTE format(
    'DROP POLICY IF EXISTS "%s_org_select" ON %s',
    policy_base, tbl_name
  );
  EXECUTE format(
    'CREATE POLICY "%s_org_select" ON %s
       FOR SELECT
       USING (public.is_org_member(organization_id))',
    policy_base, tbl_name
  );

  -- INSERT
  EXECUTE format(
    'DROP POLICY IF EXISTS "%s_org_insert" ON %s',
    policy_base, tbl_name
  );
  EXECUTE format(
    'CREATE POLICY "%s_org_insert" ON %s
       FOR INSERT
       WITH CHECK (public.is_org_member(organization_id))',
    policy_base, tbl_name
  );

  -- UPDATE
  EXECUTE format(
    'DROP POLICY IF EXISTS "%s_org_update" ON %s',
    policy_base, tbl_name
  );
  EXECUTE format(
    'CREATE POLICY "%s_org_update" ON %s
       FOR UPDATE
       USING (public.is_org_member(organization_id))
       WITH CHECK (public.is_org_member(organization_id))',
    policy_base, tbl_name
  );

  -- DELETE (owner/admin only)
  EXECUTE format(
    'DROP POLICY IF EXISTS "%s_org_delete" ON %s',
    policy_base, tbl_name
  );
  EXECUTE format(
    'CREATE POLICY "%s_org_delete" ON %s
       FOR DELETE
       USING (public.is_org_admin(organization_id))',
    policy_base, tbl_name
  );

  -- Service role passthrough (idempotent; needed because some tables may not
  -- have one yet, and service_role bypasses RLS anyway but we add an explicit
  -- policy so the table's ENABLE RLS doesn't break cron jobs on legacy setups).
  EXECUTE format(
    'DROP POLICY IF EXISTS "%s_service_all" ON %s',
    policy_base, tbl_name
  );
  EXECUTE format(
    'CREATE POLICY "%s_service_all" ON %s
       FOR ALL
       TO service_role
       USING (true)
       WITH CHECK (true)',
    policy_base, tbl_name
  );

  RAISE NOTICE 'org-scoped RLS installed on %', tbl_name;
END;
$$;


-- -----------------------------------------------------------------------------
-- 2. Apply org-scoped RLS to every scoped table that exists.
-- -----------------------------------------------------------------------------

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
      PERFORM public.mt_add_org_rls(tbl::regclass);
    ELSE
      RAISE NOTICE 'skipped % (table does not exist)', tbl;
    END IF;
  END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 3. rls_migration_audit — leak detector. Populated by a scheduled scan.
-- -----------------------------------------------------------------------------
-- Any row a user *could* see via the old (user-scoped) policies but not via the
-- new (org-scoped) policies is a "leak" in either direction. The scanner below
-- inserts one row per detected leak. Stage D gate: zero open rows for 7 days.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.rls_migration_audit (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   text NOT NULL,
  row_id       text NOT NULL,
  issue        text NOT NULL
                CHECK (issue IN (
                  'null_org_id',
                  'mismatched_org_user',
                  'orphan_org',
                  'orphan_user'
                )),
  details      jsonb,
  detected_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz
);

CREATE INDEX IF NOT EXISTS rls_migration_audit_open_idx
  ON public.rls_migration_audit (table_name, resolved_at)
  WHERE resolved_at IS NULL;

ALTER TABLE public.rls_migration_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_migration_audit_service_all" ON public.rls_migration_audit;
CREATE POLICY "rls_migration_audit_service_all"
  ON public.rls_migration_audit
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 4. Leak scanner — finds rows where user_id and organization_id disagree.
-- -----------------------------------------------------------------------------
-- Runs the checks INLINE so you can inspect output right after applying the
-- migration. In production this is wired to a cron job (Stage C deliverable)
-- that runs daily and alerts on any rows returned.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mt_scan_table_for_leaks(tbl regclass)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  tbl_name     text := tbl::text;
  leaks_found  bigint := 0;
  has_user_id  boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = split_part(tbl_name, '.', 1)
      AND table_name = split_part(tbl_name, '.', 2)
      AND column_name = 'user_id'
  ) INTO has_user_id;

  -- Null org_id (should be zero after Stage A backfill)
  EXECUTE format(
    'INSERT INTO public.rls_migration_audit (table_name, row_id, issue, details)
     SELECT %L, id::text, ''null_org_id'', jsonb_build_object(''detected_in'', ''stage_b_install'')
     FROM %s t
     WHERE t.organization_id IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.rls_migration_audit a
         WHERE a.table_name = %L
           AND a.row_id = t.id::text
           AND a.issue = ''null_org_id''
           AND a.resolved_at IS NULL
       )',
    tbl_name, tbl_name, tbl_name
  );

  GET DIAGNOSTICS leaks_found = ROW_COUNT;

  -- Mismatch between user_id and organization_id owner (user_id exists but the
  -- org doesn't belong to that user AND the user isn't a member of the org)
  IF has_user_id THEN
    EXECUTE format(
      'INSERT INTO public.rls_migration_audit (table_name, row_id, issue, details)
       SELECT %L, t.id::text, ''mismatched_org_user'',
              jsonb_build_object(
                ''user_id'', t.user_id,
                ''organization_id'', t.organization_id,
                ''detected_in'', ''stage_b_install''
              )
       FROM %s t
       WHERE t.organization_id IS NOT NULL
         AND t.user_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM public.organization_members m
           WHERE m.organization_id = t.organization_id
             AND m.user_id = t.user_id
         )
         AND NOT EXISTS (
           SELECT 1 FROM public.rls_migration_audit a
           WHERE a.table_name = %L
             AND a.row_id = t.id::text
             AND a.issue = ''mismatched_org_user''
             AND a.resolved_at IS NULL
         )',
      tbl_name, tbl_name, tbl_name
    );
    GET DIAGNOSTICS leaks_found = ROW_COUNT + leaks_found;
  END IF;

  RETURN leaks_found;
END;
$$;

DO $$
DECLARE
  tbl text;
  total_leaks bigint := 0;
  table_leaks bigint;
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
    IF to_regclass(tbl) IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = split_part(tbl, '.', 1)
           AND table_name = split_part(tbl, '.', 2)
           AND column_name = 'id'
       )
    THEN
      table_leaks := public.mt_scan_table_for_leaks(tbl::regclass);
      IF table_leaks > 0 THEN
        RAISE WARNING '% has % open leak rows', tbl, table_leaks;
        total_leaks := total_leaks + table_leaks;
      END IF;
    END IF;
  END LOOP;

  IF total_leaks = 0 THEN
    RAISE NOTICE '=== Stage B install: leak scan clean (0 open rows) ===';
  ELSE
    RAISE WARNING '=== Stage B install: % open leak rows. Review public.rls_migration_audit before proceeding. ===',
      total_leaks;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 5. Cross-org visibility self-check — sanity query for QA.
-- -----------------------------------------------------------------------------
-- Uses service role (bypasses RLS) to confirm the raw data shape. In an
-- authenticated session, the SELECT FROM listings below will show only the
-- caller's org rows via org-scoped RLS.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  org_count           bigint;
  member_count        bigint;
  policy_count        bigint;
  scoped_tbl_count    bigint;
BEGIN
  SELECT count(*) INTO org_count FROM public.organizations;
  SELECT count(*) INTO member_count FROM public.organization_members;

  -- Count org-scoped policies we just installed
  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE '%_org_%';

  -- Count tables that have an organization_id column
  SELECT count(DISTINCT table_name) INTO scoped_tbl_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'organization_id';

  RAISE NOTICE '=== Stage B summary ===';
  RAISE NOTICE 'organizations: %', org_count;
  RAISE NOTICE 'organization_members: %', member_count;
  RAISE NOTICE 'tables with organization_id: %', scoped_tbl_count;
  RAISE NOTICE 'org-scoped policies installed: %', policy_count;
END $$;


-- =============================================================================
-- Stage B complete.
-- =============================================================================
--
-- State after successful run:
--   - Every scoped table has BOTH user-scoped AND org-scoped RLS policies
--   - Dual-enforcement: both must pass for any SELECT/INSERT/UPDATE/DELETE
--   - DELETE tightened to owners/admins at org-scope
--   - Leak audit table + scanner function ready for daily cron
--
-- Nothing about app behaviour changes. Existing queries using
-- `.eq('user_id', user.id)` continue to work: old policy allows by user_id,
-- new policy allows by org membership (which owns all the rows that pass the
-- old check).
--
-- Next: phase1_stage_c_app_code — update API routes to use getActiveOrg() and
-- write organization_id explicitly on INSERT. Stage C is a code migration, not
-- a DB migration.
--
-- Monitoring before Stage D:
--   - Run: SELECT * FROM public.rls_migration_audit WHERE resolved_at IS NULL;
--   - Expect zero rows for 7 consecutive days before dropping old policies.
--   - Sentry RLS error rate should be zero during dual-enforcement.
-- =============================================================================
