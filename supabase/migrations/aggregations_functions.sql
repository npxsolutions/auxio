-- Nightly aggregation SQL functions invoked by /api/cron/aggregations/*
-- Both are SECURITY DEFINER so the cron routes (service-role) can execute
-- across all users in a single round-trip.

CREATE OR REPLACE FUNCTION public.aggregate_listings_v2()
RETURNS TABLE(updated_count integer) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.listings l SET
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

  UPDATE public.listings l SET
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

CREATE OR REPLACE FUNCTION public.aggregate_metrics_daily(p_date date)
RETURNS TABLE(upserted_count integer) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count integer;
BEGIN
  WITH agg AS (
    SELECT t.user_id,
           COALESCE(NULLIF(t.sku,''), 'unknown') AS product_id,
           p_date AS date,
           sum(COALESCE(t.gross_revenue, t.sale_price, 0))::numeric AS revenue,
           count(*)::int AS orders
    FROM public.transactions t
    WHERE t.order_date >= p_date::timestamptz
      AND t.order_date <  (p_date + 1)::timestamptz
      AND t.user_id IS NOT NULL
    GROUP BY t.user_id, COALESCE(NULLIF(t.sku,''), 'unknown')
  ),
  ups AS (
    INSERT INTO public.metrics_daily (user_id, product_id, date, revenue, orders)
    SELECT user_id, product_id, date, revenue, orders FROM agg
    ON CONFLICT (user_id, product_id, date)
    DO UPDATE SET revenue = EXCLUDED.revenue, orders = EXCLUDED.orders
    RETURNING 1
  )
  SELECT count(*)::int INTO v_count FROM ups;
  RETURN QUERY SELECT v_count;
END $$;

REVOKE ALL ON FUNCTION public.aggregate_listings_v2() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.aggregate_metrics_daily(date) FROM anon, authenticated;
