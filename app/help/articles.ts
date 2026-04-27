// Help centre content. Articles keyed by slug. Add new entries here and they
// show up at /help/[slug] and in the index groups below.

export type Article = {
  title: string
  summary: string
  lastUpdated: string // ISO date
  group: string
  body: string // plain text, paragraphs separated by blank lines. Lines starting with "## " render as H2 anchors.
}

export const GROUPS = [
  {
    title: 'Getting started',
    slugs: ['connect-channel', 'import-products', 'see-profit'],
  },
  {
    title: 'Channels',
    slugs: ['connect-shopify', 'connect-ebay', 'woocommerce-setup', 'etsy-setup', 'bigcommerce-setup'],
  },
  {
    title: 'Operations',
    slugs: ['see-true-profit', 'set-first-repricing-rule', 'forecasting', 'bundles', 'costs'],
  },
  {
    title: 'API & developer',
    slugs: ['api-overview', 'webhooks', 'sdks'],
  },
  {
    title: 'Account',
    slugs: ['billing', 'team', 'security'],
  },
]

export const ARTICLES: Record<string, Article> = {
  // ───────────────────────────────── Getting started ─────────────────────────
  'connect-channel': {
    title: 'Connect your first channel',
    summary: 'A five-minute walk-through of connecting any sales channel to Palvento.',
    lastUpdated: '2026-04-01',
    group: 'Getting started',
    body: `Palvento's core job is to collapse every marketplace, storefront, and ad account into one profit-aware view. Nothing works until a channel is connected.

## Pick your starting channel
Start with wherever most of your revenue lives today. If that's Shopify, use Shopify; if it's eBay, use eBay. The order matters less than you think — you can connect any number of additional channels later without re-running setup.

## Run the OAuth flow
From the onboarding screen or Settings → Channels, click the marketplace you want. You'll be redirected to that platform's permissions page. Palvento only asks for the scopes it genuinely needs: read access to orders, listings, and fees; write access only where repricing or inventory sync is involved.

## Confirm the backfill window
On first connect, Palvento pulls the last 90 days of orders by default. You can change the window up to 24 months on the confirmation screen. A longer window produces richer historical charts but takes longer to complete.

## Watch for the green dot
Once OAuth is complete, the channel appears in your dashboard with a status indicator. Grey means pending, amber means partially synced, green means caught up. Most shops hit green inside thirty minutes; larger catalogues (50k+ SKUs) can take a few hours.

## Next step
As soon as you see real numbers, head to the dashboard's Profit view. That's the single screen Palvento is built around — every other feature (repricing, forecasting, alerts) feeds from it.`,
  },

  'import-products': {
    title: 'Import products and costs',
    summary: 'How Palvento ingests your catalogue and where to add cost-of-goods data.',
    lastUpdated: '2026-03-28',
    group: 'Getting started',
    body: `Palvento does not force a separate product catalogue. Whatever your channels already have becomes the source of truth; Palvento sits on top.

## Automatic product sync
When you connect a channel, every listing is pulled into Palvento's unified product view. We match across channels using GTIN, MPN, and SKU (in that order). Identical products sold on Shopify and eBay appear as one entity, with each listing surfaced underneath.

## Where costs come from
Palvento reads three cost sources automatically: channel fees (from the marketplace's own APIs), payment processor fees (Stripe, Shopify Payments, PayPal), and shipping (where available on the order). Advertising cost is pulled from connected ad accounts.

## Adding cost of goods (COGS)
COGS is the one number only you know. Three ways to populate it:

— Per-SKU: upload a CSV from Settings → Costs, or edit inline in the Products view.
— Per-supplier: if you've connected a purchase-order workflow, Palvento averages COGS across recent POs automatically.
— Bulk margin: as a last-resort placeholder, set a blanket margin assumption per category until real data arrives.

## Why this matters
Every profit figure you see downstream — dashboard, digest emails, forecasting — derives from these inputs. Getting COGS in on day one is the highest-leverage ten minutes you'll spend with Palvento.`,
  },

  'see-profit': {
    title: 'See your first profit number',
    summary: 'From connected channels to a meaningful profit figure in under an hour.',
    lastUpdated: '2026-04-02',
    group: 'Getting started',
    body: `Getting to a real profit figure requires four data streams: orders, channel fees, payment fees, and cost of goods. Palvento handles the first three automatically; you supply COGS.

## The flow
Once a channel is connected and COGS is populated, open Dashboard → Profit. You'll see true profit per order, per SKU, per channel, and in aggregate — all for the selected date range.

## What "true profit" means
We subtract everything Palvento can see: the marketplace's take rate, listing fees, payment processor fees, shipping (where known), advertising cost, refunds, and COGS. The remainder is what actually hits your bank account.

## Checking a single order
Click any row to see the breakdown. Every deduction is traceable to a source — for a Shopify order, you'll see the exact line items from the Shopify Payments payout, the ad click that led to it (if any), and the linked purchase order for COGS.

## If a number looks off
Usually it's one of three things:
— COGS is missing for that SKU (shows with a warning icon).
— A channel fee hasn't synced yet (orders show as "pending reconciliation").
— You have a manual refund or discount Palvento can't see (add it to the order via the override button).`,
  },

  // ───────────────────────────────── Channels ────────────────────────────────
  'connect-shopify': {
    title: 'Connect Shopify',
    summary: 'Install the Palvento app and approve scopes — orders, payouts, and fulfilment.',
    lastUpdated: '2026-04-05',
    group: 'Channels',
    body: `Shopify is the fastest channel to connect. The entire flow runs inside Shopify's standard OAuth and typically completes in under two minutes.

## Install the app
From Palvento → Channels → Shopify, click Connect. You'll be asked for your myshopify.com subdomain and redirected to Shopify's app approval screen.

## Scopes we request
read_orders, read_products, read_inventory, read_fulfilments, read_shopify_payments_payouts, read_shopify_payments_disputes, and write_prices (only if you plan to use Palvento's repricing).

## Payouts and fees
Palvento reads the Shopify Payments payout API directly, which means processor fees, reserves, and refunds flow into your profit view automatically. If you use a third-party gateway (PayPal Express, Klarna), connect those too via Settings → Payment processors.

## Refunds and partial refunds
Both are synced in real time via webhook. A partial refund on a multi-line order is attributed proportionally to the refunded line items.

## Webhooks installed
Palvento registers webhooks for orders/create, orders/updated, orders/paid, refunds/create, products/update, and app/uninstalled. If you uninstall the Palvento app, all webhooks are cleaned up and Palvento stops syncing immediately.

## Multi-store
Running multiple Shopify stores under one brand. Connect each separately — each gets its own row in the channel list and contributes to the unified profit view.`,
  },

  'connect-ebay': {
    title: 'Connect eBay',
    summary: 'OAuth, the 18-month order history quirk, and how Palvento handles eBay fee structures.',
    lastUpdated: '2026-04-07',
    group: 'Channels',
    body: `eBay's API is rich but has sharper edges than Shopify. Here's what to know.

## OAuth flow
From Channels → eBay, click Connect. You'll be redirected to eBay's consent screen (sign in with the account that owns the listings, not a manager account) and asked to approve read access to orders and listings, plus limited write access for repricing.

## The 18-month order history limit
eBay's Fulfillment API returns at most 90 days of orders in a single call, and the full archive only goes back roughly 18 months. On first connect, Palvento pages through the entire 18-month window automatically — this can take 30-60 minutes for active sellers. You'll see progress in the sync status panel.

## Fee structure
eBay's fee stack is the most complex of any channel Palvento supports: final value fees (variable by category), ad fees (if you're using Promoted Listings), international fees, shipping labels purchased through eBay, store subscriptions, and the Managed Payments processing fee. Palvento reads all of these from the transactions API and reconciles them against each order line.

## Promoted Listings
If you use Promoted Listings Standard or Advanced, the ad spend is attributed back to the order that converted. In the profit view, you can toggle "include ad cost" to see both the gross fee profit and the net-of-ads profit.

## Listing sync
Active, sold, unsold, and ended listings all appear. Palvento refreshes listings hourly by default and listens to eBay's inventory webhooks for near-real-time stock updates.`,
  },

  'woocommerce-setup': {
    title: 'WooCommerce setup',
    summary: 'REST API keys, webhook registration, and the WordPress plugin.',
    lastUpdated: '2026-03-20',
    group: 'Channels',
    body: `WooCommerce runs on your own WordPress host, so setup is more hands-on than the managed marketplaces — but only by one extra step.

## Generate API credentials
In your WordPress admin, go to WooCommerce → Settings → Advanced → REST API → Add key. Choose Read/Write permission and copy the consumer key and secret. Paste them into Palvento's WooCommerce connect screen along with your store URL.

## Webhooks
Palvento registers webhooks automatically once credentials verify. If your WordPress site is behind strict Cloudflare rules or a staging-only firewall, you may need to allow-list Palvento's IP ranges (listed on the connect screen).

## The companion plugin (optional)
For sellers who want one-click install, we publish a free WordPress plugin that handles key creation, webhook registration, and health checks. Search "Palvento for WooCommerce" in the WP plugin directory.

## Currency and tax
WooCommerce stores multiple currencies per order if your store supports it. Palvento respects the order's recorded currency and converts to your reporting currency using the exchange rate at the order date. Tax is excluded from revenue calculations by default; toggle in Settings → Reporting.`,
  },

  'etsy-setup': {
    title: 'Etsy setup',
    summary: 'OAuth v3, Etsy Payments reconciliation, and listing fee handling.',
    lastUpdated: '2026-03-18',
    group: 'Channels',
    body: `Etsy moved to OAuth 2.0 with a hard-capped rate limit. Palvento handles both.

## Connect via OAuth 2.0
From Channels → Etsy, click Connect. You'll be sent to Etsy's consent screen. Approve read access to transactions and listings plus Etsy Payments ledger read access.

## Etsy Payments vs other gateways
If you're on Etsy Payments (most sellers are), the full fee stack — transaction fees, payment processing, listing fees, offsite ads — is available from Etsy's ledger API. Palvento parses this automatically. For the small number of sellers still on PayPal-only, some fees need to be supplied manually.

## Offsite ads
Etsy auto-enrolls high-volume sellers in Offsite Ads, which charges 12–15% on attributed orders. Palvento surfaces these as a separate line in the fee breakdown so you can see at a glance how much offsite conversion is costing you.

## Rate limits
Etsy allows 10 requests per second per app. Palvento's sync queue respects this globally; on first connect, a large shop can take 60-90 minutes to fully populate.`,
  },

  'bigcommerce-setup': {
    title: 'BigCommerce setup',
    summary: 'API account creation, store hash, and the events webhook.',
    lastUpdated: '2026-03-14',
    group: 'Channels',
    body: `BigCommerce uses an API account model — similar to WooCommerce's REST keys but generated inside the BigCommerce admin.

## Create an API account
In BigCommerce admin, go to Settings → API → API accounts → Create. Choose "V2/V3 API token", name it "Palvento", and grant these OAuth scopes: Orders (read-only), Products (read-only), Customers (read-only), Information & Settings (read-only), Store Inventory (read-only).

## Copy credentials
You'll see the Client ID, Access token, and API path. Paste all three into Palvento's BigCommerce connect screen. The store hash is the subdomain-like string in the API path (e.g. stores/abc1defgh/v3).

## Webhooks
Palvento subscribes to store/order/created, store/order/updated, store/order/statusUpdated, and store/refund/created. These drive real-time sync; the hourly poll acts as a safety net.

## Multi-channel on BigCommerce
If you use BigCommerce's Channel Manager to push to Amazon or eBay, connect those platforms directly in Palvento as well — Palvento's attribution works better when talking to each marketplace as a first-class source.`,
  },

  // ───────────────────────────────── Operations ──────────────────────────────
  'see-true-profit': {
    title: 'Understanding true profit',
    summary: 'What Palvento includes (and excludes) in the profit figure shown everywhere.',
    lastUpdated: '2026-04-08',
    group: 'Operations',
    body: `"Profit" is a loaded word. Most tools show gross margin and call it profit. Palvento shows the number that actually lands in your bank.

## Formula
True profit = gross revenue − channel fees − payment processing − shipping − advertising − refunds − cost of goods.

## What's included automatically
Channel fees, payment processor fees, advertising cost (from connected ad accounts), refunds and chargebacks, and shipping labels purchased through the channel.

## What you supply
Cost of goods sold. Optionally: shipping materials, inbound freight, storage (for 3PL/FBA sellers), and manual overheads allocated per-order.

## What's excluded by default
Fixed overheads (salaries, rent, software subscriptions) — these belong in your P&L, not per-order profit. Taxes collected from customers (VAT, sales tax) — we treat these as pass-through.

## Per-SKU vs per-order
Both are available. Per-order is the source of truth; per-SKU is derived by allocating order-level costs (shipping, ads) proportionally to revenue across the order's line items.

## Negative profit warnings
Palvento flags any order with negative true profit in red. Usually it's one of three causes: a discount code that stacked below cost, a high-return SKU that tripped into loss after refund, or advertising attribution that landed heavily on a low-margin product.`,
  },

  'set-first-repricing-rule': {
    title: 'Set your first repricing rule',
    summary: 'Start with a floor, ceiling, and margin target. Palvento handles the rest.',
    lastUpdated: '2026-04-03',
    group: 'Operations',
    body: `Repricing is the feature that pays for itself fastest. The common mistake is treating it like a lever to pull only when you want to react. Done properly, it runs continuously.

## Before you start
You need three numbers per SKU: a cost floor (the price below which you refuse to sell), a ceiling (the price above which you believe demand falls off a cliff), and a margin target (the margin you'd like to hit when competition allows).

## Create the rule
From Repricing → New rule, choose a SKU or set of SKUs. Enter the three numbers. Pick a repricing cadence — 15 minutes is the default and covers 95% of use cases; hourly is fine for low-volume, high-consideration items.

## How Palvento decides a price
At each tick, Palvento looks at live competitor prices (for channels that expose them), your current velocity, stock position, and the target margin. It picks the highest price that keeps you in the Buy Box (or equivalent) without breaching your ceiling.

## Watching a rule run
The rule's detail view shows every price change Palvento made, the reason, and the outcome (did velocity hold, did competition respond). The first 48 hours of any rule are the most informative — expect some oscillation before Palvento settles into a rhythm.

## When to pause
If a rule is chasing a competitor below your floor, Palvento will hold at the floor and email you. That's a signal the market has changed and you need to re-examine the SKU's economics.`,
  },

  'forecasting': {
    title: 'Forecasting',
    summary: 'How Palvento projects revenue and profit forward, and what drives the model.',
    lastUpdated: '2026-03-25',
    group: 'Operations',
    body: `The forecast panel on the dashboard projects revenue and profit 30, 60, and 90 days out. It's directional, not magical.

## What the model uses
Last 90 days of orders by channel and SKU, seasonality signals from the previous year (if we have that much history), stock position, and advertising commitment.

## What it doesn't know
Your product launch calendar, your discount plans, or anything happening outside Palvento. For planning-grade forecasts, combine Palvento's baseline with your own lift assumptions.

## Confidence bands
Every forecast shows a 10/50/90 percentile band. A wide band means the model has low confidence — usually because your history is short, seasonal, or noisy.`,
  },

  'bundles': {
    title: 'Bundles',
    summary: 'Grouping SKUs for reporting, repricing, and inventory logic.',
    lastUpdated: '2026-03-22',
    group: 'Operations',
    body: `Bundles in Palvento are logical groupings — they don't change how your channels list products, only how Palvento treats them internally.

## Why bundle
Common reasons: reporting (treat all variants of a product as one line), inventory (deduct from a shared stock pool), or repricing (apply the same rule to a family of similar items).

## Creating a bundle
From Products → Bundles → New. Pick a parent SKU and add child SKUs. Choose whether costs roll up or are tracked separately.

## Bundles vs kits
A kit is a distinct product composed of multiple child products sold as one. Palvento supports kits separately — see the kits guide.`,
  },

  'costs': {
    title: 'Managing costs',
    summary: 'Bulk updates, supplier-linked COGS, and overriding per-order costs.',
    lastUpdated: '2026-03-30',
    group: 'Operations',
    body: `Costs are the one input Palvento can't read from a third-party API. Keeping them accurate is what separates a dashboard from a decision-support tool.

## Three ways to maintain COGS
CSV upload (Settings → Costs → Import), per-SKU manual edit, or link to a supplier whose purchase orders you've entered into Palvento.

## Supplier-linked COGS
When POs are recorded against a supplier, Palvento can auto-calculate a weighted-average cost per SKU. Set a "re-average window" (default 90 days) in the supplier's settings.

## Overriding per-order
Occasionally you'll have an order with unusual economics — a wholesale discount, a returned-for-rework unit. Open the order and click "Override costs" to set order-specific values that don't disturb the SKU default.`,
  },

  // ───────────────────────────────── API & developer ─────────────────────────
  'api-overview': {
    title: 'API overview',
    summary: 'Palvento\'s read/write API, authentication, and rate limits.',
    lastUpdated: '2026-04-06',
    group: 'API & developer',
    body: `The Palvento API is a RESTful HTTPS service at api.palvento.com/v1. Everything you can do in the dashboard — read orders, pull profit reports, trigger repricing — is available programmatically.

## Authentication
Bearer tokens. Generate one from Settings → API → New token. Scope each token to the minimum required (read-only tokens are the default). Tokens can be revoked instantly and are never shown again after creation — store them securely.

## Base URL and versioning
All endpoints live under /v1. Breaking changes graduate to /v2 with a twelve-month overlap; non-breaking additions ship to /v1 continuously. The current version is documented at /developers.

## Rate limits
1,000 requests per minute per token, burst to 100 requests per second. Exceeding triggers a 429 with a Retry-After header. For bulk data needs, prefer the export endpoints (see below) over paginated list calls.

## Core resources
/orders, /products, /channels, /profit-reports, /repricing-rules, /webhooks. Each supports standard REST verbs plus filter and sort query parameters documented inline at /developers/reference.

## Exports
For large datasets (>10k rows), hit /v1/exports with the resource and filter you want. Palvento returns a signed URL to a gzipped JSON file, generated asynchronously within seconds to a few minutes depending on volume.

## Errors
All errors return a structured JSON body with code, message, and (where relevant) hint. Codes are stable across versions — safe to branch on.`,
  },

  'webhooks': {
    title: 'Webhooks',
    summary: 'Receive real-time events — orders, refunds, repricing actions — at your own endpoint.',
    lastUpdated: '2026-04-04',
    group: 'API & developer',
    body: `Palvento emits webhooks for any state change that might matter to another system in your stack.

## Events available
order.created, order.updated, order.refunded, repricing.action, channel.connected, channel.disconnected, product.out_of_stock, alert.triggered. The full list is at /developers/webhooks.

## Registering an endpoint
POST to /v1/webhooks with { url, events, secret }. The URL must be HTTPS and respond with a 2xx within 10 seconds. Palvento generates a signing secret you'll use to verify authenticity on your end.

## Signature verification
Every webhook carries an X-Palvento-Signature header — HMAC-SHA256 of the raw body with your secret. Always verify; never trust the payload otherwise. Sample verification code for Node, Python, and Go is in the developer docs.

## Delivery and retries
Palvento retries failed deliveries with exponential backoff over 24 hours: 5s, 30s, 5m, 30m, 2h, 6h, 24h. After 24 hours of failure, the endpoint is marked degraded and you're emailed. If no 2xx ever arrives, the event is dropped (we don't store events forever).

## Idempotency
Every event carries an event_id. Store the most recent N event IDs and discard duplicates — network weather causes occasional redelivery.

## Testing
From Settings → API → Webhooks, click "Send test event" to trigger a harmless ping at your endpoint. Useful in CI and during initial setup.`,
  },

  'sdks': {
    title: 'SDKs and client libraries',
    summary: 'Official clients for Node, Python, Go, and Ruby.',
    lastUpdated: '2026-03-10',
    group: 'API & developer',
    body: `The HTTP API is the source of truth, but official SDKs handle auth, retries, and pagination for you.

## Available clients
@palvento/node, palvento-python, github.com/palvento/palvento-go, and palvento-ruby. All are MIT-licensed and tracked at github.com/palvento.

## Installation
npm install @palvento/node, pip install palvento, go get github.com/palvento/palvento-go, gem install palvento.

## Versioning
SDKs follow the API version they target (@palvento/node@1.x maps to /v1). Minor version bumps add endpoints; major version bumps require code changes.`,
  },

  // ───────────────────────────────── Account ─────────────────────────────────
  'billing': {
    title: 'Billing',
    summary: 'Plans, invoices, and how we handle changes mid-cycle.',
    lastUpdated: '2026-03-08',
    group: 'Account',
    body: `Palvento bills monthly or annually via Stripe. Upgrades take effect immediately, prorated; downgrades apply at the next renewal.

## Invoices
Available from Settings → Billing. Each invoice breaks down base plan, add-ons, and usage (if your plan has metered components).

## Changing payment method
Add a card or update an existing one from Settings → Billing → Payment methods. We don't store card numbers — that's all handled by Stripe.

## Cancelling
Cancel any time from Settings → Billing → Cancel plan. Your account stays active until the end of the paid period, and your data is preserved for 60 days in case you come back.`,
  },

  'team': {
    title: 'Team and invites',
    summary: 'Invite teammates, set roles, and scope access by channel.',
    lastUpdated: '2026-03-05',
    group: 'Account',
    body: `Bring your ops team into Palvento without giving them your login.

## Inviting
Settings → Team → Invite. Enter an email and pick a role. They receive an email with a magic link that's valid for 7 days.

## Roles
Owner (everything, including billing), Admin (everything except billing), Operator (read/write on operations — orders, listings, repricing), Viewer (read-only).

## Scoped access
Operators and Viewers can be restricted to a subset of channels. Useful if an agency manages your eBay presence but not your Shopify.`,
  },

  'security': {
    title: 'Security and data handling',
    summary: 'Encryption, retention, SSO, and what we do with your data.',
    lastUpdated: '2026-04-01',
    group: 'Account',
    body: `Palvento is SOC 2 Type II in progress (final audit Q3 2026). Here's what's in place today.

## Encryption
TLS 1.3 in transit, AES-256 at rest. Tokens for connected channels are encrypted with per-tenant keys.

## Data retention
Order and product data is retained for the lifetime of your account. On cancellation, data is soft-deleted for 60 days (recoverable) and hard-deleted thereafter.

## SSO
SAML 2.0 SSO is available on the Business plan and above. We support Okta, Google Workspace, Azure AD, and generic SAML providers.

## What we do with your data
We use it to provide the product. We do not sell, share, or use your order data for external analytics or training. Aggregated, anonymised benchmarks (e.g. "average eBay take rate by category") may be surfaced back to all customers but cannot be traced to any individual shop.`,
  },
}

// Build a lookup from slug → group title for sidebar highlighting.
export function groupForSlug(slug: string): string | null {
  for (const g of GROUPS) {
    if (g.slugs.includes(slug)) return g.title
  }
  return ARTICLES[slug]?.group ?? null
}
