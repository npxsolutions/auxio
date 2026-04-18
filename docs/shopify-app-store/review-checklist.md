# Shopify App Store — Submission Review Checklist

Pre-submission checklist for Palvento's Shopify App Store listing. Each item must be verified before submitting for review.

## App requirements

- [x] App uses HTTPS for all endpoints
- [x] Proper OAuth flow (authorization code grant via `/api/shopify/connect` + `/api/shopify/callback`)
- [x] No iframes — app is embedded via Shopify App Bridge (configured in `shopify.app.toml`)
- [x] Webhook HMAC-SHA256 validation (`app/api/shopify/webhooks/_verify.ts`)
- [x] GDPR webhooks implemented:
  - [x] `customers/data_request` (`app/api/shopify/webhooks/customers-data-request/route.ts`)
  - [x] `customers/redact` (`app/api/shopify/webhooks/customers-redact/route.ts`)
  - [x] `shop/redact` (`app/api/shopify/webhooks/shop-redact/route.ts`)
- [x] App configuration in `shopify.app.toml` with correct scopes (`read_orders,read_products,read_inventory,write_products`)
- [ ] Session token authentication (verify App Bridge session tokens on all embedded routes)
- [ ] Rate limiting compliance with Shopify API rate limits (leaky bucket)
- [ ] App passes `shopify app dev` validation
- [ ] App passes `shopify app check` CLI validation

## Listing assets

- [ ] App icon — 1024x1024 PNG, no rounded corners (Shopify adds them)
- [ ] Screenshots — minimum 3, recommended 5:
  - [ ] Feed health dashboard
  - [ ] Multi-channel sync view
  - [ ] AI enrichment in action
  - [ ] Validation rules / error detection
  - [ ] P&L / margin tracking
- [ ] Promotional banner (1600x900) — optional but recommended
- [ ] Demo video or demo store URL

## Legal & support

- [ ] Privacy policy URL — `palvento.com/privacy`
- [ ] Terms of service URL — `palvento.com/terms`
- [ ] Support URL — `palvento.com/help`
- [ ] Contact email — `hello@palvento.app`
- [ ] GDPR/data handling documentation

## Technical verification

- [x] OAuth callback stores access token securely (Supabase `channels` table, encrypted at rest)
- [x] Webhook registration on app install (13 webhook topics registered in callback)
- [x] App uninstall handler cleans up data (`app/api/shopify/webhooks/app-uninstalled/`)
- [ ] Verify all API calls respect Shopify's 2 requests/second rate limit
- [ ] Test OAuth flow end-to-end on a development store
- [ ] Test app uninstall + reinstall flow
- [ ] Verify app works on mobile (Shopify Mobile app)
- [ ] Test with multiple Shopify plans (Basic, Shopify, Advanced)

## Billing integration

- [ ] Shopify billing API integration (or document that billing is handled externally via Stripe)
- [ ] If using external billing: clear disclosure in app listing description
- [ ] Free trial flow works correctly (14-day trial)

## Pre-submission testing

- [ ] Install on 2+ development stores
- [ ] Connect at least one marketplace channel end-to-end
- [ ] Verify product sync pulls data correctly
- [ ] Verify webhook delivery and processing
- [ ] Load test with 1,000+ products
- [ ] Review Shopify's [app requirements](https://shopify.dev/docs/apps/launch/app-requirements) checklist
- [ ] Review Shopify's [protected customer data](https://shopify.dev/docs/apps/launch/protected-customer-data) requirements

## Notes

**Already implemented:**
- Full OAuth flow with CSRF protection
- GDPR mandatory webhooks (all 3)
- HMAC webhook signature validation
- Webhook registration for orders, products, inventory, and app lifecycle
- Proper access token storage with Supabase RLS

**Still needed:**
- Session token verification for embedded app routes
- Shopify API rate limit handling (leaky bucket compliance)
- App listing assets (icon, screenshots, video)
- Legal pages (privacy, terms, help center)
- Shopify CLI validation pass
- Development store end-to-end testing
