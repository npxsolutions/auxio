-- WooCommerce + BigCommerce webhook dedupe tables.
-- Applied via MCP apply_migration on project oiywxhmhabqjvswdwrzc.
-- Mirror of webhook_events_shopify shape, RLS locked to service-role only.

CREATE TABLE IF NOT EXISTS public.webhook_events_woocommerce (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_id text NOT NULL,
  topic text NOT NULL,
  shop_domain text,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw_body jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_woocommerce_received_uq
  ON public.webhook_events_woocommerce (received_id, topic);
ALTER TABLE public.webhook_events_woocommerce ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_events_woocommerce_service_only" ON public.webhook_events_woocommerce;
CREATE POLICY "webhook_events_woocommerce_service_only" ON public.webhook_events_woocommerce
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.webhook_events_bigcommerce (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_id text NOT NULL,
  topic text NOT NULL,
  shop_domain text,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw_body jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_bigcommerce_received_uq
  ON public.webhook_events_bigcommerce (received_id, topic);
ALTER TABLE public.webhook_events_bigcommerce ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_events_bigcommerce_service_only" ON public.webhook_events_bigcommerce;
CREATE POLICY "webhook_events_bigcommerce_service_only" ON public.webhook_events_bigcommerce
  FOR ALL TO authenticated USING (false) WITH CHECK (false);
