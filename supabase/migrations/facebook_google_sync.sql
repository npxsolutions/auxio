-- Facebook Commerce Catalog webhook dedupe table.
-- Google Merchant Center is poll-only (Content API has no push notifications)
-- so no table is needed for it.
-- Applied via MCP apply_migration on project oiywxhmhabqjvswdwrzc.
-- Mirror of webhook_events_shopify shape, RLS locked to service-role only.

CREATE TABLE IF NOT EXISTS public.webhook_events_facebook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_id text NOT NULL,
  topic text NOT NULL,
  shop_domain text,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw_body jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_facebook_received_uq
  ON public.webhook_events_facebook (received_id, topic);
ALTER TABLE public.webhook_events_facebook ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_events_facebook_service_only" ON public.webhook_events_facebook;
CREATE POLICY "webhook_events_facebook_service_only" ON public.webhook_events_facebook
  FOR ALL TO authenticated USING (false) WITH CHECK (false);
