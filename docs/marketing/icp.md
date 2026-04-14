# Ideal Customer Profile

> Company name is currently **Auxio**. If the rename ships, do a find-and-replace across this directory — names are not load-bearing in these docs.

Three named tiers. The middle tier (Growing Operator) is our wedge — we acquire Solos as a volume play and Scale Operators as expansion. Every asset in `docs/marketing/` should map back to one of these tiers.

---

## Tier 1 — Solo Operator
**"1–2 marketplaces · under $50k/mo GMV · no ops hire"**

**Psychographic.** Independent. Suspicious of SaaS bloat. Has quit a corporate job in the last 36 months, or is running the store alongside one. Reads *Hacker News*, subscribes to *2PM*, *Lenny*, or *Trung Phan*. Values transparency over polish. Will cancel within 14 days if a tool feels slow or overbuilt.

**Current toolset.** Shopify + one marketplace (usually eBay, Etsy, or Amazon). A2X for accounting. Google Sheets for everything else. Often no inventory tool at all — just the Shopify admin plus mental arithmetic.

**Top 3 pains.**
1. Oversells when inventory isn't in sync — especially on weekends.
2. No visibility into true per-order margin after fees and postage.
3. Spends Sunday night rebuilding a "real P&L" in a spreadsheet.

**Willingness to pay.** $29–$79/mo. Price-sensitive. Annual pre-pay unlikely in first 30 days. Will pay more once a single oversell has cost them money — the trigger event matters more than the pitch.

**Where they hang out.** r/ecommerce, r/Etsy, r/shopify, Indie Hackers, the `#ecommerce` channel in Starter Story Slack, Shopify community forums, *My First Million* and *The Side Hustle Show* podcasts.

**How they buy.** Pure self-serve. Credit card, 14-day trial, no sales call. If we make them book a demo, we lose them. Documentation quality and a 10-minute time-to-first-value are the entire deal.

---

## Tier 2 — Growing Operator (**our wedge**)
**"3–6 channels · $50k–$500k/mo GMV · 1–5 person team"**

**Psychographic.** The founder still touches ops daily but has hired a VA or ops manager. Aspirational — wants to cross $1M/yr and sees tooling as the lever. Reads *Retention.com*, *Ecommerce Fuel*, *Operators* newsletter. Attends one conference a year (eTail, White Label Expo, or Retail Global). Believes "we should have graduated off spreadsheets by now" and is actively shopping.

**Current toolset.** Shopify + Amazon + eBay (+ sometimes Etsy, TikTok Shop, Faire). Either still on spreadsheets (most common) or stuck on Linnworks and hating it. A2X + Xero/QuickBooks. A repricer (Repricer Express, BQool, or Seller Snap). A 3PL portal they check manually.

**Top 3 pains.**
1. Inventory is out of sync across channels — they've had at least two oversells this quarter.
2. They can't answer "which SKU, on which channel, at which price, is actually profitable?" without two hours of spreadsheet work.
3. Their ops person spends 10+ hours a week on data cleanup that should be automated.

**Willingness to pay.** $149–$599/mo. Will happily pay $299/mo if it replaces Linnworks + a repricer + a spreadsheet. Annual contracts viable after 60 days. Expansion revenue is real — they add SKUs, channels, and users.

**Where they hang out.** *Ecommerce Fuel* forum (paywalled, high-intent), *Operators* Slack, r/FulfillmentByAmazon, r/ecommerce, *My Amazon Guy* on YouTube, *The Ecommerce Podcast*, *2x eCommerce*. LinkedIn for vendor research.

**How they buy.** Self-serve trial, but expect a sales-assisted onboarding call within the first 7 days. They evaluate 3 tools in parallel. Comparison content and `/vs/*` pages convert them. Reference checks via the *Ecommerce Fuel* forum or a peer Slack DM are the final gate.

---

## Tier 3 — Scale Operator
**"7+ channels · multi-region · $500k+/mo GMV · 10+ person team"**

**Psychographic.** Run by a COO or Head of Ecommerce, not the founder. Process-oriented. Has already been burned by a previous platform (Linnworks lock-in, ChannelAdvisor price hikes, or a failed Brightpearl implementation). Skeptical of slide decks. Wants a trial tenant with their real data.

**Current toolset.** Shopify Plus or BigCommerce + Amazon (multiple regions) + Walmart + eBay + 2–3 wholesale/DTC channels. Linnworks, Brightpearl, ChannelAdvisor, or an internal-plus-Zapier Frankenstein. NetSuite or QuickBooks Enterprise. Klaviyo. A real BI tool (Looker, Metabase). Dedicated developer or contracted agency.

**Top 3 pains.**
1. Multi-currency P&L is a lie — their dashboard shows GBP revenue at invoice rate, but true settled USD/EUR margin is materially different.
2. Channel-specific pricing floors aren't enforced automatically — someone ships an Amazon order at a loss every week.
3. They've outgrown their current platform but switching costs (historical data, integrations, retraining) feel terrifying.

**Willingness to pay.** $1,500–$10,000+/mo. Expect volume discounts. Annual prepay standard. Budget exists — they just need the business case written for them.

**Where they hang out.** NRF, Shoptalk, eTail (East and West), *Modern Retail*, *Digital Commerce 360*, *The Jason & Scot Show*, private CFO/COO Slacks (Operators, Pavilion). LinkedIn is where they vet vendors.

**How they buy.** Committee. Head of Ecom champions, CFO signs, IT or developer gatekeeps on API quality. 30–90 day cycle. Requires a proof-of-concept, a security questionnaire, and at least one reference call with a similar-size customer. Contract redlines are normal.

---

## Anti-profile — who we actively do not sell to

- Pure DTC single-channel Shopify stores under $20k/mo (Shopify + a spreadsheet is fine for them).
- Big-box retailers with EDI-first supplier relationships (we don't do EDI well yet).
- Pure B2B wholesale with no marketplace exposure (the loop we close doesn't apply).
- Agencies reselling our platform white-label (future partner motion, not an ICP).
