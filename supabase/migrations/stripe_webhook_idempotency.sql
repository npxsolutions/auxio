-- Stripe webhook idempotency ledger.
-- Webhook handler inserts the Stripe event.id BEFORE processing.
-- Unique-violation (23505) => duplicate delivery => short-circuit with 200.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id    text PRIMARY KEY,
  event_type  text,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_stripe_webhook_events" ON public.stripe_webhook_events;
CREATE POLICY "service_role_all_stripe_webhook_events"
  ON public.stripe_webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_received_at_idx
  ON public.stripe_webhook_events (received_at DESC);
