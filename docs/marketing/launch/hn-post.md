# Hacker News — Show HN Post

Post Tuesday 6am PT (~6 hours after PH launch so the two traffic sources don&apos;t clash).

---

## Title (under 80 chars)
> **Show HN: Palvento – Self-serve multichannel feed management from $149/mo**
> *(74 chars)*

## Body (under 1500 chars)

> Hi HN — I&apos;m Nick, and this is Palvento.
>
> I built it because the multichannel feed-management market has a hole in it. On one side: Shopify Marketplace Connect, free up to 50 orders, covers Amazon/eBay/Walmart, no real feed optimisation. On the other: Feedonomics, $2,500+/mo, 30–90 day onboarding, managed services. Nothing in between for a Shopify merchant doing $25k–$500k/mo who wants to add TikTok Shop on a Tuesday afternoon.
>
> Palvento is self-serve multichannel feed management. Install from the Shopify App Store, connect Amazon, eBay, TikTok Shop, Etsy, Walmart, OnBuy, BigCommerce, or WooCommerce, first feed live in under ten minutes. Real feed rules, error hub that catches GTIN mismatches and banned words before they hit the marketplace, per-channel P&L so you know which marketplace is profitable after fees. $149/mo for one channel, $349 for five, $799 for unlimited — published pricing, no percentage of revenue.
>
> Tech: Next.js 16 on Vercel, Postgres via Supabase, Node worker jobs on Railway for the marketplace sync fan-out, PostHog for product analytics, Stripe for billing. Developer API is REST + webhooks, typed SDK published to npm; everything in the UI is available over API.
>
> Live demo: https://palvento-lkqv.vercel.app
>
> Honest feedback welcome. Three things I&apos;d love to hear on:
> 1. Is the self-serve feed management positioning clear, or does it undersell what you&apos;d want from a product like this?
> 2. Per-channel P&L — is the design legible?
> 3. What would we need to ship to make you switch off a spreadsheet / Linnworks / your Frankenstein stack?
>
> Happy to answer anything technical or commercial.

---

## Prepared answers — 5 most likely critical comments

### 1. "Isn't this just Linnworks / Brightpearl / ChannelAdvisor with a fresh coat of paint?"

> Fair question. Three concrete differences: (1) We close the loop to settled P&L, which none of the three do without a separate accounting integration and a batch lag. (2) Order-volume pricing, not a % of revenue — Linnworks and ChannelAdvisor both gate their real tiers behind sales conversations with % models. Ours is on the public pricing page. (3) Ten-minute self-serve onboarding, no implementation consultant. Brightpearl&apos;s typical implementation is 60–90 days. Mine is &quot;connect two OAuth apps and go&quot;.
>
> The broader answer is that the incumbents are excellent at the problem set of 2015. The problem set of 2026 is different — more channels, multi-currency, AI-assisted ops, API-first — and the product shape that fits it is different too.

### 2. "Multi-currency P&L is an accounting problem, not an ops problem. Isn't Xero + A2X enough?"

> A2X into Xero gives you an accurate <em>accounting</em> P&L, lagged by 7–14 days, in one currency. That&apos;s correct and valuable for your bookkeeper. It&apos;s insufficient for operational decisions — repricing, channel pruning, SKU rationalization — which happen on a weekly or daily cadence. Palvento shows settled P&L at the SKU-channel grain, in both the marketplace currency and your reporting currency, with FX spread explicit. That&apos;s a different artifact with a different audience.

### 3. "Why should I trust a pre-PMF SaaS with my commerce data?"

> Honest answer: by starting small. Connect a test store, or a sandbox Amazon account, and watch it for two weeks. Everything is read-only until you explicitly enable write-backs. We publish data-retention and deletion endpoints at /developers. SOC 2 Type II is on the public roadmap at /trust — we&apos;re in the observation window now. And the whole point of the Developer API is that your data is exportable any time — we designed it to be easy to leave, because that&apos;s the only way we earn the right to have customers stay.

### 4. "Isn't order-volume pricing just a flat-fee rename? What about abuse?"

> It&apos;s a tiered flat fee indexed to order count, not revenue. So a high-AOV luxury brand and a low-AOV consumables brand pay similarly at similar volume, which reflects the actual cost of serving them (API calls, sync events, storage) rather than punishing the profitable ones. Abuse mitigation: if you exceed the tier by more than 20% two months running, we auto-upgrade; you never get surprise-billed. Overage on API calls above a generous ceiling is charged at cost. Pricing page is public.

### 5. "Why not just call it a 'listing tool' or a 'multichannel connector'?"

> Because those labels undersell the job. A listing tool pushes titles and images. A connector syncs inventory. Palvento does both — but also runs a feed rules engine that catches errors before they hit the marketplace, and shows per-channel P&L after fees, shipping, and FX. "Self-serve multichannel feed management" is the category we use: it&apos;s precise, it&apos;s the phrase operators already search for, and it maps to the Shopify App Store taxonomy. We deliberately avoid "commerce OS" or "operating system for commerce" — those overclaim and invite the wrong comparison set. April Dunford&apos;s *Obviously Awesome* is the playbook.
