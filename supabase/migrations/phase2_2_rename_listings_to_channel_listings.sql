-- Phase 2.2 — rename the physical `listings` table to `channel_listings`.
--
-- Predecessors:
--   - phase2_1_channel_listings_view.sql created a security_invoker view named
--     channel_listings over the listings table.
--   - All app-side call sites have been migrated from .from('listings') to
--     .from('channel_listings') (commit d6a4ab6).
--
-- This migration drops the view and renames the underlying table so the new
-- name is the canonical one. Indexes are renamed for cleanliness; the
-- self-FK on parent_listing_id auto-tracks the rename via Postgres OIDs.
--
-- Functions that reference the old name are recreated below.

BEGIN;

-- 1. Drop the compatibility view (must precede the rename — the view
--    holds a dependency on the listings table that blocks ALTER TABLE).
DROP VIEW IF EXISTS public.channel_listings;

-- 2. Rename the physical table.
ALTER TABLE public.listings RENAME TO channel_listings;

COMMENT ON TABLE public.channel_listings IS
  'Per-channel listing instance of a product. Renamed from "listings" in Phase 2.2 (2026-04).';

-- 3. Rename indexes that retained their old prefix.
ALTER INDEX IF EXISTS idx_listings_user_last_sync   RENAME TO idx_channel_listings_user_last_sync;
ALTER INDEX IF EXISTS idx_listings_user_margin      RENAME TO idx_channel_listings_user_margin;
ALTER INDEX IF EXISTS idx_listings_user_quantity    RENAME TO idx_channel_listings_user_quantity;
ALTER INDEX IF EXISTS idx_listings_user_sold_30d    RENAME TO idx_channel_listings_user_sold_30d;
ALTER INDEX IF EXISTS idx_listings_parent           RENAME TO idx_channel_listings_parent;
ALTER INDEX IF EXISTS idx_listings_primary_channel  RENAME TO idx_channel_listings_primary_channel;
ALTER INDEX IF EXISTS idx_listings_sync_errors      RENAME TO idx_channel_listings_sync_errors;
ALTER INDEX IF EXISTS idx_listings_is_bundle        RENAME TO idx_channel_listings_is_bundle;
ALTER INDEX IF EXISTS idx_listings_tags             RENAME TO idx_channel_listings_tags;
ALTER INDEX IF EXISTS listings_product_id_idx       RENAME TO channel_listings_product_id_idx;

-- 4. Recreate aggregate_listings_v2() — its body referenced public.listings,
--    which no longer exists. CREATE OR REPLACE swaps the SQL in place.
CREATE OR REPLACE FUNCTION public.aggregate_listings_v2()
RETURNS TABLE(updated_count integer) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.channel_listings l SET
    margin_pct = CASE WHEN l.cost_price IS NOT NULL AND l.price > 0
                      THEN round(((l.price - l.cost_price) / l.price) * 100, 1)
                      ELSE NULL END,
    sold_30d = COALESCE(s.sold_30d, 0),
    sell_through_30d = CASE
      WHEN COALESCE(s.sold_30d,0) + COALESCE(l.quantity,0) > 0
      THEN round((COALESCE(s.sold_30d,0)::numeric
                  / NULLIF(COALESCE(s.sold_30d,0) + COALESCE(l.quantity,0), 0)) * 100, 1)
      ELSE NULL END,
    days_of_cover = CASE
      WHEN COALESCE(s.sold_30d,0) > 0 AND l.quantity IS NOT NULL
      THEN round(l.quantity::numeric / (s.sold_30d::numeric / 30.0))::int
      ELSE NULL END,
    last_sold_at = COALESCE(s.last_sold_at, l.last_sold_at),
    updated_at = now()
  FROM (
    SELECT t.user_id, t.sku,
           count(*)::int AS sold_30d,
           max(t.created_at) AS last_sold_at
    FROM public.transactions t
    WHERE t.created_at >= now() - interval '30 days'
      AND t.sku IS NOT NULL AND t.sku <> ''
    GROUP BY t.user_id, t.sku
  ) s
  WHERE s.user_id = l.user_id AND s.sku = l.sku;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.channel_listings l SET
    margin_pct = CASE WHEN l.cost_price IS NOT NULL AND l.price > 0
                      THEN round(((l.price - l.cost_price) / l.price) * 100, 1)
                      ELSE NULL END,
    sold_30d = 0,
    sell_through_30d = CASE WHEN COALESCE(l.quantity,0) > 0 THEN 0 ELSE NULL END,
    days_of_cover = NULL,
    updated_at = now()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.user_id = l.user_id AND t.sku = l.sku
      AND t.created_at >= now() - interval '30 days'
      AND t.sku IS NOT NULL AND t.sku <> ''
  );

  RETURN QUERY SELECT v_count;
END $$;

REVOKE ALL ON FUNCTION public.aggregate_listings_v2() FROM anon, authenticated;

COMMIT;
