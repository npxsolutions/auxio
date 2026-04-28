-- Phase 4 — payout-reconciled fees + receivables (the wedge + loop)
--
-- Two parts:
--   1. Extend `transactions` so reconciled fees can replace estimates without
--      losing the audit trail.
--   2. Add `payouts` (per-marketplace receivables, populated from finances
--      APIs) and `payout_interest` (fast-payout demand-signal capture).
--
-- Why not overload `transactions` for receivables? Because a payout is a
-- many-orders → one-deposit aggregation; we need the join, not a column.

------------------------------------------------------------------------
-- 1. transactions — add reconciled-fee columns.
------------------------------------------------------------------------

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS fees_breakdown      jsonb,
  ADD COLUMN IF NOT EXISTS fees_reconciled_at  timestamptz;

COMMENT ON COLUMN public.transactions.fees_breakdown IS
  'Per-fee-type breakdown from the marketplace finances API. Shape: { final_value: 12.34, ad_fee: 1.20, payment_processing: 0.80, ... }. NULL = not yet reconciled (channel_fee is a rate-based estimate).';

COMMENT ON COLUMN public.transactions.fees_reconciled_at IS
  'When the channel_fee was replaced with a reconciled value from the marketplace finances API. NULL means still on a rate-based estimate.';

CREATE INDEX IF NOT EXISTS transactions_unreconciled_idx
  ON public.transactions (organization_id, channel, order_date DESC)
  WHERE fees_reconciled_at IS NULL;

------------------------------------------------------------------------
-- 2. payouts — one row per (channel, payout_id). Receivables visibility.
------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payouts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel           text NOT NULL,                              -- 'ebay', 'amazon', 'shopify', ...
  external_id       text NOT NULL,                              -- marketplace payout id
  status            text NOT NULL,                              -- 'pending' | 'in_transit' | 'paid' | 'failed'
                     CHECK (status IN ('pending','in_transit','paid','failed')),
  gross_amount      numeric NOT NULL,                           -- total order value before fees
  fee_amount        numeric NOT NULL DEFAULT 0,                 -- marketplace fees applied
  refund_amount     numeric NOT NULL DEFAULT 0,
  net_amount        numeric NOT NULL,                           -- what hits the bank
  currency          text NOT NULL,
  payout_eta        timestamptz,                                -- expected hit-bank date
  paid_at           timestamptz,
  raw               jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, channel, external_id)
);

CREATE INDEX IF NOT EXISTS payouts_org_status_idx
  ON public.payouts (organization_id, status, payout_eta);

CREATE INDEX IF NOT EXISTS payouts_org_channel_idx
  ON public.payouts (organization_id, channel, paid_at DESC);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
SELECT public.mt_add_org_rls('public.payouts'::regclass);

DROP TRIGGER IF EXISTS payouts_touch_updated_at ON public.payouts;
CREATE TRIGGER payouts_touch_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.mt_touch_updated_at();

-- Note: receivables visibility (payouts table above) feeds the per-channel
-- P&L surface — "you've sold $X on eBay this month, payable $Y on Z." It's
-- the data spine for the wedge, not the start of a financial-services
-- product. The product loop lives in listings management — list once,
-- publish multichannel — built separately on top of `products` and
-- `channel_listings`.
