# Marketing Scorecard

Every KPI is either *leading* (predicts outcome) or *lagging* (records outcome). We watch leading weekly and report lagging monthly. Targets are Day 30 / Day 60 / Day 90 from launch.

Measurement sources:
- **VA** = Vercel Analytics
- **PH** = PostHog (product + funnel events)
- **St** = Stripe (revenue, payments)
- **Sb** = Supabase (user, trial, subscription tables)

---

## Top-of-funnel

### Site traffic (by source)
- **Definition.** Unique visitors by source: organic search, paid, referral, direct, social.
- **Source.** VA + PH (UTM attribution).
- **Target.** 8k / 18k / 35k monthly uniques.
- **Mix target at Day 90.** Organic 45% · Direct 20% · Referral 15% · Social 12% · Paid 8%.
- **Classification.** Leading.

### Email signups (waitlist + newsletter)
- **Definition.** New subscribers to any marketing list.
- **Source.** Sb (`email_subscribers`).
- **Target.** 400 / 1,000 / 2,200 cumulative.
- **Classification.** Leading.

### Demos requested + show rate
- **Definition.** Demo bookings via `/demo` + % who show.
- **Source.** Sb (`demo_bookings`) + calendar (Cal.com webhook).
- **Target.** 15 booked / 35 booked / 70 booked, 65% show rate (Day 30) rising to 75% (Day 90).
- **Classification.** Leading.

### Inbound from marketplaces
- **Definition.** New trials attributed to Shopify App Store, BigCommerce, TikTok Shop.
- **Source.** PH (install_source property).
- **Target.** 0 / 25 / 80 cumulative installs (Shopify App Store goes live Week 6).
- **Classification.** Leading.

---

## Conversion

### Trial starts
- **Definition.** Net new accounts that complete onboarding step 1 (connected at least one channel).
- **Source.** PH (`trial_started` event) + Sb (`workspaces` where `channels_connected >= 1`).
- **Target.** 120 / 280 / 550 cumulative.
- **Classification.** Leading.

### Trial → paid conversion rate
- **Definition.** % of trials that convert to any paid plan within 30 days of trial start.
- **Source.** St (subscription created) ∩ Sb (trial_started).
- **Target.** 12% / 16% / 20%.
- **Classification.** Lagging.

### Net new logos / week
- **Definition.** Paying customers (any plan) added in week.
- **Source.** St (new subscriptions).
- **Target.** 8 / 16 / 28 per week (trailing 4-week average).
- **Classification.** Lagging.

---

## Economics

### ACV (annual contract value)
- **Definition.** Annualized revenue per paying customer. MRR × 12 for monthly, contract value for annual.
- **Source.** St.
- **Target.** $1,100 / $1,500 / $1,900. Blended across tiers — Tier 2 pulls the average up over the quarter.
- **Classification.** Lagging.

### CAC by channel
- **Definition.** (Channel spend + attributable internal time at $100/hr) ÷ closed-won customers.
- **Source.** PH (attribution) + internal spend tracker.
- **Target.**
  - SEO/content: $180 / $120 / $90
  - Paid search: N/A / $300 / $250
  - Partnerships: $250 / $200 / $180
  - Cold outreach: $280 / $250 / $230
  - Marketplace listings: N/A / $60 / $40
- **Classification.** Lagging.

### Payback period (months)
- **Definition.** CAC ÷ monthly gross margin per customer.
- **Source.** St + internal cost model (gross margin assumed 78%).
- **Target.** 14 / 11 / 9 months blended. Under 12 by Day 90 is the gate for scaling spend.
- **Classification.** Lagging.

### LTV / CAC
- **Definition.** (ARPA × gross margin × average customer lifetime) ÷ CAC. Lifetime projected from 30/60/90-day retention curve.
- **Source.** St + Sb + cohort model.
- **Target.** 1.8 / 2.6 / 3.5. Anything under 3x at Day 90 says we're acquiring the wrong ICP.
- **Classification.** Lagging.

### NRR (net revenue retention)
- **Definition.** (Starting MRR + expansion − contraction − churn) ÷ starting MRR, trailing 30 days.
- **Source.** St.
- **Target.** N/A (not enough cohorts) / 102% / 108%. Under 100% at Day 90 means expansion isn't firing.
- **Classification.** Lagging.

---

## Partner

### Partner-sourced revenue %
- **Definition.** MRR from customers with `partner_id` set at signup, as % of total new MRR.
- **Source.** Sb (workspaces.partner_id) ∩ St.
- **Target.** 5% / 12% / 20%.
- **Classification.** Lagging.

---

## Summary table

| KPI | Lead/Lag | Day 30 | Day 60 | Day 90 |
|---|---|---|---|---|
| Monthly uniques | Lead | 8k | 18k | 35k |
| Email signups (cum) | Lead | 400 | 1,000 | 2,200 |
| Demos booked (cum) | Lead | 15 | 35 | 70 |
| Marketplace installs (cum) | Lead | 0 | 25 | 80 |
| Trial starts (cum) | Lead | 120 | 280 | 550 |
| Trial → paid | Lag | 12% | 16% | 20% |
| Net new logos / week | Lag | 8 | 16 | 28 |
| ACV | Lag | $1,100 | $1,500 | $1,900 |
| Blended CAC | Lag | $240 | $190 | $160 |
| Payback (mo) | Lag | 14 | 11 | 9 |
| LTV/CAC | Lag | 1.8 | 2.6 | 3.5 |
| NRR | Lag | — | 102% | 108% |
| Partner-sourced rev % | Lag | 5% | 12% | 20% |

Review cadence: leading metrics every Monday 9am, lagging the first Monday of each month.
