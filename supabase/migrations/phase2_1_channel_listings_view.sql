-- Phase 2.1 — channel_listings compatibility view.
--
-- Provides the cleaner "channel_listings" name without renaming the physical
-- `listings` table (which would require updating ~40 route files). New code
-- can reference `channel_listings`; existing code keeps working against
-- `listings`. In a future Phase 2.2 we migrate call sites, swap the names,
-- then drop the view.
--
-- RLS is inherited through the underlying table because the view is defined
-- with security_invoker=true (default) — the caller's RLS applies.

DROP VIEW IF EXISTS public.channel_listings;
CREATE VIEW public.channel_listings
  WITH (security_invoker = true)
AS
SELECT * FROM public.listings;

COMMENT ON VIEW public.channel_listings IS
  'Phase 2.1 compatibility alias over public.listings. Use this name in new code;
   a later migration will rename the physical table.';
