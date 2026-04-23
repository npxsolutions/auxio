-- Marketing CMS — Phase 0 foundation.
--
-- Three tables back the CMS-driven marketing layer:
--   marketing_section_types  — registry of allowed section types (source of truth for admin UI later)
--   marketing_pages          — one row per public marketing page (slug, SEO, status)
--   marketing_sections       — ordered sections inside a page (type, position, props jsonb)
--
-- RLS model:
--   Marketing pages are public by design. Anyone (anon + authenticated) can SELECT
--   pages with status='published' and their sections. Service role has full control
--   for seeding, migration, and future admin UI writes.
--
-- No tenant isolation yet — marketing is global. Tenant-scoping comes in Phase 1
-- if/when we want per-org private pages (unlikely for public marketing).

------------------------------------------------------------------------
-- 1. marketing_section_types — the registry of allowed section kinds.
------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.marketing_section_types (
  key          text PRIMARY KEY,           -- 'hero', 'feature_grid', 'cta', ...
  label        text NOT NULL,              -- 'Hero', 'Feature grid', 'Call to action'
  description  text,
  props_schema jsonb,                      -- JSON Schema describing the props shape (used by admin UI later)
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_section_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_section_types_public_read" ON public.marketing_section_types;
CREATE POLICY "marketing_section_types_public_read"
  ON public.marketing_section_types
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "marketing_section_types_service_all" ON public.marketing_section_types;
CREATE POLICY "marketing_section_types_service_all"
  ON public.marketing_section_types
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

------------------------------------------------------------------------
-- 2. marketing_pages — one row per landing page URL.
------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.marketing_pages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,                          -- URL path suffix, e.g. 'v1-demo'
  title         text NOT NULL,                                 -- internal + <title>
  description   text,                                          -- meta description
  og_image_url  text,                                          -- og:image absolute or relative URL
  status        text NOT NULL DEFAULT 'draft'                  -- 'draft' | 'published'
                 CHECK (status IN ('draft', 'published')),
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_pages_slug_idx
  ON public.marketing_pages (slug);

CREATE INDEX IF NOT EXISTS marketing_pages_status_published_at_idx
  ON public.marketing_pages (status, published_at DESC);

ALTER TABLE public.marketing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_pages_public_read_published" ON public.marketing_pages;
CREATE POLICY "marketing_pages_public_read_published"
  ON public.marketing_pages
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "marketing_pages_service_all" ON public.marketing_pages;
CREATE POLICY "marketing_pages_service_all"
  ON public.marketing_pages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

------------------------------------------------------------------------
-- 3. marketing_sections — ordered sections that compose a page.
------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.marketing_sections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     uuid NOT NULL REFERENCES public.marketing_pages(id) ON DELETE CASCADE,
  type        text NOT NULL REFERENCES public.marketing_section_types(key),
  position    integer NOT NULL,                                -- display order within page
  props       jsonb NOT NULL DEFAULT '{}'::jsonb,              -- validated against props_schema at write time
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, position)
);

CREATE INDEX IF NOT EXISTS marketing_sections_page_id_position_idx
  ON public.marketing_sections (page_id, position);

ALTER TABLE public.marketing_sections ENABLE ROW LEVEL SECURITY;

-- Sections inherit visibility from their parent page. A public reader can see
-- a section iff the parent page is published. Enforced via EXISTS subquery.
DROP POLICY IF EXISTS "marketing_sections_public_read_if_page_published" ON public.marketing_sections;
CREATE POLICY "marketing_sections_public_read_if_page_published"
  ON public.marketing_sections
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.marketing_pages p
      WHERE p.id = marketing_sections.page_id
        AND p.status = 'published'
    )
  );

DROP POLICY IF EXISTS "marketing_sections_service_all" ON public.marketing_sections;
CREATE POLICY "marketing_sections_service_all"
  ON public.marketing_sections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

------------------------------------------------------------------------
-- 4. updated_at trigger helpers.
------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.marketing_cms_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketing_pages_touch_updated_at ON public.marketing_pages;
CREATE TRIGGER marketing_pages_touch_updated_at
  BEFORE UPDATE ON public.marketing_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.marketing_cms_touch_updated_at();

DROP TRIGGER IF EXISTS marketing_sections_touch_updated_at ON public.marketing_sections;
CREATE TRIGGER marketing_sections_touch_updated_at
  BEFORE UPDATE ON public.marketing_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.marketing_cms_touch_updated_at();

------------------------------------------------------------------------
-- 5. Seed the 3 Phase 0 section types.
--    Adding a new type is a code change (TS registry) + an insert here.
------------------------------------------------------------------------

INSERT INTO public.marketing_section_types (key, label, description)
VALUES
  ('hero',
   'Hero',
   'Top-of-page headline block with eyebrow, headline, subhead, and primary/secondary CTAs.'),
  ('feature_grid',
   'Feature grid',
   'N-column grid of feature cards, each with title, description, and optional bullets.'),
  ('cta',
   'Call to action',
   'Closing action block with headline + primary/secondary CTA.')
ON CONFLICT (key) DO UPDATE
  SET label = EXCLUDED.label,
      description = EXCLUDED.description;

------------------------------------------------------------------------
-- 6. Seed one demo page (slug 'v1-demo') that mirrors landing/v1 content.
--    Phase 5 will migrate the remaining landing pages.
------------------------------------------------------------------------

DO $$
DECLARE
  v_page_id uuid;
BEGIN
  -- Upsert the page
  INSERT INTO public.marketing_pages (slug, title, description, status, published_at)
  VALUES (
    'v1-demo',
    'Palvento — commerce operations, wired end to end',
    'One platform for multichannel commerce operations. Inventory, orders, procurement, and profit — wired together, end to end.',
    'published',
    now()
  )
  ON CONFLICT (slug) DO UPDATE
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        published_at = COALESCE(public.marketing_pages.published_at, EXCLUDED.published_at)
  RETURNING id INTO v_page_id;

  -- Clean and re-seed sections for idempotent reruns
  DELETE FROM public.marketing_sections WHERE page_id = v_page_id;

  -- Position 1: Hero
  INSERT INTO public.marketing_sections (page_id, type, position, props)
  VALUES (
    v_page_id, 'hero', 1,
    jsonb_build_object(
      'eyebrow', 'COMMERCE OPERATIONS INFRASTRUCTURE',
      'headline', 'One platform for multichannel commerce operations',
      'subhead', 'Inventory, orders, procurement, and profit — wired together, end to end. Built for operators running Shopify plus three to five marketplaces who have outgrown the free first-party connectors and been priced out of the $2,500/mo enterprise feed tools.',
      'ctaLabel', 'Start free trial',
      'ctaHref', '/signup',
      'secondaryCtaLabel', 'See the product',
      'secondaryCtaHref', '/demo'
    )
  );

  -- Position 2: Feature grid (4 pillars)
  INSERT INTO public.marketing_sections (page_id, type, position, props)
  VALUES (
    v_page_id, 'feature_grid', 2,
    jsonb_build_object(
      'eyebrow', 'WHAT PALVENTO DOES',
      'title', 'Four pillars, one platform.',
      'columns', 2,
      'features', jsonb_build_array(
        jsonb_build_object(
          'title', 'Inventory & Listings',
          'bullets', jsonb_build_array(
            'Real-time multi-channel stock sync across 12 marketplaces',
            'Bulk listing builder with per-channel attribute mapping',
            'Variant, bundle, and kit support with shared stock pools'
          )
        ),
        jsonb_build_object(
          'title', 'Orders & Fulfilment',
          'bullets', jsonb_build_array(
            'Unified order queue with rules-based routing',
            'Label generation across 30+ carriers, global rates',
            'Returns, RMAs, and exception handling in one workflow'
          )
        ),
        jsonb_build_object(
          'title', 'Procurement & Forecasting',
          'bullets', jsonb_build_array(
            '90-day velocity-based demand forecasts per SKU',
            'Supplier PO automation with lead-time tracking',
            'Reorder alerts tuned to channel-level sell-through'
          )
        ),
        jsonb_build_object(
          'title', 'Profit & Analytics',
          'bullets', jsonb_build_array(
            'Per-SKU per-channel contribution margin, reconciled to payouts',
            'Line-item fee attribution across Amazon, eBay, TikTok Shop',
            'Cohort-level LTV and unit-economics views'
          )
        )
      )
    )
  );

  -- Position 3: Closing CTA
  INSERT INTO public.marketing_sections (page_id, type, position, props)
  VALUES (
    v_page_id, 'cta', 3,
    jsonb_build_object(
      'title', 'Ten minutes to install. Ten years to outgrow.',
      'description', 'Shopify OAuth in one click. First marketplace listing live in under ten minutes. Founding-partner rate locked for the life of your subscription.',
      'primaryLabel', 'Claim a founding spot',
      'primaryHref', '/founding-partners',
      'secondaryLabel', 'Read the thesis',
      'secondaryHref', '/about'
    )
  );

END $$;
