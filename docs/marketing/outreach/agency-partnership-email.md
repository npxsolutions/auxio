# Agency partnership pitch email

> Template for the 10-agency outreach per Play 7 (task breakdown). Sent from founder inbox to the partnerships lead at each Shopify Plus agency.
> **Target list (priority order):** Eastside Co, Underwaterpistol, Swanky, Blend Commerce, Glow, Okay Partners, Barrel, Hero, We Make Websites, Grayson.
> **Cadence:** 2 agencies/week. 20 hours total prep across 4 weeks. Each email deeply personalised — no template feel.
> **Find the partnerships lead:** Sales Nav filter by agency + "Partnerships" in title. Enrich email via `scripts/prospect-enrichment.ts`. Fall back to the agency's managing partner if no dedicated partnerships lead exists.

---

## Primary template

**Subject:** `{{agencyName}} + Palvento — a 20% rev-share proposal`

**Body:**

```
{{firstName}} —

Quick one. I noticed {{agencyName}} has {{specific_client}} on Shopify Plus and they're running at least {{observed_channels}} marketplaces live alongside their storefront — that's squarely the operator shape I built Palvento for.

Short version: Palvento is self-serve multichannel feed management for Shopify-led operators in the $100k–$500k/mo GMV band. Direct install from palvento.com, Shopify OAuth in one click, first marketplace listing live in under ten minutes. Covers eBay, Google Shopping, Amazon (shipping in 4 weeks), TikTok Shop, Etsy, Walmart. Feed rules engine. Error hub that catches GTIN mismatches and banned words before the marketplace rejects them. Per-channel P&L with line-item fee attribution. $149–$799/mo, published pricing in five currencies, no percentage of GMV, no sales call.

I'm reaching out because operators in this band typically hit the wall between Shopify's free first-party connector (three-channel ceiling, no feed optimisation) and the enterprise feed engines ($2,500+/mo with a thirty-day onboarding). This pattern repeats across your Shopify Plus client base — I suspect you've already had the conversation with {{specific_client}} and possibly {{second_client_guess}} too.

A partnership proposal, three pieces:

1. One free Scale-plan seat for the {{agencyName}} internal team. Use it on your own demo stores. Run it against any client account you'd like to audit for feed health.

2. 20% rev-share on any client you refer, for the first 12 months of that client's account. Paid monthly, no cap. Applies across all four pricing tiers.

3. A priority support channel — a dedicated Slack with me for your team. No tier ticketing. No "please open a ticket" loops when a client has a sync question mid-campaign.

No exclusivity required. No contract length. You keep earning it on the work you actually route our way.

Worth fifteen minutes next week to walk through the product on a real client account of yours? I'll drive, I'll connect the store live on the call, you see the ten-minute onboarding in its actual timing, and we both decide whether this maps onto a client you're working with right now.

— Nick
Founder, Palvento
palvento.com · nick@palvento.com
```

---

## Per-agency personalisation notes

**Before sending, fill in:**

| Token | Source | Example |
|---|---|---|
| `{{firstName}}` | LinkedIn | "Alex" |
| `{{agencyName}}` | Target list | "Eastside Co" |
| `{{specific_client}}` | Their public case-study page | "Liquid Death UK" |
| `{{observed_channels}}` | BuiltWith + Google Shopping check + eBay storefront search | "three" / "four" |
| `{{second_client_guess}}` | Their case-study page, pick a second that matches the ICP shape | "Whitney Simpkins" |

**Hard rules:**

1. Do not send until you've manually verified `{{specific_client}}` is actually on Shopify + at least 2 marketplaces. BuiltWith the storefront, Google the top SKU, search eBay for the brand. Takes 5 minutes. If it doesn't check out, pick a different client from their site.
2. Do not send to more than two agencies/week. This is 1:1 outreach, not a campaign. Volume is the enemy.
3. Do not BCC, CC, or use email-tracking pixels. Partnerships leads can see trackers on their corporate gateway and it kills trust on the first touch.
4. Personalise the subject line if there's a genuinely better specific hook. The template subject is safe but "I noticed {{agencyName}}'s Shopify Plus roster" sometimes outperforms in A/B.

---

## Follow-up sequence (if no reply)

**Touch 2 — Day 5:**

> Subject: `Re: {{agencyName}} + Palvento`
>
> {{firstName}} —
>
> Following up on the founding-partner rev-share proposal. If the shape isn't right I can take a hint — reply "not for us" and I'll archive.
>
> If it's of interest but buried, one specific ask: can I walk you through Palvento on {{specific_client}}'s store (with your permission) for fifteen minutes next week? I'll have the partnership terms in writing by then so you can decide with real numbers in front of you.
>
> — Nick

**Touch 3 — Day 12 (final):**

> Subject: `Last one from me`
>
> {{firstName}} —
>
> Closing the loop on {{agencyName}}. Three touches is my ceiling on any warm intro — anything beyond that is spam regardless of subject line.
>
> If this is worth revisiting in Q3 or Q4, reply and I'll calendar a proper catch-up then. Otherwise I'll assume not for now and we'll cross paths another way.
>
> palvento.com if any of your clients ever want to try the product direct.
>
> — Nick

---

## Partner-agreement one-pager

To be drafted by Day 30 per Play 7. Single PDF:

- `{{agencyName}}` logo + Palvento logo at top
- Three-point terms:
  1. **Rev-share.** 20% of Palvento subscription revenue for first 12 months per referred client, paid monthly.
  2. **Free seat.** One Scale-tier seat for agency internal use, evergreen while partnership is active.
  3. **Priority support.** Dedicated Slack channel with founder for the agency team's technical questions.
- No exclusivity, no minimum volume, no contract length.
- Signature blocks for agency partnerships lead + Nick (founder).
- Referral tracking: unique URL parameter `?ref={{agency_slug}}` on every link the agency uses, logged to Supabase on first page load, attributed to the agency for the customer's lifetime.

File path when drafted: `docs/marketing/launch/agency-partnership-agreement.pdf`.

---

## Tracking & KPIs

- Emails sent (target: 2/week × 4 weeks = 8 agencies contacted; 10 if two bounce).
- Reply rate (benchmark: 45–55% on partnerships leads given the specificity).
- Calls booked (target: ≥5 of 10 = 50% book rate).
- Signed agreements by Day 60 (target: **4** per Play 7).
- First client trial sourced through each signed agency (target: within 30 days of signing).

Log in `kpis.md` weekly alongside the connection-building and cold-email metrics.
