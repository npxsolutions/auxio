-- =============================================================================
-- Phase 1 — Stage A.1: extend multi-tenancy to auxiliary tables.
-- =============================================================================
--
-- Stage A scoped the core commerce surface. This migration covers the ~20
-- auxiliary tables the app still filtered by user_id (tagged in code with
-- "TODO Stage A.1" comments). After this lands + backfill finishes, the
-- corresponding code TODOs can be removed.
--
-- Safe to re-run — every step is guarded:
--   - mt_add_org_id() only ALTERs if the column is missing
--   - backfill UPDATE is idempotent (skips rows that already have org_id)
--   - mt_add_org_rls() uses DROP POLICY IF EXISTS + CREATE
--
-- PRE-FLIGHT:
--   - phase1_stage_a_multitenancy.sql applied
--   - phase1_stage_a_backfill.sql applied (personal orgs exist)
--   - phase1_stage_b_rls.sql applied (helpers + audit table exist)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Add organization_id column + index to every auxiliary table that has it
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
  aux_tables text[] := ARRAY[
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
  FOREACH tbl IN ARRAY aux_tables LOOP
    IF to_regclass(tbl) IS NOT NULL THEN
      PERFORM public.mt_add_org_id(tbl::regclass);
      RAISE NOTICE 'added organization_id to %', tbl;
    ELSE
      RAISE NOTICE 'skipped % (table does not exist)', tbl;
    END IF;
  END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 2. Backfill organization_id from each row's user_id via the user's
--    personal org (slug 'u-...'). Only updates NULL rows.
-- -----------------------------------------------------------------------------
--
-- Some tables (lookup_table_rows, bundle_items, purchase_order_items) join to
-- a parent that already has organization_id after step 1. We use the parent's
-- org_id rather than re-deriving from user_id, so child rows always match
-- parent scope (even for parents that get reassigned).
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mt_a1_backfill_from_user(tbl regclass)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  rows_updated integer := 0;
  has_user_id  boolean;
  tbl_name     text := tbl::text;
BEGIN
  -- Only attempt if the table has user_id. Some tables (parent-keyed children
  -- below) skip user-based backfill entirely.
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = split_part(tbl_name, '.', 1)
      AND c.table_name = split_part(tbl_name, '.', 2)
      AND c.column_name = 'user_id'
  ) INTO has_user_id;

  IF NOT has_user_id THEN
    RAISE NOTICE 'skipped user-based backfill for % (no user_id column)', tbl_name;
    RETURN 0;
  END IF;

  EXECUTE format($sql$
    WITH updated AS (
      UPDATE %s AS t
         SET organization_id = o.id
        FROM public.organizations o
       WHERE t.organization_id IS NULL
         AND o.owner_user_id = t.user_id
         AND o.slug LIKE 'u-%%'
       RETURNING 1
    )
    SELECT count(*) FROM updated
  $sql$, tbl_name) INTO rows_updated;

  RAISE NOTICE 'backfilled % rows on %', rows_updated, tbl_name;
  RETURN rows_updated;
END;
$$;

DO $$
DECLARE
  tbl text;
  aux_with_user_id text[] := ARRAY[
    'public.inventory',
    'public.bundles',
    'public.category_mappings',
    'public.channel_sync_state',
    'public.sync_log',
    'public.listing_versions',
    'public.feed_health',
    'public.field_mappings',
    'public.ad_campaigns',
    'public.repricing_rules',
    'public.purchase_orders',
    'public.suppliers',
    'public.lookup_tables',
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
  FOREACH tbl IN ARRAY aux_with_user_id LOOP
    IF to_regclass(tbl) IS NOT NULL THEN
      PERFORM public.mt_a1_backfill_from_user(tbl::regclass);
    END IF;
  END LOOP;
END $$;

-- Parent-keyed children — inherit org from parent.
-- bundle_items → bundles.id
-- purchase_order_items → purchase_orders.id
-- lookup_table_rows → lookup_tables.id
DO $$
BEGIN
  IF to_regclass('public.bundle_items') IS NOT NULL THEN
    UPDATE public.bundle_items bi
       SET organization_id = b.organization_id
      FROM public.bundles b
     WHERE bi.bundle_id = b.id
       AND bi.organization_id IS NULL;
    RAISE NOTICE 'backfilled bundle_items from bundles';
  END IF;

  IF to_regclass('public.purchase_order_items') IS NOT NULL THEN
    UPDATE public.purchase_order_items poi
       SET organization_id = po.organization_id
      FROM public.purchase_orders po
     WHERE poi.po_id = po.id
       AND poi.organization_id IS NULL;
    RAISE NOTICE 'backfilled purchase_order_items from purchase_orders';
  END IF;

  IF to_regclass('public.lookup_table_rows') IS NOT NULL THEN
    UPDATE public.lookup_table_rows ltr
       SET organization_id = lt.organization_id
      FROM public.lookup_tables lt
     WHERE ltr.table_id = lt.id
       AND ltr.organization_id IS NULL;
    RAISE NOTICE 'backfilled lookup_table_rows from lookup_tables';
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 3. Sanity: refuse to continue if any row is still NULL after backfill.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
  null_count int;
  offenders text[] := ARRAY[]::text[];
  aux_tables text[] := ARRAY[
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
  FOREACH tbl IN ARRAY aux_tables LOOP
    IF to_regclass(tbl) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM %s WHERE organization_id IS NULL', tbl) INTO null_count;
      IF null_count > 0 THEN
        offenders := array_append(offenders, tbl || ' (' || null_count || ')');
      END IF;
    END IF;
  END LOOP;

  IF array_length(offenders, 1) > 0 THEN
    RAISE EXCEPTION 'Stage A.1 backfill incomplete — rows with NULL organization_id: %', offenders;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 4. Apply NOT NULL + install dual RLS on every now-scoped aux table.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
  aux_tables text[] := ARRAY[
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
  FOREACH tbl IN ARRAY aux_tables LOOP
    IF to_regclass(tbl) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %s ALTER COLUMN organization_id SET NOT NULL', tbl);
      PERFORM public.mt_add_org_rls(tbl::regclass);
    END IF;
  END LOOP;
END $$;


-- =============================================================================
-- Post-deploy checklist:
-- 1. Deploy code with Stage A.1 TODOs resolved (user_id filters → org_id).
--    The dual RLS keeps legacy callers working through the rollout window.
-- 2. Add these new tables to the leak-scanner list in
--    app/api/cron/rls-leak-scan/route.ts (SCOPED_TABLES const).
-- 3. Observe rls_migration_audit for 7 days.
-- 4. Proceed to Stage D (drop user-scoped policies, drop compat columns).
-- =============================================================================
