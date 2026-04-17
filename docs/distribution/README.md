# Distribution

How Palvento reaches customers without paying CAC for every one. The product is shipped — distribution is the unlock that turns engineering velocity into compounding revenue.

This doc covers the channel ranking we use to decide what to invest in, the quarterly roadmap, the KPIs we track, who owns what, and the product dependencies that gate each channel.

## Channels, ranked by leverage

Leverage = expected accounts won per hour invested over a 12-month window, weighted by ACV and retention. Today we rank as follows.

1. **Marketplace listings (Shopify App Store, BigCommerce, Zapier, G2/Capterra).** Highest sustained leverage. A live Shopify App Store listing produces inbound merchants for years; G2 reviews compound monthly. Costs: real engineering for marketplace SDK depth, real time for review generation. See `/marketing/marketplace-listings/` for submission-ready briefs.
2. **Partnerships (agencies, consultancies, 3PLs, SIs).** Highest per-deal ACV; moderate volume. Each tier-3 partner books 6–15 accounts per year. Sales motion is co-sold, not self-serve. See `/app/partners` and `/docs/distribution/partnerships.md`.
3. **Integrations-as-distribution.** Every new integration is a co-marketing event with the partner's ecosystem. A new Klaviyo, Stripe Tax, or ShipStation integration is a distribution channel before it's a feature.
4. **Affiliates and content creators.** Lower per-deal ACV, broader reach, easier to scale. The right ecommerce-ops YouTuber or newsletter generates 30–60 trial signups per published piece. See `/app/affiliates`.
5. **Directories (G2, Capterra, GetApp, AlternativeTo, Product Hunt, SaaSHub).** Compounding once seeded with 25+ honest reviews. See `/app/directories`.
6. **Developer platform.** Indirect distribution. Each builder who ships an Palvento-powered tool surfaces us to a new audience. ROI is 12–18 months out; worth the patience because retention is exceptional.
7. **Outbound and paid acquisition.** Lowest leverage. We use it to test ICP variants, not as a primary channel.

## Quarterly distribution roadmap

### Q2 (current)
- Shopify App Store listing live; first 25 verified reviews.
- G2 listing live + first 15 reviews; primary category set to Order Management Systems.
- Partner program launched publicly at /partners; sign first 10 Silver-tier partners.
- Affiliate program publicly accepting applications via /affiliates.

### Q3
- BigCommerce App Store listing live.
- Zapier integration listed; 5 templated Zaps published.
- Product Hunt launch tied to v3 release.
- Capterra/GetApp listings approved + 25 reviews each.
- First 5 Gold-tier partner case studies published.

### Q4
- Intercom App Store listing live.
- Vercel integration submitted (after marketplace OIDC clarification).
- Klaviyo and ShipStation integrations announced as paired co-marketing events.
- 100 G2 reviews. Targeting Leader badge for Q1.

### Q1 next year
- TrustRadius Top-Rated submission.
- First Palvento operator dinners in London, NYC, Berlin, Singapore.
- Developer platform GA: typed SDKs, OpenAPI spec at /developers/reference, public Postman collection.

## KPIs

We track four numbers in the distribution scorecard, reviewed monthly.

| KPI | Definition | Target (12 mo) |
| --- | --- | --- |
| Partner-sourced revenue % | New ARR booked through tier-2+ partners ÷ total new ARR. | 35% |
| Inbound marketplace volume | Trial signups from G2/Capterra/GetApp/Shopify/BigCommerce listings. | 400/month |
| Referral rate | % of paid customers who land via a tracked affiliate or partner link. | 25% |
| Net listing reviews | Verified G2 + Capterra + Shopify reviews added per quarter, net of any removed. | +50/quarter |

Secondary indicators: trial → paid conversion by source, partner-sourced churn vs. self-serve churn (we expect partner-sourced to retain better; if it doesn't, the partner motion needs work).

## Team responsibilities

- **Distribution lead (Marketing).** Owns the scorecard, channel mix, marketplace submissions, and partner-program sales motion. Signs off every listing copy change.
- **Platform engineering.** Owns marketplace SDK depth (Shopify App Bridge, BigCommerce App SDK, Vercel marketplace OIDC), API stability, webhook reliability, and the developer experience that makes the platform listable in the first place.
- **Customer success.** Owns review generation. Every G2/Capterra/Shopify review request is sent by a human who knows the customer. No mass-email blasts.
- **Founders.** Personally close the first 20 partners in each tier. After that, the partner team owns it.

## Dependencies on product

Distribution waits on the product more than we'd like. The hard sequencing:

- **Shopify App Store listing** depends on Shopify App Bridge embed parity, which depends on the merchant-portal embed (in flight).
- **BigCommerce App Store** depends on the BigCommerce integration reaching feature parity with Shopify (Q3 commit).
- **Vercel integration** depends on a published `@palvento/react` package and a typed SDK (Q4 commit).
- **G2 Leader badge** depends on net 50 reviews per quarter, which depends on customer-success bandwidth (hire planned for Q3).
- **Developer platform GA** depends on the OpenAPI spec, which depends on the v1 contract freeze (already shipped) and tooling investment (in flight).

## Files in this folder

- `partnerships.md` — agency / 3PL / consultancy partnerships. Who co-sells, who resells, rev-share terms, enablement.
- `directories.md` — G2, Capterra, GetApp, Product Hunt, SaaSHub, AlternativeTo. Listing status, review-generation plan, category placement.
- `marketplaces.md` — Shopify App Store, BigCommerce, Etsy, Intercom, Zapier, Slack, Vercel. Submission status, review feedback, listing copy.
- `integrations-roadmap.md` — *which* integrations to build next weighted by distribution value (not just customer asks). A new Klaviyo integration is a distribution channel.

## Open questions

- Which G2 category do we win — Order Management or Multichannel Retail? Test with first 25 reviews tagged in both.
- Does the partner program need a portal, or is a shared Slack channel + a payouts dashboard enough for tier-2 and below? Default: stay manual until we feel the pain.
- How much do we invest in AppSumo / lifetime-deal channels? Default: zero. Wrong customer profile, wrong retention.
