# Pricing Intelligence — Multichannel Feed Management

> Primary research, April 2026. Pricing pages scraped live via Firecrawl and summarised here (no verbatim copy). Source URLs below each row. Numbers are as advertised to the public; quoted enterprise deals are noted as **quote-only** where the vendor does not publish a floor.

This doc exists to back one decision: **what should Palvento's pricing look like for the Shopify-led multichannel feed management wedge?** Everything else follows.

---

## 1. Competitor-by-competitor

### Feedonomics (primary named competitor)
- **Public pricing:** None. The entire pricing page is a quote form segmented by annual revenue (tier steps at <$250k, $250k–$1M, $1M–$5M, $5M–$20M, $20M–$100M, $100M–$250M, $250M+).
- **Public floor (from field research + agency quotes consistently cited across forums and vendor RFPs):** Quoted starts roughly $2,500–$3,500/mo on multi-year annual contracts. Enterprise clients regularly pay $8k–$20k+/mo.
- **Model:** Flat subscription plus managed-services retainer. Vendor makes the point explicitly: *never a percentage of revenue.*
- **What triggers a sales call:** Everything. There is no self-serve path.
- **Upsell mechanics:** Order Orchestration module, AI agents module, onboarding "full-service" tier.
- **Source:** https://feedonomics.com/pricing/

### Rithum (formerly ChannelAdvisor + CommerceHub merger)
- **Public pricing:** None. The "pricing" URL returns a marketing page with a Contact form.
- **Public floor (industry reports, SEC filings from the ChannelAdvisor era):** $2,500–$4,000/mo entry, with a meaningful percentage-of-GMV component historically (0.5%–2%). Enterprise deals $10k+/mo.
- **Model:** Flat subscription **plus** a variable percentage of GMV on the Marketplace Listings product.
- **What triggers a sales call:** Everything. No self-serve.
- **Upsell mechanics:** Delivery-date prediction, shipping-label management, retailer-controlled fulfilment.
- **Source:** https://www.rithum.com/pricing

### Linnworks
- **Public pricing:** None on the page — "request your quote" CTA throughout.
- **Public floor (their own FAQ + sales quotes):** Plans **priced on order volume** (their words), not revenue. Entry Linnworks Plus tier widely quoted at $549/mo (annual) in the US, £399 in the UK. Listing, WMS, and SkuVault add-ons each increase the base.
- **Model:** Tiered by monthly order volume with overages, annual contract, add-on modules.
- **What triggers a sales call:** Any purchase — there is no self-serve checkout.
- **Upsell mechanics:** Listing module, Warehouse Management, SkuVault Enhanced Warehouse, Forecasting (flat fee), additional channel connections.
- **Source:** https://www.linnworks.com/pricing/

### Brightpearl (Sage)
- **Public pricing:** None. "Get a custom quote by speaking to our experts."
- **Public floor (reseller price sheets + public RFP responses):** $2,000–$4,000/mo entry, typical deployment $5k–$9k/mo all-in. 60–90 day implementation standard.
- **Model:** Custom annual contract, per-seat + per-module.
- **What triggers a sales call:** Everything. ERP-style sales motion.
- **Upsell mechanics:** Inventory Planning, Retail OS modules, multi-entity add-ons.
- **Source:** https://www.brightpearl.com/pricing

### Baselinker (now Base.com)
- **Public pricing:** Three named plans — **Freemium**, **Business**, **Enterprise**. 14-day free trial on all features.
- **Public prices (as publicly listed in EU markets):** Free tier (100 orders/mo limit), Business ~€19–€99/mo tiered by order count (~€19/500 orders, ~€49/2k, ~€99/10k), Enterprise quote-only above that.
- **Model:** Order-volume tiers. Stronger in EU; UI translated rather than localised.
- **What triggers a sales call:** Enterprise tier only.
- **Upsell mechanics:** Order-count bands, AI add-ons, WMS module.
- **Source:** https://baselinker.com/en/subscriptions/ (redirects to base.com)

### Sellbrite (GoDaddy-owned)
- **Public pricing:** Published, tiered by SKU + order volume. Two product lines: Sellbrite (standalone) and Sellbrite for Shopify.
- **Public prices (published historically, unchanged through April 2026):** From **$19/mo** (100 orders, 30 SKUs) up to **$129/mo** (unlimited orders, 10k+ SKUs). 14-day free trial, no card.
- **Model:** Flat monthly, SKU + order tiered. No percentage of revenue.
- **What triggers a sales call:** None — pure self-serve.
- **Upsell mechanics:** SKU count, order count, channel count.
- **Source:** https://www.sellbrite.com/pricing

### Veeqo (Amazon-owned)
- **Public pricing:** Published. **Shipping tier is free** (Amazon subsidises via label revenue). Inventory tier from **$19/mo**. High-Volume tier from **$350/mo**.
- **Model:** Flat monthly based on order volume; shipping free forever (Amazon makes it back on label spread).
- **What triggers a sales call:** None at the published tiers.
- **Upsell mechanics:** Inventory features, listings features, high-volume tier.
- **Source:** https://www.veeqo.com/pricing
- **Caveat:** A Shopify merchant using Veeqo is selling into Amazon's house. Strong product, but a lot of merchants don't want to run their ops on their biggest competitor's tooling.

### Shopify Marketplace Connect (Codisto, owned by Shopify)
- **Public pricing:** Native in Shopify admin. **First 50 marketplace-synced orders per month free, then 1% of additional synced-order value, capped at $99/mo.**
- **Model:** Usage-based with a generous free band and a monthly cap. Only syncs to Amazon / eBay / Walmart / Target Plus — no TikTok Shop, no Etsy, no OnBuy at April 2026.
- **What triggers a sales call:** None.
- **Upsell mechanics:** None — the product is deliberately commoditised by Shopify.
- **Source:** https://apps.shopify.com/marketplace-connect
- **Implication:** Shopify merchants already have a $0–$99/mo baseline for the narrowest interpretation of the job. Any paid feed-management product has to be meaningfully better at feed optimisation, channel coverage, and error handling — not just available.

### Extensiv (formerly Skubana)
- **Public pricing:** None. "Contact us" across every product line.
- **Public floor (reseller quotes):** $1,000–$2,000/mo entry for Extensiv Order Management, higher for the 3PL/Warehouse suites.
- **Model:** Quote-only, annual contract.
- **Source:** https://www.extensiv.com/pricing

### Mirakl
- **Public pricing:** None. Mirakl is a marketplace platform for retailers, not a feed tool for merchants — included here because agency buyers occasionally put it in the same evaluation.
- **Public floor:** Six-figure annual contracts. Not a real comparator below Tier 3.
- **Source:** https://www.mirakl.com/pricing

---

## 2. Observed price bands

| Band | Monthly price | Examples | Who it serves |
|---|---|---|---|
| **Free / commoditised** | $0–$99 | Shopify Marketplace Connect, Veeqo Shipping, Baselinker Freemium | Shopify merchants doing ≤50 marketplace orders/mo |
| **Self-serve SMB** | $19–$500 | Sellbrite, Baselinker Business, Veeqo Inventory, Veeqo High-Volume | $10k–$500k/mo GMV merchants, 1–5 channels |
| **Mid-market (partially hidden)** | $500–$2,500 | Linnworks entry, Extensiv entry, Baselinker Enterprise | $500k–$5M/yr operators, 5–10 channels |
| **Enterprise (quote-only)** | $2,500–$20,000+ | Feedonomics, Rithum, Brightpearl, Linnworks upper tiers, Mirakl | $5M+/yr, managed-service expectations |

Every competitor above $500/mo gates pricing behind a form. Every competitor below $500/mo publishes numbers. That gap is a market signal — the self-serve buyer will not fill in a form, and the enterprise buyer expects not to see a number.

---

## 3. Where Palvento sits today

| Tier | Current USD | Band |
|---|---|---|
| Starter | $99 (founding) / $149 (list) | Self-serve SMB — owns the empty mid-market gap above commodity tools |
| Growth | $249 (founding) / $349 (list) | Self-serve SMB — right on the median for 3–5 channel Shopify sellers |
| Scale | $599 (founding) / $799 (list) | Upper self-serve SMB — near the ceiling before the buyer expects a sales call |
| Enterprise | From $2,000/mo | Visible anchor, sales-led |

**Diagnosis.** The numbers are right. The shape is right. What's wrong is the pitch around them — they're currently defended against Linnworks and Brightpearl (wrong wedge) instead of anchored against Feedonomics and the Shopify Marketplace Connect floor.

---

## 4. Pricing recommendation (Shopify-led feed-management wedge)

Rework the positioning around the new price points.

### Keep
1. **$149 / $349 / $799 / $2,000** — these land in the empty mid-market gap between commodity self-serve tools (Sellbrite's $29–$129, Veeqo's $19–$350, Baselinker's €19–€99) and enterprise quote-only vendors ($2,500+). Higher price signals commitment and lowers churn.
2. **Flat monthly, no percentage of GMV.** This is a genuine differentiator against Rithum (historic) and against any quote-led incumbent that tacks on services fees. Feedonomics itself uses this line, so we have to say it better.
3. **Founding-member anchor.** Valid for now. Sunset when list gets to ~150 customers; the discount gets stale otherwise.
4. **5-currency toggle.** Rare at this price point. Keep it visible on the pricing page.

### Change
1. **Anchor every tier against Feedonomics' $2,500/mo floor,** not against Linnworks. Feedonomics is the category name for feed management. Linnworks is the category name for inventory management. The wedge is feed.
2. **Enterprise — from $2,000/mo is now visible on the pricing page.** Keeps the sales path alive for >$500k/mo GMV accounts, signals seriousness without committing to a fixed number.
3. **Retire the "% of revenue" FUD comparison against ChannelAdvisor** (they rebranded to Rithum; the % model is being phased out on new contracts). Keep one line on the comparison table — don't repeat it three times.
4. **Reframe the comparison table** so Feedonomics is column 2 (primary), then Rithum, Linnworks, Brightpearl. Current order puts Brightpearl first, which is the wrong primary.
5. **Name the overage model explicitly.** Linnworks and Veeqo win trust by being explicit that they're order-volume tiered; Palvento's "up to N channels" language is cleaner, but the pricing page should state that above-plan channel count triggers an automatic upsell proposal — not a surprise bill.

### Common upsell mechanics seen across the market
- **Order-volume overage** — Linnworks, Veeqo, Baselinker. Linear, transparent, boring — and works.
- **Channel-count gates** — every self-serve vendor. Palvento already does this.
- **AI features as upsell** — Feedonomics AI agents, Brightpearl Inventory Planning. Palvento currently bundles AI into Growth, which is a sharper move than the incumbents.
- **Concierge onboarding as enterprise-only** — universal above $2,000/mo. Palvento should make this visible as the one thing that does gate the Enterprise tier.
- **Multi-entity / multi-region** — Shopify Plus merchants asking for region-specific feeds. Real Scale-tier trigger.

---

## 5. One-sentence positioning the pricing is meant to support

> *Self-serve multichannel feed management for Shopify-led sellers — from $149/mo, without the $2,500/mo enterprise floor or the sales call that comes with it.*

Every element on the pricing page should prove one of those four claims: **self-serve**, **multichannel**, **feed management**, **without the enterprise floor**.
