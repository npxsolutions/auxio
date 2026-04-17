# Ideal Customer Profile

> Rebuilt April 2026 around the locked wedge: self-serve multichannel feed management for Shopify-led sellers.
>
> Three tiers, bracketed by Shopify GMV. Every marketing asset in `docs/marketing/` should map back to one of these tiers. Tier 2 is the wedge; Tier 1 is the volume acquisition; Tier 3 is the enterprise upsell served by `app/enterprise/page.tsx`.

---

## Tier 1 — Shopify-led Starter
**"Shopify + 1–2 additional channels · $10k–$100k/mo GMV · solo operator"**

**Psychographic.** Founder-operator, often still working a day job or running the store as a primary income. Shopify native — installed from the App Store, stayed on Shopify by default. First marketplace attempt was usually Etsy or eBay via a free connector; considering Amazon next. Reads *2PM*, *Lenny*, *Trung Phan*, occasional *Shopify Masters*. Values transparency, speed, and a product that doesn't try to eat their entire Tuesday to set up.

**Current toolset.** Shopify Admin. Shopify Marketplace Connect (free tier, 50 orders/mo cap), or a single-channel app per marketplace. A2X for accounting on the Shopify side. Google Sheets for reconciling payouts. No dedicated feed tool.

**Top 3 pains.**
1. Marketplace Connect caps out at 50 marketplace orders/mo and doesn't cover TikTok Shop or Etsy properly.
2. Feed rejections show up after a listing goes live — missing GTIN, banned word, image too small — and they only find out from the marketplace.
3. No visibility into which channel is actually profitable after fees and postage.

**Willingness to pay.** $49–$79/mo. Credit card, 14-day trial, no sales call. Will not fill in a form. Documentation, a Loom demo, and a working install inside 10 minutes are the entire deal.

**Acquisition.** Shopify App Store (primary). r/shopify, r/ecommerce, Indie Hackers, *My First Million*. SEO on "Shopify TikTok Shop integration", "Shopify Amazon connector", "Shopify eBay sync".

**How they buy.** Pure self-serve via Shopify App Store install → OAuth → trial → auto-convert. If we make them book a demo we lose them.

---

## Tier 2 — Shopify-led Growth Operator (**our wedge**)
**"Shopify + 3–5 channels · $100k–$500k/mo GMV · small ops team"**

**Psychographic.** Founder still touches ops but has hired a VA, ops manager, or agency on retainer. Aspirational — wants to cross $5M/yr and sees channel expansion as the lever. Has already tried Shopify Marketplace Connect and hit the channel-coverage wall. Has been quoted by Feedonomics at least once and either bounced on the price or never heard back because the deal was too small. Reads *Ecommerce Fuel*, *Operators*, *2x eCommerce*.

**Current toolset.** Shopify (often Plus) + Amazon Seller Central + eBay + TikTok Shop + Etsy. Shopify Marketplace Connect for the Amazon/eBay/Walmart leg, plus one-off apps or spreadsheets for the rest. A2X + Xero/QuickBooks. A repricer (Repricer Express, BQool, Seller Snap). A 3PL portal.

**Top 3 pains.**
1. Feed quality is inconsistent per channel — Amazon listings suppressed for missing attributes, TikTok Shop categories wrong, Etsy tags truncated. No single place to fix it.
2. Channel-specific pricing rules aren't enforced — someone ships an Amazon order at a loss every week because the repricer doesn't know about true landed cost.
3. They can't answer "which channel is profitable this quarter?" without a spreadsheet rebuild, because feed management, orders, and P&L live in three different tools.

**Willingness to pay.** $149–$799/mo. Will pay $349/mo cheerfully if it replaces Marketplace Connect + a per-channel app + a feed-optimisation spreadsheet. Annual contracts viable after 60 days. Expansion revenue is real — they add channels, SKUs, and (in year 2) users.

**Acquisition.** Shopify App Store (primary). `/vs/feedonomics` and `/vs/linnworks` SEO. Agency partnerships (Eastside Co, Underwaterpistol, Swanky, Blend). *Ecommerce Fuel* forum word-of-mouth.

**How they buy.** Self-serve trial, expect a sales-assisted onboarding call within the first 7 days. Evaluate 2–3 tools in parallel. Comparison content and `/vs/*` pages convert them. A peer reference in an ops Slack is the final gate.

---

## Tier 3 — Shopify-led Scale Operator (**enterprise upsell**)
**"Shopify Plus + multi-region multichannel · $500k+/mo GMV · 10+ person team"**

**Psychographic.** Run by a COO or Head of Ecommerce, not the founder. Process-oriented. Already been burned — Linnworks lock-in, a failed Brightpearl implementation, or a Feedonomics contract that didn't scale economically. Needs a named contact, a security questionnaire response, and a trial tenant with real data.

**Current toolset.** Shopify Plus (often multi-store) + Amazon (multiple regions, sometimes Amazon Vendor) + Walmart + eBay + TikTok Shop + 2–3 DTC / wholesale channels. Feedonomics or Rithum on the feed side, plus Klaviyo, a BI tool (Looker, Metabase), NetSuite or QuickBooks Enterprise, and a contracted dev team.

**Top 3 pains.**
1. Regional feeds diverge — what's approved on Amazon UK fails on Amazon DE because the attribute schema differs, and nobody catches it until a category manager complains.
2. SSO, audit logs, and data residency are required for the next security review, and their current feed tool either charges $20k/mo for them or doesn't have them at all.
3. Managed onboarding and a dedicated solutions architect are the difference between adopting and not — they won't self-serve at this scale.

**Willingness to pay.** $2,000–$10,000+/mo. Annual prepay standard. Budget exists — they just need the business case written for them, ideally against the Feedonomics quote they already have in hand.

**Triggers for the enterprise sales path.** *Any one of the following flips them into Tier 3:*
- >$500k/mo GMV
- 10+ sales channels or multi-region same-channel (Amazon US + EU + JP)
- 2+ Shopify stores under one parent
- 5+ warehouses or 2+ 3PLs
- Regulated category (alcohol, CBD, firearms, pharma)
- Explicit SSO / SAML / SCIM / data-residency / SOC 2 requirement
- >10 named users on the platform

**Acquisition.** Outbound, partner referral, `/vs/feedonomics` converting the high-intent buyer. `/enterprise` quote form (already shipping into `public.enterprise_quotes`).

**How they buy.** Committee. Head of Ecom champions, CFO signs, IT or developer gatekeeps on API quality and security posture. 30–90 day cycle. Proof-of-concept with real data, security questionnaire, reference call.

---

## Anti-profile — who we actively do not sell to

- Pure DTC single-channel Shopify stores under $10k/mo — Shopify + a CSV is fine for them.
- Big-box retailers with EDI-first supplier relationships — we don't do EDI well yet.
- Non-Shopify-led multichannel sellers (BigCommerce-native, WooCommerce-native, Magento) — we support them, but the Shopify App Store motion is the primary acquisition channel and the product is tuned for it.
- Pure B2B wholesale with no marketplace exposure — the feed loop we close doesn't apply.
- Agencies reselling white-label — future partner motion, not an ICP.
