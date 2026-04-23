-- =============================================================================
-- Phase 1 — Stage A: Multi-tenancy schema foundation.
-- =============================================================================
--
-- Creates the org tenancy model and adds nullable `organization_id` columns to
-- every user-scoped table. Backfill lives in a separate migration
-- (phase1_stage_a_backfill.sql) and MUST run before Stage B.
--
-- This migration is idempotent (safe to re-run) and reversible: nothing here
-- changes app behaviour yet. Old user-scoped RLS policies remain active.
--
-- See docs/architecture/phase-1-multitenancy-spec.md for the full plan.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. organizations — the tenant unit.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organizations (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   text NOT NULL UNIQUE,
  name                   text NOT NULL,
  owner_user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  plan                   text NOT NULL DEFAULT 'trialing',
  subscription_status    text NOT NULL DEFAULT 'trialing',
  stripe_customer_id     text UNIQUE,
  stripe_subscription_id text UNIQUE,
  billing_interval       text NOT NULL DEFAULT 'month',
  trial_ends_at          timestamptz,
  lifetime_purchased_at  timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organizations_owner_user_id_idx
  ON public.organizations(owner_user_id);

CREATE INDEX IF NOT EXISTS organizations_stripe_customer_id_idx
  ON public.organizations(stripe_customer_id);

CREATE INDEX IF NOT EXISTS organizations_subscription_status_idx
  ON public.organizations(subscription_status);

-- One "personal" org per user (identified by slug prefix 'u-').
-- Agency orgs and team orgs use other slug formats; they can have different
-- owners who still have a personal org.
CREATE UNIQUE INDEX IF NOT EXISTS organizations_one_personal_per_owner
  ON public.organizations(owner_user_id)
  WHERE slug LIKE 'u-%';


-- -----------------------------------------------------------------------------
-- 2. organization_members — many-to-many between users and orgs.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'member'
                   CHECK (role IN ('owner','admin','member','viewer')),
  invited_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at      timestamptz,
  accepted_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS organization_members_user_id_idx
  ON public.organization_members(user_id);

CREATE INDEX IF NOT EXISTS organization_members_role_idx
  ON public.organization_members(organization_id, role);


-- -----------------------------------------------------------------------------
-- 3. organization_invitations — pending invites (accepted → member row).
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email           text NOT NULL,
  role            text NOT NULL DEFAULT 'member'
                   CHECK (role IN ('admin','member','viewer')),
  invited_by      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token           text NOT NULL UNIQUE,
  expires_at      timestamptz NOT NULL,
  accepted_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS organization_invitations_token_idx
  ON public.organization_invitations(token);

CREATE INDEX IF NOT EXISTS organization_invitations_email_idx
  ON public.organization_invitations(email);


-- -----------------------------------------------------------------------------
-- 4. updated_at trigger (shared helper, reused across tenant tables).
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mt_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_touch_updated_at ON public.organizations;
CREATE TRIGGER organizations_touch_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.mt_touch_updated_at();


-- -----------------------------------------------------------------------------
-- 5. is_org_member() — RLS helper. STABLE + SECURITY DEFINER so policies can
-- call it without leaking membership state across tenants.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_org_member(org uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = org
      AND m.user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated, anon;

-- Companion: is_org_admin() — gates DELETEs and settings changes in Stage B
-- policies. Same security posture.
CREATE OR REPLACE FUNCTION public.is_org_admin(org uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = org
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated, anon;


-- -----------------------------------------------------------------------------
-- 6. RLS on org tables themselves.
-- -----------------------------------------------------------------------------
-- Members can see their orgs. Owners/admins can mutate. Only service role
-- and the signup path (authenticated user inserting own org) can INSERT.
-- -----------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_members_select" ON public.organizations;
CREATE POLICY "organizations_members_select"
  ON public.organizations
  FOR SELECT
  USING (public.is_org_member(id));

DROP POLICY IF EXISTS "organizations_authenticated_insert" ON public.organizations;
CREATE POLICY "organizations_authenticated_insert"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "organizations_admin_update" ON public.organizations;
CREATE POLICY "organizations_admin_update"
  ON public.organizations
  FOR UPDATE
  USING (public.is_org_admin(id))
  WITH CHECK (public.is_org_admin(id));

DROP POLICY IF EXISTS "organizations_owner_delete" ON public.organizations;
CREATE POLICY "organizations_owner_delete"
  ON public.organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "organizations_service_all" ON public.organizations;
CREATE POLICY "organizations_service_all"
  ON public.organizations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organization_members_self_select" ON public.organization_members;
CREATE POLICY "organization_members_self_select"
  ON public.organization_members
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "organization_members_admin_insert" ON public.organization_members;
CREATE POLICY "organization_members_admin_insert"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "organization_members_admin_update" ON public.organization_members;
CREATE POLICY "organization_members_admin_update"
  ON public.organization_members
  FOR UPDATE
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "organization_members_admin_delete" ON public.organization_members;
CREATE POLICY "organization_members_admin_delete"
  ON public.organization_members
  FOR DELETE
  USING (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "organization_members_service_all" ON public.organization_members;
CREATE POLICY "organization_members_service_all"
  ON public.organization_members
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organization_invitations_admin_all" ON public.organization_invitations;
CREATE POLICY "organization_invitations_admin_all"
  ON public.organization_invitations
  FOR ALL
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "organization_invitations_service_all" ON public.organization_invitations;
CREATE POLICY "organization_invitations_service_all"
  ON public.organization_invitations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 7. Add nullable organization_id to every user-scoped table.
-- -----------------------------------------------------------------------------
-- Using a DO block so a missing table doesn't fail the migration. The
-- mt_add_org_id() helper ALTERs only if the table exists and lacks the column.
-- Backfill (separate migration) will populate values. NOT NULL is applied post-
-- backfill.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mt_add_org_id(tbl regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  col_exists boolean;
  tbl_name   text := tbl::text;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = split_part(tbl_name, '.', 1)
      AND c.table_name = split_part(tbl_name, '.', 2)
      AND c.column_name = 'organization_id'
  ) INTO col_exists;

  IF NOT col_exists THEN
    EXECUTE format(
      'ALTER TABLE %s ADD COLUMN organization_id uuid REFERENCES public.organizations(id)',
      tbl_name
    );
  END IF;

  -- Index on org_id (per-table, named {table}_organization_id_idx)
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %s(organization_id)',
    regexp_replace(split_part(tbl_name, '.', 2), '[^a-zA-Z0-9_]', '_', 'g') || '_organization_id_idx',
    tbl_name
  );
END;
$$;

-- Apply to every scoped table. Missing tables skipped via a separate
-- to_regclass() guard so the whole migration remains idempotent / partial-safe.
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
      PERFORM public.mt_add_org_id(tbl::regclass);
      RAISE NOTICE 'added organization_id to %', tbl;
    ELSE
      RAISE NOTICE 'skipped % (table does not exist)', tbl;
    END IF;
  END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 8. Stage A is complete.
-- -----------------------------------------------------------------------------
--
-- Next step: run phase1_stage_a_backfill.sql, which populates organization_id
-- on all scoped rows. Only after that do we ALTER ... SET NOT NULL and proceed
-- to Stage B (dual RLS policies).
--
-- Nothing here breaks the running app:
--   - Old user-scoped RLS policies still enforce isolation
--   - New org tables are empty (invisible to the app)
--   - New organization_id columns are nullable + unreferenced
--
-- Rollback is clean: DROP the org tables + helper functions + new columns.
-- =============================================================================
