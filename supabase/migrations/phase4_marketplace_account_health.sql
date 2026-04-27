-- Phase 4 — marketplace_account_health
--
-- One row per (organization, channel). Holds the latest seller-standards
-- snapshot pulled by the per-channel ingestion adapters (eBay live; others
-- to follow). Used by:
--   - Inngest accountHealthStatusChangedFn → notification when a downgrade fires
--   - Daily retention scan → fallback notification path if events lagged
--   - Future /admin/sync-health dashboard
--
-- Status enum is intentionally a free-text column rather than a CHECK list
-- because each marketplace has its own vocabulary (eBay: top_rated /
-- above_standard / below_standard; Amazon: GOOD / FAIR / AT_RISK / CRITICAL;
-- Shopify: ok / disabled). Mappers in app/lib/channels/<channel>/account-health.ts
-- normalise into a shared set: top_rated, above_standard, good, standard,
-- below_standard, at_risk, restricted, needs_reauth, not_connected, unknown.

CREATE TABLE IF NOT EXISTS public.marketplace_account_health (
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel           text NOT NULL,                       -- 'ebay', 'amazon', 'shopify', ...
  status            text NOT NULL,                       -- normalised status (see comment)
  score             integer,                             -- 0–100 if the channel publishes one
  defects_count     integer,                             -- raw defect count when available
  raw               jsonb NOT NULL DEFAULT '{}'::jsonb,  -- channel-native payload for debugging
  previous_status   text,                                -- last status before the most recent change
  previous_score    integer,
  last_changed_at   timestamptz,                         -- when status flipped (NULL on first seed)
  last_checked_at   timestamptz NOT NULL DEFAULT now(),  -- when ingestion last ran (success or failure)
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, channel)
);

CREATE INDEX IF NOT EXISTS marketplace_account_health_org_idx
  ON public.marketplace_account_health (organization_id);

CREATE INDEX IF NOT EXISTS marketplace_account_health_status_idx
  ON public.marketplace_account_health (status)
  WHERE status IN ('at_risk', 'restricted', 'below_standard', 'needs_reauth');

ALTER TABLE public.marketplace_account_health ENABLE ROW LEVEL SECURITY;
SELECT public.mt_add_org_rls('public.marketplace_account_health'::regclass);

DROP TRIGGER IF EXISTS marketplace_account_health_touch_updated_at ON public.marketplace_account_health;
CREATE TRIGGER marketplace_account_health_touch_updated_at
  BEFORE UPDATE ON public.marketplace_account_health
  FOR EACH ROW
  EXECUTE FUNCTION public.mt_touch_updated_at();

COMMENT ON TABLE public.marketplace_account_health IS
  'Latest seller-standards snapshot per (org, channel). Refreshed by Inngest account-health/refresh.requested events. Status is normalised; raw holds the channel-native payload.';
