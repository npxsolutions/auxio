# Positioning Canvas

> Framework: April Dunford's *Obviously Awesome*. Source of truth for how Palvento is described in every piece of marketing copy. If you are tempted to invent a new phrase on a landing page, check this doc first.
>
> **Wedge (locked April 2026):** Self-serve multichannel feed management for Shopify-led sellers scaling past their store.

---

## 1. Competitive alternatives

What customers compare us to when they are shopping. Ordered by share-of-consideration inside the wedge.

| Alternative | Why they fail for the wedge |
|---|---|
| **Feedonomics** *(primary named competitor)* | Enterprise-only. Quote-form pricing, ~$2,500+/mo floor, managed-services retainer, 30–90 day onboarding. Powerful feed engine, but no self-serve path and no interest in a Shopify merchant doing $25k/mo. |
| **Rithum (ex-ChannelAdvisor / CommerceHub)** | Quote-only. Historic % of GMV model still present on legacy deals. Built for retailers and brands with dedicated channel-ops teams, not for a Shopify founder who wants to add TikTok Shop on a Tuesday. |
| **Shopify Marketplace Connect (Codisto)** | Free up to 50 orders/mo, then 1% of synced-order value capped at $99/mo. Perfectly fine for Amazon / eBay / Walmart only. No TikTok Shop, no Etsy, no OnBuy, thin feed-optimisation, no rules engine, no P&L. This is the true floor of the market — we have to be meaningfully better, not just available. |
| **Baselinker / Base.com** | Strong in EU, weak in US/UK. Interface translated rather than designed. Order-volume pricing from ~€19/mo. Real competitor on price, weak on feed optimisation and Shopify-native workflows. |
| **Sellbrite (GoDaddy)** | $19–$129/mo, self-serve, SKU + order tiered. Closest peer on shape and price. Product has had minimal investment under GoDaddy ownership; feed rules and channel breadth are thin. |
| **Veeqo (Amazon-owned)** | Shipping tier free, inventory from $19/mo. Great price, but it's Amazon's tool — many Shopify merchants will not run their multichannel ops inside their biggest marketplace competitor's product. |
| **Linnworks** | Quote-only, ~$549/mo entry in the US, 40-day implementation. Inventory/warehouse first; feed management is a secondary module. Wrong shape for Shopify-led. |
| **Brightpearl (Sage)** | ERP with a channel bolt-on. Quote-only, $2k+/mo, 60–90 day implementation. Wrong shape entirely. |
| **Shopify + manual CSV** | The true incumbent for Tier 1. Free and infinitely flexible until you try to optimise titles per-channel, enforce pricing floors, or catch a feed rejection before it hits the marketplace. |

---

## 2. Unique attributes

Five things we have that the alternatives — specifically Feedonomics — do not.

1. **Self-serve signup from a Shopify App Store install.** First channel live, first feed syndicated, first error surfaced — all inside ten minutes, no sales call. Feedonomics, Rithum, Linnworks, and Brightpearl all require a demo before you see a price.
2. **Published pricing in five currencies.** $149 / $349 / $799 / Enterprise from $2,000, toggleable between USD, GBP, EUR, AUD and CAD. Nobody in the quote-only tier does this. Sellbrite, Baselinker and Veeqo publish but only in USD / EUR.
3. **Feed optimisation and P&L in one product.** Feedonomics does feeds. A2X does P&L. Shopify Marketplace Connect does neither well. Palvento closes that loop for the Shopify-led operator — the same product that normalises the feed also tells you which SKU on which channel is profitable.
4. **Shopify-native install and sync.** OAuth via the App Store, two-way sync, sub-minute latency, no middleware. Not a connector bolted onto a generic platform — the Shopify install is the primary install path.
5. **Channel breadth at this price band.** Amazon, eBay, TikTok Shop, Etsy, Walmart, OnBuy, BigCommerce, WooCommerce. Sellbrite and Shopify Marketplace Connect cap out at a narrower set; Baselinker's breadth is EU-skewed.

---

## 3. Value (the value, not the attributes)

- **A Shopify merchant can add a channel on a Tuesday afternoon and have clean listings live by Wednesday.** No 40-day onboarding. No solutions architect. No services retainer.
- **Feed rejections are caught at ingest, not at the marketplace.** Error hub surfaces missing GTINs, oversize images, category mismatches, and banned-word violations before they hit Amazon / eBay / TikTok Shop, not after a listing gets taken down.
- **One price structure, no surprise invoices.** Flat monthly, published in five currencies, no percentage of GMV, no per-order fee above plan.
- **Real margin clarity per channel.** The same tool that pushes the feed also reconciles the payout, so merchants see which channel is actually profitable after fees — not just which one has the most orders.
- **Exit is survivable.** Feed data is exportable. Nobody is building a trap; paradoxically that is why they stay.

---

## 4. Best-fit customer

The Shopify-led multichannel operator at $10k–$500k/mo GMV, running Shopify plus 1–5 marketplaces, who has either (a) maxed out Shopify Marketplace Connect's channel coverage, or (b) been quoted $2,500/mo by Feedonomics and bounced. See `icp.md` for the three-tier shape.

---

## 5. Market category

**Self-serve multichannel feed management.**

Not "operating system for commerce." Not "commerce operations platform." The category is narrower and more legible than either of those, and — critically — it is the category the primary acquisition channel (Shopify App Store) already indexes against.

Use this phrase verbatim in copy. Avoid: "commerce OS", "operating system for global commerce", "multichannel ERP", "listing tool", "repricer". The first two overclaim; the last three undersell.

The Enterprise tier still serves sellers who grow into SSO / SLA / data-residency / 10+ channel / multi-region needs. That's a distinct product surface (see `app/enterprise/page.tsx`), not the primary pitch.

---

## 6. Trends we leverage

- **The Shopify App Store is where merchants shop for ops tooling.** Not Google Search, not G2. Ranking well in the App Store is the single highest-leverage channel for the wedge.
- **Feedonomics' acquisition by BigCommerce in 2022 left a gap.** Shopify-led merchants are structurally the wrong buyer for Feedonomics' motion. That gap has not been filled at a self-serve price point.
- **Multi-marketplace as default.** Shopify-only sellers are now the exception above $25k/mo. Amazon + eBay + TikTok Shop + Shopify is the baseline stack. The feed is the bottleneck.
- **AI-drafted listings are table stakes, not a differentiator.** Every vendor has one. The value is in the rules engine that stops the AI draft from getting your listing suppressed on Amazon.
- **Shopify Marketplace Connect as floor.** A free $0–$99 option from Shopify itself now commoditises the narrowest version of the job. That forces every paid product above it to justify the step up on feed quality, channel breadth, and error handling.

---

## 7. Elevator pitch — three lengths

### 6 words
> Every channel. One clean feed.

### 30 words
> Palvento is self-serve multichannel feed management for Shopify-led sellers. Sync Amazon, eBay, TikTok Shop, Walmart, Etsy and more in under ten minutes, with real feed optimisation and honest per-channel P&L — from $149/mo, no sales call.

### 90 seconds
> If you run a Shopify store doing $10k a month or more, adding Amazon, eBay and TikTok Shop is the obvious next move. The problem is that the tool market splits into two halves and neither half fits you.
>
> On one side: Shopify Marketplace Connect, free up to fifty orders then 1% capped at $99. It's fine, but it only covers Amazon, eBay and Walmart, and it doesn't really do feed optimisation — it just syncs.
>
> On the other side: Feedonomics and Rithum. Enterprise feed management, $2,500 a month before you see a demo, managed-services retainers, thirty-to-ninety day onboarding. Powerful, and completely the wrong shape for a Shopify merchant doing a quarter-million a year.
>
> Palvento sits in the gap. Self-serve from the Shopify App Store, up in under ten minutes, covering Amazon, eBay, TikTok Shop, Etsy, Walmart, OnBuy, BigCommerce and WooCommerce. Real feed rules. Error hub that catches GTIN mismatches and banned words before they hit the marketplace. Per-channel P&L so you actually know which marketplace is making money after fees. $149 a month for one channel, $349 for five, $799 for unlimited, published in five currencies, flat, no percentage of revenue.
>
> Enterprise sales is still available for sellers doing multi-region, ten-plus channels, SSO, SLA, data residency — but it's a separate path for the top tier, not the whole pitch. The whole pitch is: you're a Shopify founder, you want to be on every marketplace that matters, and you want the feed to be clean. That's the job.
