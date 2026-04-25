-- Phase 5 — register the final 3 section types.
-- Brings the registry from 9 → 12 (matches the v2-phased-plan target).

INSERT INTO public.marketing_section_types (key, label, description) VALUES
  ('stat_card',       'Stat card',       'N-column grid of large numeric stats with optional delta.'),
  ('video_embed',     'Video embed',     'Responsive iframe embed (YouTube/Vimeo/etc.) with optional title.'),
  ('product_preview', 'Product preview', 'Split copy + screenshot row; image left or right.')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description;
