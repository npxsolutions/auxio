-- Add is_founding_partner flag to user_profiles.
--
-- Set when a user signs up via /signup?founding=1 (or whose
-- /founding-partners → /signup chain forwarded the founding=1 query
-- param). Used by:
--   - the welcome wizard (different copy for founding partners)
--   - billing (locks the founding-partner price tier for life)
--   - admin reporting (which LinkedIn week converted founders)

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_founding_partner boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS user_profiles_founding_idx
  ON public.user_profiles (is_founding_partner)
  WHERE is_founding_partner = true;

COMMENT ON COLUMN public.user_profiles.is_founding_partner IS
  'True when the user signed up via the founding-partner CTA. Drives founding-partner pricing lock-in and dedicated onboarding path.';
