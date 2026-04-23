-- =============================================================================
-- Phase 2 — Products master + Inventory ledger (MVP).
-- =============================================================================
--
-- Introduces a `products` master row that a `listings` row can roll up to. In
-- Phase 2.1 we will rename `listings` → `channel_listings`, but that touches
-- every route so we're skipping it here. Instead we add a nullable
-- `product_id` FK on `listings` and treat products as additive.
--
-- Inventory state now lives in a ledger — `inventory_movements` — with a
-- materialised-view-style derived `inventory_state` function. Writes to the
-- legacy `inventory` table continue working untouched; the ledger is a new
-- parallel surface that ops + finance can audit. In Phase 2.1 we pick one and
-- drop the other.
--
-- Backfill: one product per (organization_id, sku) — SKU is the natural
-- identifier. Listings with duplicate SKUs across channels roll up to the
-- same product.
-- =============================================================================


------------------------------------------------------------------------
-- 1. products — master SKU (org-scoped).
------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  master_sku       text NOT NULL,
  title            text NOT NULL,
  description      text,
  brand            text,
  category         text,
  cost_price       numeric(12, 2),
  weight_grams     integer,
  barcode          text,
  images           jsonb DEFAULT '[]'::jsonb,
  metadata         jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, master_sku)
);

CREATE INDEX IF NOT EXISTS products_organization_id_idx
  ON public.products (organization_id);
CREATE INDEX IF NOT EXISTS products_master_sku_idx
  ON public.products (master_sku);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
SELECT public.mt_add_org_rls('public.products'::regclass);


------------------------------------------------------------------------
-- 2. listings.product_id — nullable FK to products.
------------------------------------------------------------------------

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS listings_product_id_idx
  ON public.listings (product_id);


------------------------------------------------------------------------
-- 3. inventory_movements — the auditable stock ledger.
------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id       uuid REFERENCES public.products(id) ON DELETE SET NULL,
  sku              text NOT NULL,
  delta            integer NOT NULL,                   -- +10 on receive, -1 on sale
  reason           text NOT NULL
                    CHECK (reason IN (
                      'receive',        -- PO received, supplier delivery
                      'sale',           -- transaction outbound
                      'return',         -- customer return inbound
                      'adjustment',     -- manual stock count correction
                      'transfer_out',   -- location→location outbound
                      'transfer_in',    -- location→location inbound
                      'damage',         -- written off
                      'initial'         -- opening balance at backfill
                    )),
  ref_type         text,                               -- 'purchase_order', 'transaction', 'manual', etc.
  ref_id           text,                               -- id of the referenced row
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_movements_org_product_idx
  ON public.inventory_movements (organization_id, product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_movements_org_sku_idx
  ON public.inventory_movements (organization_id, sku, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_movements_ref_idx
  ON public.inventory_movements (ref_type, ref_id);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
SELECT public.mt_add_org_rls('public.inventory_movements'::regclass);


------------------------------------------------------------------------
-- 4. inventory_state — derived stock-on-hand per product.
--    Not a materialised view — sum is cheap given the index above.
------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.inventory_state AS
SELECT
  organization_id,
  product_id,
  sku,
  SUM(delta)::integer AS on_hand,
  MAX(created_at)     AS last_movement_at,
  COUNT(*)::integer   AS movement_count
FROM public.inventory_movements
GROUP BY organization_id, product_id, sku;


------------------------------------------------------------------------
-- 5. Updated-at trigger on products.
------------------------------------------------------------------------

DROP TRIGGER IF EXISTS products_touch_updated_at ON public.products;
CREATE TRIGGER products_touch_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.mt_touch_updated_at();


------------------------------------------------------------------------
-- 6. Backfill — one product per (org, sku) from existing listings.
--    Listings with the same SKU in the same org roll up to the same product.
--    Listings without a SKU get their own product (keyed by listing.id).
------------------------------------------------------------------------

INSERT INTO public.products (
  organization_id, user_id, master_sku, title, description,
  brand, category, cost_price, weight_grams, barcode, images
)
SELECT DISTINCT ON (l.organization_id, COALESCE(NULLIF(l.sku, ''), l.id::text))
  l.organization_id,
  l.user_id,
  COALESCE(NULLIF(l.sku, ''), l.id::text)       AS master_sku,
  l.title,
  l.description,
  l.brand,
  l.category,
  l.cost_price,
  l.weight_grams,
  l.barcode,
  COALESCE(l.images, '[]'::jsonb)
FROM public.listings l
ORDER BY l.organization_id, COALESCE(NULLIF(l.sku, ''), l.id::text), l.created_at ASC
ON CONFLICT (organization_id, master_sku) DO NOTHING;

-- Link every listing to its product
UPDATE public.listings l
   SET product_id = p.id
  FROM public.products p
 WHERE p.organization_id = l.organization_id
   AND p.master_sku = COALESCE(NULLIF(l.sku, ''), l.id::text)
   AND l.product_id IS NULL;


------------------------------------------------------------------------
-- 7. Initial inventory_movements from current listing.quantity.
--    One 'initial' movement per product carrying the current on-hand.
------------------------------------------------------------------------

INSERT INTO public.inventory_movements (
  organization_id, user_id, product_id, sku, delta, reason, ref_type, ref_id, note
)
SELECT
  p.organization_id,
  p.user_id,
  p.id,
  p.master_sku,
  COALESCE((
    SELECT SUM(l.quantity)::integer
    FROM public.listings l
    WHERE l.product_id = p.id
  ), 0),
  'initial',
  'backfill',
  p.id::text,
  'Phase 2 backfill — opening balance from listings.quantity'
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory_movements m
  WHERE m.product_id = p.id AND m.reason = 'initial'
);
