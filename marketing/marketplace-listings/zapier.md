# Zapier — Palvento integration brief

**Status:** Submission-ready. Awaiting partner-account approval from Zapier.
**Submission contact:** developers@palvento.com
**Internal owner:** Platform team

## Integration name
Palvento

## Short description (≤140 chars)
Trigger Zaps from any Palvento event — new orders, listing changes, low stock, profit thresholds — across every marketplace you sell on.

## Authentication
- Type: **API Key (Bearer token)**
- Endpoint: `https://api.palvento.com/v1`
- Test endpoint: `GET /v1/me`
- Scopes requested: `read`, `webhooks:write`

## Triggers (instant via webhook)
1. **New order** — fires on `order.created` from any channel.
2. **Order fulfilled** — fires on `order.fulfilled`.
3. **Low stock** — fires on `inventory.low_stock` (threshold per SKU).
4. **Listing error** — fires on `listing.error` (e.g. Amazon listing suppressed).
5. **Sync failed** — fires on `sync.failed` for any connected channel.

## Actions
1. **Create / update listing** — push a draft listing to one or many channels.
2. **Mark order fulfilled** — attach carrier + tracking and notify the source channel.
3. **Adjust inventory** — set absolute or delta stock for a SKU.
4. **Send order note** — append an internal note visible to support.

## Search
- **Find order by external ID** — across any channel.
- **Find SKU by code or barcode (EAN/UPC).**

## Sample use cases (for the listing page)
- New Amazon order → row in Google Sheets → Slack alert to ops.
- Low stock → re-order PO draft in Notion → DM to the buying team.
- Listing error on Etsy → Linear ticket → assigned to the merchandising lead.

## Submission notes
- Test account credentials provisioned on `sandbox.palvento.com`.
- Demo video walkthrough at `/marketing/marketplace-listings/zapier-demo.mp4` (TODO — record).
- Categories: **Commerce · eCommerce**.
