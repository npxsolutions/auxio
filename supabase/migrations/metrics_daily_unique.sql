-- Ensure metrics_daily supports per-user per-product per-day UPSERT
ALTER TABLE public.metrics_daily ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS metrics_daily_user_product_date_uniq ON public.metrics_daily(user_id, product_id, date);
ALTER TABLE public.metrics_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS metrics_daily_own ON public.metrics_daily;
CREATE POLICY metrics_daily_own ON public.metrics_daily FOR SELECT USING (auth.uid() = user_id);
