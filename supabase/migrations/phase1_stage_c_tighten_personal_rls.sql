-- =============================================================================
-- Phase 1 — Stage C (early): tighten RLS on user-personal tables.
-- =============================================================================
--
-- Stage B installed org-scoped policies on every scoped table uniformly. For
-- the 5 user-personal tables below, that's too permissive — any org member
-- could then read another member's profile, GDPR deletion requests, NPS
-- feedback, etc. We undo the org-scoped SELECT/UPDATE policies on these
-- tables so they stay strictly user-owned, regardless of org membership.
--
-- Org-scoped INSERT/DELETE stay in place for these tables because they're
-- about the writer's own authority (must be a member to insert into the org's
-- context, admin to delete). The write paths still require the correct org.
--
-- The existing user-scoped policies (`auth.uid() = user_id`) continue to run.
-- After Stage D drops those, we install a combined policy on these 5 tables:
--   `auth.uid() = user_id AND is_org_member(organization_id)`
-- (deferred to Stage D migration — not this file).
--
-- Affected tables:
--   user_profiles, deletion_requests, nps_responses, cancel_surveys,
--   feedback_page
-- =============================================================================


CREATE OR REPLACE FUNCTION public.mt_drop_org_read_policies(tbl regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  tbl_name   text := tbl::text;
  short_name text := split_part(tbl_name, '.', 2);
  policy_base text := regexp_replace(short_name, '[^a-zA-Z0-9_]', '_', 'g');
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "%s_org_select" ON %s', policy_base, tbl_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_org_update" ON %s', policy_base, tbl_name);
  RAISE NOTICE 'dropped org-scoped SELECT/UPDATE on %', tbl_name;
END;
$$;

DO $$
DECLARE
  tbl text;
  personal_tables text[] := ARRAY[
    'public.user_profiles',
    'public.deletion_requests',
    'public.nps_responses',
    'public.cancel_surveys',
    'public.feedback_page'
  ];
BEGIN
  FOREACH tbl IN ARRAY personal_tables LOOP
    IF to_regclass(tbl) IS NOT NULL THEN
      PERFORM public.mt_drop_org_read_policies(tbl::regclass);
    END IF;
  END LOOP;
END $$;


-- =============================================================================
-- State after this migration:
--   - user_profiles et al. have ONLY user-scoped SELECT/UPDATE (from the
--     legacy `{table}_select_own` etc. policies)
--   - They retain org-scoped INSERT (must be member of org on write) and
--     org-scoped DELETE (admin-only)
--   - No team member of an org can read another member's personal profile,
--     deletion requests, or private survey responses
--
-- Rollback: PERFORM public.mt_add_org_rls on each of these tables to restore
-- the org-scoped SELECT/UPDATE policies.
-- =============================================================================
