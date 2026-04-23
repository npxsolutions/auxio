-- =============================================================================
-- Phase 1 — Stage D: drop legacy user-scoped RLS policies.
-- =============================================================================
--
-- PRE-FLIGHT — DO NOT apply this until all of the following hold:
--   1. Every row in rls_migration_audit has resolved_at IS NOT NULL for 7
--      consecutive days (Stage D gate from phase-1-multitenancy-spec.md).
--   2. Sentry RLS error rate is zero across Stage B + Stage C rollout.
--   3. Stage A.1 backfill (phase1_stage_a1_auxiliary_tables.sql) applied.
--   4. Stage A.1 code deployed (TODOs resolved, writes include organization_id).
--   5. Integration tests (pnpm test:rls) pass against staging.
--
-- What this migration does:
--   Enumerates every scoped table and drops ANY policy on it whose name does
--   NOT follow the Stage B/A.1 convention (`{table}_org_*` or
--   `{table}_service_all`). That removes:
--     - auth.uid() = user_id policies from the original schema
--     - "Users can manage own X" style policies
--     - sync_failures_owner_select / _owner_update
--     - metrics_daily_own
--     - any ad-hoc per-table policy written before multi-tenancy
--
-- What it preserves:
--   - Every `{table}_org_*` policy installed by mt_add_org_rls
--   - Every `{table}_service_all` policy for service role
--   - Policies on tables NOT in the scoped list (marketing_cms, webhook_events_*,
--     stripe_webhook_events, rls_migration_audit, organizations,
--     organization_members, organization_invitations — those have their own
--     separate policies documented in earlier migrations)
--
-- This migration is idempotent — safe to re-run. DROP POLICY IF EXISTS handles
-- the case where a policy was already dropped by hand.
-- =============================================================================

BEGIN;


-- -----------------------------------------------------------------------------
-- 1. Helper: drop every legacy policy on a given scoped table.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mt_drop_legacy_policies(tbl regclass)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  tbl_name     text := tbl::text;
  short_name   text := split_part(tbl_name, '.', 2);
  policy_base  text := regexp_replace(short_name, '[^a-zA-Z0-9_]', '_', 'g');
  dropped      integer := 0;
  p            record;
BEGIN
  FOR p IN
    SELECT policyname
      FROM pg_policies
     WHERE schemaname = split_part(tbl_name, '.', 1)
       AND tablename  = short_name
  LOOP
    -- Keep the five policies installed by mt_add_org_rls.
    IF p.policyname IN (
      policy_base || '_org_select',
      policy_base || '_org_insert',
      policy_base || '_org_update',
      policy_base || '_org_delete',
      policy_base || '_service_all'
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', p.policyname, tbl_name);
    RAISE NOTICE 'dropped legacy policy % on %', p.policyname, tbl_name;
    dropped := dropped + 1;
  END LOOP;

  RETURN dropped;
END;
$$;


-- -----------------------------------------------------------------------------
-- 2. Apply to every scoped table (Stage A + Stage A.1).
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
  total_dropped int := 0;
  tbl_dropped   int;
  scoped_tables text[] := ARRAY[
    -- Stage A
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
    'public.si_watchlist',
    -- Stage A.1
    'public.inventory',
    'public.bundles',
    'public.bundle_items',
    'public.category_mappings',
    'public.channel_sync_state',
    'public.sync_log',
    'public.listing_versions',
    'public.feed_health',
    'public.field_mappings',
    'public.ad_campaigns',
    'public.repricing_rules',
    'public.purchase_orders',
    'public.purchase_order_items',
    'public.suppliers',
    'public.lookup_tables',
    'public.lookup_table_rows',
    'public.api_keys',
    'public.webhooks',
    'public.enrichment_usage',
    'public.agent_action_log',
    'public.ai_insights',
    'public.ai_conversations',
    'public.product_intelligence',
    'public.ppc_keyword_performance',
    'public.orders'
  ];
BEGIN
  FOREACH tbl IN ARRAY scoped_tables LOOP
    IF to_regclass(tbl) IS NOT NULL THEN
      tbl_dropped := public.mt_drop_legacy_policies(tbl::regclass);
      total_dropped := total_dropped + tbl_dropped;
    END IF;
  END LOOP;

  RAISE NOTICE 'Stage D cutover complete — % legacy policies dropped total', total_dropped;
END $$;


-- -----------------------------------------------------------------------------
-- 3. Sanity: every scoped table must now have exactly 5 policies
--    (4 org-scoped + 1 service-role passthrough).
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
  short_name text;
  policy_count int;
  offenders text[] := ARRAY[]::text[];
  scoped_tables text[] := ARRAY[
    'public.user_profiles','public.email_sends','public.deletion_requests',
    'public.referral_codes','public.referrals','public.user_credits',
    'public.nps_responses','public.cancel_surveys','public.feedback_page',
    'public.listing_health','public.listings','public.listing_channel_groups',
    'public.listing_channel_aspects','public.listing_channels','public.channels',
    'public.transactions','public.agent_pending_actions','public.sync_failures',
    'public.sync_jobs','public.feed_rules','public.usage_reports','public.supplier',
    'public.metrics_daily','public.si_posts','public.si_engagements','public.si_ads',
    'public.si_comments','public.si_hook_patterns','public.si_insights',
    'public.si_jobs','public.si_watchlist',
    'public.inventory','public.bundles','public.bundle_items',
    'public.category_mappings','public.channel_sync_state','public.sync_log',
    'public.listing_versions','public.feed_health','public.field_mappings',
    'public.ad_campaigns','public.repricing_rules','public.purchase_orders',
    'public.purchase_order_items','public.suppliers','public.lookup_tables',
    'public.lookup_table_rows','public.api_keys','public.webhooks',
    'public.enrichment_usage','public.agent_action_log','public.ai_insights',
    'public.ai_conversations','public.product_intelligence',
    'public.ppc_keyword_performance','public.orders'
  ];
BEGIN
  FOREACH tbl IN ARRAY scoped_tables LOOP
    IF to_regclass(tbl) IS NULL THEN CONTINUE; END IF;
    short_name := split_part(tbl, '.', 2);
    SELECT count(*)
      INTO policy_count
      FROM pg_policies
     WHERE schemaname = 'public' AND tablename = short_name;
    IF policy_count <> 5 THEN
      offenders := array_append(offenders, tbl || '=' || policy_count);
    END IF;
  END LOOP;

  IF array_length(offenders, 1) > 0 THEN
    RAISE EXCEPTION
      'Stage D cutover sanity failed — expected 5 policies per table, got: %',
      offenders;
  END IF;

  RAISE NOTICE 'Stage D sanity passed — every scoped table has exactly 5 policies';
END $$;


COMMIT;

-- =============================================================================
-- Post-deploy checklist:
-- 1. Re-run the leak scanner manually: GET /api/cron/rls-leak-scan
--    Expected: 200 OK with zero new rows.
-- 2. Smoke-test `/api/listings`, `/api/orders`, `/billing` from an authenticated
--    session — basic reads + writes.
-- 3. Run `pnpm test:rls` one more time — should still be green.
-- 4. Proceed to phase1_stage_d_drop_user_billing.sql to strip the users.*
--    compat columns after the Stripe webhook has been org-only for 30 days.
-- =============================================================================
