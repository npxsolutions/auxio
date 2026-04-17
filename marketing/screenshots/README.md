# Palvento — Screenshots

Captured by `npm run capture` (see `scripts/capture-assets.ts`). Source: `https://palvento-lkqv.vercel.app`.

Two viewports:

- `1280x800/` — app-store hero / compact dashboards (Shopify, Capterra, PH embeds)
- `1920x1080/` — full-res hero, retina marketing, LinkedIn banners

## Asset assignments

| Channel | Required | Suggested files |
| --- | --- | --- |
| Capterra listing (hero + gallery, 4–6 images, 1280px) | 4 | `1280x800/home.png`, `1280x800/dashboard.png` (if authed), `1280x800/pricing-usd.png`, `1280x800/vs-feedonomics.png` |
| Shopify App Store (hero, 1600x900 + 5 gallery, 1600x900) | 6 | `1920x1080/home.png`, `1920x1080/dashboard.png`, `1920x1080/listings.png`, `1920x1080/listings-health-filter.png`, `1920x1080/channels.png`, `1920x1080/financials.png` |
| Product Hunt (gallery, up to 8) | 8 | `1920x1080/home.png`, `1920x1080/landing-v8.png`, `1920x1080/dashboard.png`, `1920x1080/listings.png`, `1920x1080/financials.png`, `1920x1080/pricing-usd.png`, `1920x1080/enterprise.png`, `1920x1080/onboarding.png` |
| LinkedIn company (hero + banner) | 2 | `1920x1080/landing-v8.png`, `1920x1080/home.png` |

## Re-run

```bash
# Public pages only:
npm run capture

# Full capture (including auth-gated pages):
DEMO_USER_PASSWORD='...' npm run capture

# Custom environment:
CAPTURE_BASE_URL=https://staging.example.com DEMO_USER_PASSWORD='...' npm run capture
```

Write artefacts go to `marketing/screenshots/{1280x800,1920x1080}/<slug>.png`. A run
summary is written to `marketing/screenshots/_last-run.json`.

## Auth-gated captures

The auth-gated screenshots (`dashboard`, `listings`, `listings-health-filter`,
`channels`, `financials`, `onboarding`, `settings-referral`, `billing`,
`enterprise`) require `DEMO_USER_PASSWORD` to be set. If the initial run in this
repo did **not** have that env var, those PNGs currently show the login-redirect
page (they are all the same ~261 KB file size). Re-run with
`DEMO_USER_PASSWORD='...' npm run capture` to regenerate them with real data.

## Files may not be checked in

Screenshots are committed when they are small. Large binary PNGs should be
produced locally by running the script; do not attempt to ship anything above ~5 MB
per file through git. If a screenshot is missing from the repo, run
`npm run capture` to regenerate it.
