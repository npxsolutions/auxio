-- Phase 5 — register 6 more section types + seed one "launch" page that uses them.

INSERT INTO public.marketing_section_types (key, label, description) VALUES
  ('step_flow',        'Step flow',        'Numbered horizontal steps with duration badges.'),
  ('integration_grid', 'Integration grid', 'N-column grid of named integrations with live / beta / coming-soon status chips.'),
  ('testimonial',      'Testimonial',      'Single pull-quote with attribution + role/company.'),
  ('pricing_table',    'Pricing table',    'Multi-tier pricing grid with optional highlighted recommended tier.'),
  ('faq',              'FAQ',              'Collapsible Q&A list using native details/summary.'),
  ('logo_wall',        'Logo wall',        'Typographic logo row (text-based, no image MVP).')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description;

-- Seed a fresh "launch" page using the full expanded section set.
DO $$
DECLARE v_page_id uuid;
BEGIN
  INSERT INTO public.marketing_pages (slug, title, description, status, published_at)
  VALUES (
    'launch',
    'Palvento — launch narrative',
    'The Phase-5 showcase page. Uses hero, logo_wall, step_flow, integration_grid, feature_grid, testimonial, pricing_table, faq, cta — every section type Phase 5 registers.',
    'published', now()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    published_at = COALESCE(public.marketing_pages.published_at, EXCLUDED.published_at)
  RETURNING id INTO v_page_id;

  DELETE FROM public.marketing_sections WHERE page_id = v_page_id;

  INSERT INTO public.marketing_sections (page_id, type, position, props) VALUES
    (v_page_id, 'hero', 1, jsonb_build_object(
      'eyebrow','COMMERCE OPERATIONS INFRASTRUCTURE',
      'headline','Ten minutes to install. Ten years to outgrow.',
      'subhead','One platform for Shopify + marketplaces. Feed validator, per-channel P&L, procurement — all wired together, none of the enterprise price tag.',
      'ctaLabel','Start free trial','ctaHref','/signup',
      'secondaryCtaLabel','See the product','secondaryCtaHref','/cms/launch#pricing'
    )),

    (v_page_id, 'logo_wall', 2, jsonb_build_object(
      'eyebrow','BUILT FOR OPERATORS PUBLISHING TO',
      'logos', jsonb_build_array(
        jsonb_build_object('name','Shopify'),
        jsonb_build_object('name','eBay'),
        jsonb_build_object('name','Amazon'),
        jsonb_build_object('name','Etsy'),
        jsonb_build_object('name','TikTok Shop'),
        jsonb_build_object('name','Google'),
        jsonb_build_object('name','Facebook'),
        jsonb_build_object('name','WooCommerce')
      )
    )),

    (v_page_id, 'step_flow', 3, jsonb_build_object(
      'eyebrow','INSTALL PATH',
      'title','From zero to first published listing in under 10 minutes.',
      'steps', jsonb_build_array(
        jsonb_build_object('label','Connect Shopify','duration','1 min','description','OAuth — no feed file uploads.'),
        jsonb_build_object('label','Import catalogue','duration','2 min','description','Products + images pulled into the master SKU view.'),
        jsonb_build_object('label','Set per-channel rules','duration','3 min','description','Price floors, title templates, category mappings.'),
        jsonb_build_object('label','Validate + publish','duration','3 min','description','Feed errors caught before the marketplace rejects them.'),
        jsonb_build_object('label','Watch orders flow','duration','live','description','Unified queue, reconciled to payouts.')
      )
    )),

    (v_page_id, 'integration_grid', 4, jsonb_build_object(
      'eyebrow','CHANNELS','title','Live integrations today.','columns',4,
      'integrations', jsonb_build_array(
        jsonb_build_object('name','Shopify','description','OAuth, products, orders, inventory','status','live'),
        jsonb_build_object('name','eBay','description','Inventory API + Trading API fallback','status','live'),
        jsonb_build_object('name','Etsy','description','Listings + orders','status','live'),
        jsonb_build_object('name','WooCommerce','description','REST API','status','live'),
        jsonb_build_object('name','BigCommerce','description','V3 API','status','live'),
        jsonb_build_object('name','Walmart','description','Marketplace API','status','live'),
        jsonb_build_object('name','Google Shopping','description','Merchant Center','status','live'),
        jsonb_build_object('name','Facebook','description','Catalog + Commerce','status','live'),
        jsonb_build_object('name','Amazon SP-API','description','Developer approval in progress','status','coming_soon'),
        jsonb_build_object('name','TikTok Shop','description','Partner approval in progress','status','coming_soon'),
        jsonb_build_object('name','OnBuy','description','HMAC Auth','status','beta'),
        jsonb_build_object('name','More coming','description','Mirakl, Wayfair, Bol','status','coming_soon')
      )
    )),

    (v_page_id, 'feature_grid', 5, jsonb_build_object(
      'eyebrow','WHAT PALVENTO DOES','title','Four pillars, one platform.','columns',2,
      'features', jsonb_build_array(
        jsonb_build_object('title','Inventory & Listings','bullets',jsonb_build_array(
          'Real-time multi-channel stock sync','Bulk listing builder with per-channel mapping','Variant + bundle support')),
        jsonb_build_object('title','Orders & Fulfilment','bullets',jsonb_build_array(
          'Unified order queue with rules-based routing','Labels across 30+ carriers','Returns + RMAs in one workflow')),
        jsonb_build_object('title','Procurement & Forecasting','bullets',jsonb_build_array(
          '90-day velocity forecasts per SKU','Supplier PO automation','Reorder alerts tuned to sell-through')),
        jsonb_build_object('title','Profit & Analytics','bullets',jsonb_build_array(
          'Per-SKU per-channel contribution margin','Fee attribution reconciled to payouts','Cohort-level LTV views'))
      )
    )),

    (v_page_id, 'testimonial', 6, jsonb_build_object(
      'quote','We went from three spreadsheets and a broken Zapier chain to one dashboard. The feed validator alone saved us from three Amazon rejections in week one.',
      'author','Founding partner #1',
      'role','COO',
      'company','Anonymous Shopify Plus brand'
    )),

    (v_page_id, 'pricing_table', 7, jsonb_build_object(
      'eyebrow','PRICING','title','Flat monthly. No % of GMV.',
      'tiers', jsonb_build_array(
        jsonb_build_object(
          'name','Starter','price','$79','cadence','/month',
          'features', jsonb_build_array(
            '500 orders / month','1,000 listings','2 channels','Community support'),
          'ctaLabel','Start free trial','ctaHref','/signup?plan=starter'),
        jsonb_build_object(
          'name','Growth','price','$199','cadence','/month','highlight',true,
          'features', jsonb_build_array(
            '2,000 orders / month','10,000 listings','All channels','Priority support','Agent (co-pilot mode)'),
          'ctaLabel','Start free trial','ctaHref','/signup?plan=growth'),
        jsonb_build_object(
          'name','Scale','price','$599','cadence','/month',
          'features', jsonb_build_array(
            '10,000 orders / month','Unlimited listings','Agent autopilot','Dedicated Slack','99.9% uptime SLA'),
          'ctaLabel','Start free trial','ctaHref','/signup?plan=scale'),
        jsonb_build_object(
          'name','Enterprise','price','Custom','cadence','','ctaLabel','Talk to sales','ctaHref','/enterprise',
          'features', jsonb_build_array(
            'Unlimited everything','MSA, SLA, SSO','Data residency options','Named CSM'))
      )
    )),

    (v_page_id, 'faq', 8, jsonb_build_object(
      'eyebrow','FAQ','title','Common questions.',
      'items', jsonb_build_array(
        jsonb_build_object('question','How is this different from Feedonomics / ChannelAdvisor?',
          'answer','Those start at $2,500/mo and take 30–90 days to install. Palvento is self-serve, 10-minute install, flat $79/$199/$599/mo tiers with no % of GMV.'),
        jsonb_build_object('question','What happens if I hit my plan limit mid-month?',
          'answer','Soft overage — per-order and per-listing charges listed on the plan. You pick an automatic bump-up tier in settings or stay on overage. Either way, nothing breaks.'),
        jsonb_build_object('question','Do you support multi-location inventory?',
          'answer','Yes. Inventory lives in a movements ledger — one audit-grade stock record, sum across locations per product. See Phase 2 ledger.'),
        jsonb_build_object('question','Is there a free trial?',
          'answer','14 days, no card required. Card-on-file extends to 30 days.')
      )
    )),

    (v_page_id, 'cta', 9, jsonb_build_object(
      'title','Ten minutes to install. Let''s see if we save you six hours next week.',
      'description','Free trial, no card. If you dislike it by day 14, uninstall in one click and take your data.',
      'primaryLabel','Start free trial','primaryHref','/signup',
      'secondaryLabel','Talk to sales','secondaryHref','/enterprise'
    ));

END $$;
