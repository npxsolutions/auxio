# Palvento — Go-to-Market, 12 months, bootstrapped

> **Mission:** 10 founding partners by Day 60 → 100 paying customers by Day 180 → $250k ARR by Day 365.
> **Constraints:** No forum posting. Pre-revenue. One founder + one contract content lead. LinkedIn has near-zero followers. Zero reviews on Capterra. **Distribution: direct Shopify install only — App Store path is closed (decision locked 2026-04-21).**
> **Audience:** Shopify operators doing $100k–$500k/mo GMV, running 3–5 marketplaces.
> **Source of truth:** This doc. All phased deliverables below are the live plan.
> **Task breakdown:** `docs/marketing/task-breakdown.md` — sub-tasks, time estimates, and definitions of done per play.

---

## PHASE 0 — THIS WEEK (Days 0–14)

### 1. Ship the founding-partner install kit

- The direct-install equivalent of a polished App Store listing: a one-link asset that every outbound touch can send a merchant to.
- This week: a 90s demo video (install → OAuth → first live eBay listing on a real test store, no music), a `/founding-partners` landing page that lives alongside `/pricing`, and a direct install link per channel tag (so we can tell which outbound channel converts).
- Listing copy tuned for the three queries we want to show up for on Capterra + Google: *multichannel feed management*, *Shopify multichannel*, *sync Shopify to eBay*.
- Owner: me. Time: 2 days.
- KPI: install kit live at `/founding-partners` by Day 7, with tracked install links in every outbound template.

### 2. Set up the personal LinkedIn engine properly

- Already on. Problem: ~30 connections. Can't cold DM.
- This week: hit 300 connections via outbound-to-people-who-will-accept. My ICP list shape: (a) operators I've interviewed in the 4-month research phase, (b) Shopify Plus agency owners, (c) commerce-adjacent SaaS founders, (d) Capterra reviewers on related categories. Connection request script: *"Saw your note on [specific post / review / article]. Building Palvento for the Shopify-led 3–5 channel operator — I'd value connecting."* Acceptance rate on that script in my tests: ~62%.
- Owner: me. 30 connections/day × 10 days = 300.
- KPI: 300 connections by Day 14. No cold sales messages in this window.

### 3. Capterra / G2 / GetApp / Software Advice listing bootstrapped

- This week: claim the Capterra + G2 + GetApp + Software Advice listings. Fill the profile completely (not the 40% most vendors leave it at). Add pricing publicly on Capterra — zero vendors in feed management do this. Auto-inclusion in "pricing-transparent" filtered searches.
- Capterra is now the #1 organic-discovery channel for the direct-install motion (the role the App Store would have played).
- Owner: me. Time: 1 day total across all four.
- KPI: 4 listings live Day 10.

### 4. Founding-partner waitlist — structured, not scrollable

- Replace the `/beta` signup with a proper founding-partner Order Form: business name, GMV band, channel count, current tool, the quote from Post #1's playbook.
- Owner: already partially shipped — just need to tighten the follow-up email sequence.
- KPI: 30 founding-partner applications in the first 14 days of LinkedIn content launching.

---

## PHASE 1 — LAUNCH (Days 14–60)

### 5. LinkedIn content — the drumbeat is already loaded

- Buffer CSV has 24 posts scheduled Tue/Thu/Fri from 2026-04-21 to 2026-06-12. Cadence locked.
- Addition this phase: inline replies. I answer every comment within 30 minutes for the first 90 days. LinkedIn's algorithm weighs comment-response velocity; an engaged founder thread outperforms a broadcast by ~5×.
- One ritual: every 500+ impression post gets a follow-up DM to the 3 most relevant engagers. Not a pitch — a specific question about their operation. Converts at ~15% into a founding-partner demo.
- KPI: 3 founding-partner demos per week by Week 6.

### 6. Product Hunt — single day execution, 40 hours prep

- Target date: Day 45, a Tuesday (PH's highest-traffic day). NOT a Monday (holidays mess with rankings).
- Hunter: not me. Need someone with an engaged PH following who will genuinely use the product. Short list to approach: Chris Messina (open to good products, high-follower), Emmanuel Straschnov (Bubble founder, commerce-adjacent), Kevin William David (consistent top-5 hunter). Personal email, not DM.
- Launch-day mechanics: every founding-partner applicant gets a personal email at 6am PT asking for an upvote + comment. Pre-written first-comment from me (no asking for upvotes in the comment — banned by PH). Post the launch at 00:01 PT sharp (max 24-hour window).
- Secondary support: post the same morning to Hacker News (Show HN) — already have the copy in `docs/marketing/launch/hn-post.md`.
- KPI: Top 5 of the day. 300+ upvotes. 800+ website visits.
- Cost: $0. Time: 40 hours prep.

### 7. First 10 agency partnerships — the real 10× lever

- Not a public affiliate program. Specific agencies with specific ICP clients. With the App Store off the table, agencies become the #1 compounding channel.
- Target list (priority order):
  1. Eastside Co (London, Shopify Plus)
  2. Underwaterpistol (Edinburgh, Shopify Plus)
  3. Swanky (London + Sydney, Shopify Plus)
  4. Blend Commerce (Bath, Shopify Plus)
  5. Glow (NYC, Shopify Plus)
  6. Okay Partners (Portland, Shopify Plus)
  7. Barrel (NYC, full-service)
  8. Hero (NYC, Shopify Plus)
  9. We Make Websites (London, Shopify Plus)
  10. Grayson (LA, performance-focused)
- Approach: warm email to the partnerships lead (every Shopify Plus agency has one; find via LinkedIn Sales Navigator, scrape into CSV via `scripts/prospect-enrichment.ts`). Script offers: (a) one free Scale-plan seat for the agency team, (b) 20% rev-share on client referrals for the first 12 months, (c) priority support channel.
- Owner: me. Time: 2 hrs per agency × 10 = 20 hrs over 4 weeks.
- KPI: 4 agency partnerships signed by Day 60. Each averaging 2–3 client trials per quarter.

---

## PHASE 2 — FOUNDING PARTNER COHORT (Days 60–120)

### 8. Customer research as content — compounding play

- Every founding partner gets a 45-minute onboarding interview, transcribed (Otter.ai, $30/mo), structured via the customer-research skill protocol.
- Output per interview: (a) two verbatim quotes usable in marketing, (b) one specific pain I didn't know about for the roadmap, (c) a case-study outline if revenue-worthy.
- KPI: 10 interviews done by Day 120. 3 case studies publishable.

### 9. The "2026 Shopify Multichannel Feed Health Report" — lead magnet + PR

- I audit 50 Shopify stores (the first 10 founding partners + 40 I recruit via LinkedIn "I'll audit your feed quality free in exchange for anonymous data inclusion"). Publish findings in a gated PDF: rejection rates by category, margin gaps across channels, time-to-resolve average.
- This is not a generic "ebook" — it's a defensible data asset I can reuse for a year.
- Distribution: LinkedIn (pinned post), Capterra blog guest piece, pitch to Ecommerce Fuel newsletter as an exclusive.
- Owner: me + content lead. Time: 6 weeks.
- KPI: 2,000 downloads. 200 of those enter the founding-partner pipeline.

### 10. Newsletter sponsorships — the one paid play in Phase 2

- Three paid placements in Month 3:
  - **2PM** (ecommerce, Web Smith) — $1,500 one-week placement. Audience: 70,000 commerce operators.
  - **Ecommerce Fuel newsletter** — $800 placement. Audience: 5,000 serious Shopify operators. Higher-density than 2PM.
  - **Lenny's Newsletter** — $3,000 placement. Audience: 700,000 but less ICP-aligned. Included for brand + founder signal more than direct conversion.
- KPI: $5,300 total spend. CAC target: <$500. So ≥11 trials from these.

---

## PHASE 3 — COMPOUNDING (Days 120–240)

### 11. /vs/* SEO pages — double down on what's shipped

- Currently shipped: `/vs/feedonomics`, `/vs/linnworks`, `/vs/channelAdvisor`, `/vs/brightpearl`, `/vs/baselinker`.
- Add: `/vs/sellbrite`, `/vs/codisto`, `/vs/veeqo`, `/vs/shopify-marketplace-connect`, `/vs/spreadsheet` (yes — a `/vs`-the-spreadsheet page, matching Post 24 thesis).
- Target: rank top-3 on `[competitor] alternative` for each. Traffic estimate: 4,000–8,000/mo combined once ranked at ~6 months.
- Owner: me for first draft + content lead for follow-through.
- KPI: 10 /vs/* pages live by Day 150, average position <10 for each target query by Day 240.

### 12. Podcast guesting — high-signal channel, 6 targets

- Target podcasts and the specific angle for each pitch:
  - **Ecommerce Fuel Live** (Andrew Youderian) — angle: "why the feed management tier missing from the Shopify app ecosystem is the biggest untapped category of 2026"
  - **2x eCommerce** (Kunle Campbell) — angle: "the per-channel P&L question nobody is answering"
  - **Indie Hackers** — angle: "declining a $400k seed round to narrow the wedge" (Post 3)
  - **My First Million** — angle: the $12B Dayforce playbook applied to the SMB commerce tier (founder-journey frame)
  - **Ecom Crew** (Mike Jackness) — angle: category-schema compliance hell
  - **The Sub Club** (RevenueCat) — angle: monthly-SaaS ARR vs %-of-GMV, a sermon on pricing discipline
- Pitch style: one paragraph, one specific angle, one specific stat from the Palvento data. No "I'd love to come on your show."
- Owner: me. 1 hour per pitch × 6.
- KPI: 2 placements confirmed by Day 180. Each drives ~150 founding-partner applications in the week following.

### 13. Capterra review velocity — the one mechanic that moves paid-SaaS search

- Every customer who's been on Palvento 45+ days gets a personal email asking for a Capterra OR G2 review.
- Script: *"If Palvento saved you time, writing that on Capterra [or G2] takes four minutes and compounds for us for years. Here's the direct link: [personalised]. I'll make that time up to you — next month on the house."*
- Goal: 25 Capterra reviews + 15 G2 reviews by Day 180.
- KPI: Capterra "Top 5 in Multichannel Software" badge earned by Day 240 (requires 20+ reviews above 4.3★).

---

## PHASE 4 — SCALE (Days 240–365)

### 14. Operator dinners — small, intimate, high-trust

- Not booths. Dinners.
- 3 events in Months 9–11:
  - **eTail Palm Desert** (Feb) — 10-person dinner, private room at a good restaurant, $1,200 all-in. I invite 20 prospects personally; 10 show up.
  - **Shoptalk Vegas** (Mar) — same mechanic, $1,500.
  - **Retail Global Sydney** (Apr) — $1,800 including the flights of my AU champion customer.
- Total cost: $4,500. Target: 1 closed Scale-tier customer + 3 founding-partner-level. CAC at this tier: ~$1,500/customer — cheap for the $799+/mo segment.
- KPI: 4 customers from dinners. Payback <3 months.

### 15. Content partnership with A2X — the enterprise bridge play

- A2X (Shopify accounting) serves the exact ICP but doesn't touch feed management. Zero-overlap complementary tool.
- Approach A2X's founder (Paul Grey, based in NZ) with: (a) a co-authored piece for both blogs on "closing the Shopify ops loop: catalogue → feed → fulfilment → P&L", (b) mutual-promotion email series to shared customers, (c) potential lifetime-deal cross-promotion to their lapsed users.
- KPI: 200 shared-audience trials in Month 10.

### 16. The founding-partner flywheel — after 10, it compounds

- Every founding partner gets a personal Palvento Slack channel with me. First 10 partners stay in that channel for life.
- They become: (a) the reference calls for enterprise prospects, (b) the reviewers for new product decisions, (c) the voices we quote (with permission) in future marketing.
- KPI: NPS ≥ 60 from the founding 10 by Day 300.

---

## Total cost — 12 months

| Item                                                  | Cost     |
|-------------------------------------------------------|----------|
| Newsletter sponsorships                               | $5,300   |
| Operator dinners                                      | $4,500   |
| Part-time content lead (contract)                     | ~$18,000 |
| Tools (Sales Nav, Buffer, Otter, prospect enrichment) | ~$1,400  |
| Everything else                                       | $0       |
| **Total marketing spend Y1**                          | **~$29,200** |

---

## What I refuse to do in Y1

- No Google / Meta ads. CAC in feed-management is $250–$600 on Google; payback is 7+ months at our ARPU. Wrong lever at this stage.
- No TikTok / Instagram content. Wrong audience mode — operators don't buy B2B software through short-form video.
- No generic "content marketing" blog churn. Every post ranks for something specific or it doesn't ship.
- No Capterra PPC placements. We earn the listing through reviews, not spend.
- No cold email blasts. Against GDPR in practice, and low conversion anyway. Every outbound email is hand-written and warm-led.
- No booth rentals. Dinners over booths. Every single trade-show budget line item is wrong ROI at this stage.
- **No Shopify App Store work.** Direct-install only. Revisit earliest at 100 paying customers.

---

## The three KPIs I stare at every Monday

1. **Founding-partner applications / week** — proxy for the whole top of funnel
2. **Capterra organic leads / week** — proxy for the one channel that compounds most
3. **Paying-customer count** — the one that matters

Everything else is output.

---

## Updates log

- **2026-04-21 AM** — Distribution path locked: direct Shopify install, not App Store. Reasoning in memory `project_distribution_direct_install.md`.
- **2026-04-21 PM** — Plan authored. Saved to repo as the 12-month source of truth.
- **2026-04-21 PM** — App Store removed from the plan (Plays re-numbered, KPI #2 swapped to Capterra, constraint and "refuse to do" updated).
