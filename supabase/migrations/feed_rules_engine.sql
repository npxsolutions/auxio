-- Feed Rules Engine
-- Stores user-defined and default transformation rules for multichannel feed management.
-- Each rule has conditions (JSONB array) and actions (JSONB array) that transform
-- listing data before it's pushed to a channel.

CREATE TABLE IF NOT EXISTS public.feed_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT,                                   -- NULL or 'all' = applies to every channel
  rule_phase TEXT NOT NULL DEFAULT 'business',     -- 'pre' | 'business' | 'post'
  priority INT NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,            -- aliased to 'enabled' in app layer
  combinator TEXT NOT NULL DEFAULT 'AND',          -- condition logic: 'AND' | 'OR'
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  valid_from TIMESTAMPTZ,                          -- optional scheduling window
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.feed_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rules"
  ON public.feed_rules
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feed_rules_user_channel
  ON public.feed_rules(user_id, channel);

CREATE INDEX IF NOT EXISTS idx_feed_rules_user_active
  ON public.feed_rules(user_id, active)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_feed_rules_priority
  ON public.feed_rules(user_id, rule_phase, priority);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_feed_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feed_rules_updated_at
  BEFORE UPDATE ON public.feed_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feed_rules_updated_at();
