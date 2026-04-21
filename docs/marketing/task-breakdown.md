# Task Breakdown — 12-Month GTM Plan

> **Companion to** `gtm-12-month-plan.md`. Execution-level detail per play.
> **Phasing:** Phase 0 is fully detailed (this week). Phase 1 has sub-task lists. Phases 2–4 are sketched — details firm up once Phase 1 outcomes are in.
> **Format per play:** Goal · Owner · Deadline · Blockers · Sub-tasks · Definition of done.
> **Distribution:** Direct Shopify install only (merchants integrate through palvento.com). App Store is not part of this plan.

---

# PHASE 0 — THIS WEEK (Days 0–14)

## Play 1 — Ship the founding-partner install kit

**Goal.** One-link asset every outbound touch can send to a merchant. Install kit live at `/founding-partners` by Day 7 with tracked install links per channel.
**Owner.** Founder.
**Blockers.** Canva MCP restart for landing-page visuals. Clean test store for demo recording.

### Sub-tasks

**1.1 `/founding-partners` landing page**
- New route alongside `/pricing`. Purpose: the destination every outbound LinkedIn DM / cold email / agency pitch points at.
- Above the fold: one-line pitch → 90s demo video → "Install via your Shopify" CTA (button links to `/api/shopify/connect` flow, which already exists).
- Below the fold: what founding partners get (direct Slack with founder, founding-partner pricing locked for life, 3 roadmap votes), the 3-question qualification form (Play 4), two anonymous operator quotes.
- Copy tuned for Google + Capterra queries: *multichannel feed management*, *Shopify multichannel*, *sync Shopify to eBay*.
- **Time: ~5 hrs.**

**1.2 Demo video** (90s max, no music)
- Script: 10s hook ("Shopify to eBay in 10 minutes") → 15s problem (feed rejections, spreadsheets) → 60s in-product walkthrough (install → auth → first product live on eBay) → 5s CTA ("Install free for 14 days").
- Record on a clean test store with non-PII sample products.
- Tool: ScreenStudio or Loom. Export at 1080p.
- Embed on `/founding-partners`, `/pricing`, and the Capterra listings (Play 3).
- **Time: ~6 hrs including 3–5 takes.**

**1.3 Install-flow polish**
- Audit the existing `/channels` Shopify connector + `/api/shopify/connect` OAuth path. Confirm it works end-to-end on a fresh store in <10 min.
- Add conversion tracking: PostHog events for `shopify_oauth_start`, `_complete`, `_first_push`.
- Add a "just installed" success screen that cleanly hands off to step-3 onboarding. Verify `/onboarding?step=3` redirect post-callback is polished.
- **Time: ~3 hrs.**

**1.4 Tracked install links per outbound channel**
- URL pattern: `palvento.com/founding-partners?src=linkedin-dm-{{prospect-handle}}` or `?src=coldemail-batch-01` or `?src=agency-{{name}}`.
- Middleware logs the `src` param to Supabase on first page load.
- Dashboard view (internal only) at `/admin/attribution` — which channel converts best.
- **Time: ~4 hrs.**

**Definition of done.** `/founding-partners` live, demo video embedded, install flow verified end-to-end, attribution tracked. Every outbound template in `docs/marketing/outreach/` updated to use the tracked link.

---

## Play 2 — LinkedIn to 300 real connections

**Goal.** 300 connections by Day 14. Zero cold DMs sent in this window.
**Owner.** Founder.
**Blockers.** Profile prereqs (Canva MCP for banner). Sales Nav seat (~$99/mo — allocate).

### Sub-tasks

**2.1 Profile overhaul** (prereq for everything downstream — ~4 hrs)
- **Headline:** `Building Palvento — Shopify → eBay & Google Shopping in 10 minutes · ex-[prior credibility]`
- **About section** (first 300 chars visible): one-liner on who Palvento is for → what's different (self-serve, $149) → what you want (founding partners, feedback, intros). Use the full 2000 chars.
- **Featured section** (pin 3 in order): 30s Loom of OAuth-to-first-push, `/pricing` page, best LinkedIn post of the week (rotate weekly).
- **Current role:** `Founder, Palvento — Shopify multichannel feed management` pointing to palvento.com.
- **Banner:** product screenshot + "Shopify → eBay + Google Shopping" headline. Produce in Canva after MCP restart.
- Reference: `docs/marketing/outreach/linkedin-sales-playbook.md#profile-prerequisites`.

**2.2 ICP list build** (500+ candidates in a sheet — ~3 hrs)
- Four sources:
  - Operators interviewed during 4-month research phase (existing CSV).
  - Shopify Plus agency owners (Sales Nav filter: Shopify Plus + Founder/CEO).
  - Commerce-adjacent SaaS founders (Sales Nav filter: Ecommerce SaaS, 2–50 employees, Founder/CEO).
  - Capterra reviewers on Feed Management / Multichannel / Inventory categories (scrape public reviews for reviewer LinkedIn).
- Run `npm run prospect:enrich -- --input=leads.csv` to enrich with site + email.
- Tag each row: warm (mutual connection) / cold / priority.

**2.3 Connection request cadence** (30/day × 10 days = 300)
- Script: *"Saw your note on [specific post / review / article]. Building Palvento for the Shopify-led 3–5 channel operator — I'd value connecting."*
- Every request references a *specific* thing they said. No template-feel requests.
- Expected acceptance: ~62% per your testing → ~185 accepts from 300 sends.
- Daily time: 90 min (3 min per prospect research + send).

**2.4 Daily engagement on ICP content**
- Comment on 3 ICP posts/day — substantive, under 60 chars, one genuine opinion per comment.
- Never "Great post!" or emojis-only. Never self-promotional.
- Daily time: 15 min.

**2.5 Measurement**
- End-of-week (Sat) log: requests sent, accepts, comments left, notable replies.
- If acceptance drops below 45% → script iteration needed.

**Definition of done.** ≥300 connections. ≥30 direct replies from targeted individuals. Profile converts (tracked via profile view → connection rate ≥15%).

---

## Play 3 — Capterra / G2 / GetApp / Software Advice listings live

**Goal.** 4 listings live by Day 10, filled to 100%, pricing publicly displayed on Capterra (differentiator — no feed-management vendor does this). Capterra is the #1 organic-discovery channel in the direct-install motion.
**Owner.** Founder.
**Blockers.** Email verification from each platform (1–3 day wait each).

### Sub-tasks

**3.1 Claim listings** (~2 hrs work, 1–3 day wait per platform)
- Capterra: vendor sign-up → domain verification email → claim product page.
- G2: same flow, separate vendor account.
- GetApp: auto-pulled from Capterra (same Gartner Digital Markets family) — verify it mirrors.
- Software Advice: also Gartner family — verify auto-pull.

**3.2 Fill each profile to 100%** (~5 hrs across all four — most fields duplicate)
- Company description: 180-char teaser + 500-char full.
- Feature list: tag 60–80 features from the shared feature taxonomy.
- Screenshots: 5–8 per platform (reuse the install-kit visuals from Play 1).
- Video: same 90s demo.
- **Pricing: display all 4 tiers publicly on Capterra.** This is the differentiator.
- Integrations: list Shopify + eBay + Google Shopping + planned (Amazon, Etsy, TikTok, Walmart).
- Industry tags: Retail, Apparel, Consumer Goods, Cosmetics, F&B.
- Support channels: email + help centre URL.
- Deploy: SaaS. Pricing model: flat monthly. Free trial: 14 days.

**3.3 Category placement requests**
- Request placement in: Feed Management, Multichannel Listing, Inventory Management, PIM. Each platform has a different request form.

**3.4 Review request mechanics** (prep for Phase 2)
- Draft the 45-day review request email (per Play 11).
- Add Capterra + G2 review URLs to the in-app "Love Palvento?" banner — ships in Week 3.

**Definition of done.** 4 listings live. Pricing public. Appears in category searches for "multichannel software" and "feed management".

---

## Play 4 — Founding-partner waitlist — structured, not scrollable

**Goal.** 30 founding-partner applications in first 14 days of LinkedIn content going live.
**Owner.** Founder.
**Blockers.** None.

### Sub-tasks

**4.1 Audit current `/beta` signup**
- What fields exist? What's missing? What's confirmed shipped in memory as "partially done"?
- Decide: edit in place vs. new `/founding-partners` route (Play 1 ships this route — the form lives inside it).

**4.2 Redesign form** (7 fields max — friction kills conversion)
1. Business name + store URL.
2. GMV band: `<$50k` / `$50–100k` / `$100–500k` / `$500k–1M` / `$1M+`/mo.
3. Channel count: `Shopify only` / `2–3` / `4–5` / `6+`.
4. Current feed tool: dropdown (Linnworks, Feedonomics, spreadsheets, none, other).
5. One-sentence free-text: *"What's the worst thing about your current setup?"* — Post #1 playbook prompt.
6. Timeline: evaluating now / 1–3 months / 6+ months.
7. Email.

**4.3 Follow-up email sequence** (3 emails — tighten existing per memory)
- **Email 1** (send ≤10 min post-submission): qualification Q's + Calendly 20-min founding-partner chat link + what they can expect next.
- **Email 2** (Day 2, if no booking): one anonymous case study from an early operator + gentle re-nudge to book.
- **Email 3** (Day 7, breakup): *"Still planning to review Palvento or should I close the loop?"*
- Store templates in `docs/marketing/outreach/founding-partner-sequence.md`.

**4.4 Analytics**
- PostHog events: `founding_partner_form_start`, `_submit`, `_email_open`, `_meeting_booked`.
- Conversion funnel dashboard in PostHog.

**4.5 Qualification scoring** (manual for the first 30)
- A tier: $100k+ GMV, 2–5 channels, on a rival tool → highest-priority outreach.
- B tier: $50–100k, moving from spreadsheets → warm, slower motion.
- C tier: <$50k or >$1M → polite "not the right time" reply.

**Definition of done.** Form live. 30+ applications. ≥50% of applications classified A or B.

---

# PHASE 1 — LAUNCH (Days 14–60)

## Play 5 — LinkedIn content drumbeat

**Goal.** 24 posts Tue/Thu/Fri, 30-min reply SLA, 3 founding-partner demos/week by Week 6.
**Key sub-tasks.**
- Sweep posts 2–24 in `content/week-1-8/linkedin-posts.md` for rival names (Feedonomics/Shopify MC/Linnworks) — **sweep pending per memory.**
- Produce 24 Canva visuals from briefs. Batch 8 at a time (Weeks 0, 2, 4).
- Buffer CSV import (exists) — confirm scheduling.
- 30-min reply SLA: calendar block 09:00–10:00 + 17:00–18:00 UK daily for first 90 days.
- Post-mortem ritual per post: logged to `experiments-log.md` — impressions, comments, DMs, demos booked.
- Every 500+ impression post → DM the 3 most relevant engagers (genuine question, not pitch).
- Every DM that goes out references the `/founding-partners` tracked link from Play 1.

## Play 6 — Product Hunt launch (Day 45, Tuesday)

**Goal.** Top 5 of the day, 300+ upvotes, 800+ visits.
**Key sub-tasks.**
- **Hunter secured by Day 25.** Outreach list: Chris Messina, Emmanuel Straschnov, Kevin William David. Personal email (not DM), one paragraph, specific angle per person.
- **Assets ready by Day 40:** tagline, first comment (no upvote ask — PH-banned), 5 PH-native GIFs, maker team photos.
- **Launch-day runbook:** 00:01 PT post → 06:00 PT email every founding-partner applicant → hourly status check → comment on every thread.
- **Parallel Show HN** at 06:00 PT using `launch/hn-post.md`.
- **Post-launch**: recap blog post + LinkedIn "what I learned" post (Week 7).

## Play 7 — First 10 agency partnerships

**Goal.** 4 signed partner agreements by Day 60. 2–3 client trials each per quarter. With no App Store path, agencies become the #1 compounding channel.
**Target list (priority order — same as plan):** Eastside Co, Underwaterpistol, Swanky, Blend Commerce, Glow, Okay Partners, Barrel, Hero, We Make Websites, Grayson.
**Key sub-tasks.**
- **Partnerships-lead discovery:** find via Sales Nav (filter by agency + "Partnerships" in title), enrich emails via `prospect-enrichment.ts`.
- **Pitch email template** (save to `outreach/agency-partnership-email.md`):
  - Subject: *"{{Agency}} + Palvento — a 20% rev-share proposal"*
  - Body: specific reference to a client of theirs running multichannel → the 3 offers (free Scale seat, 20% rev-share for 12mo, priority support) → 15-min call ask.
- **2 agencies/week cadence** — deep prep per pitch. 20 hours total across 4 weeks.
- **Partner-agreement PDF** drafted by Day 30 (1-pager — agency logo + Palvento logo + 3-point terms + signature blocks).
- **Partner dashboard in-app** — minimum viable: list of referred merchants + their install status. Ship Week 6.
- **First agency case study** by Day 60 — 3 clients onboarded via one agency → short write-up + joint LinkedIn post.

---

# PHASE 2 — FOUNDING PARTNER COHORT (Days 60–120)

High-level sub-tasks only — details firm up once Phase 1 data is in.

## Play 8 — Customer research as content
- Otter.ai subscription ($30/mo).
- 45-min onboarding interview template with the `customer-research` skill protocol.
- Per interview: 2 verbatim quotes, 1 roadmap insight, case-study outline if revenue-worthy.
- **Batch processing:** Sunday transcription review → Monday memo to self with themes.

## Play 9 — 2026 Shopify Multichannel Feed Health Report
- Define the audit methodology (what counts as "rejected SKU", "margin gap", "resolution time") — Week 8.
- Recruit 40 stores via LinkedIn "free audit for anonymous data inclusion" — Weeks 9–12.
- Data pipeline: `scripts/feed-audit-export.ts` → anonymised CSV → analysis notebook.
- Gated PDF design + distribution plan (LinkedIn pinned, Capterra guest piece, Ecommerce Fuel exclusive pitch).
- **Ship: Week 18. Don't start before Week 8 — PMF data isn't there yet.**

## Play 10 — Newsletter sponsorships (Month 3)
- Book slots in order: Ecommerce Fuel ($800, Week 12), 2PM ($1,500, Week 13), Lenny's ($3,000, Week 14 — deprioritise if budget tightens).
- Build 3 unique landing pages + unique tracking links per placement.
- Creative per placement: native newsletter tone, not banner-ad energy.
- Post-placement: 14-day CAC measurement before committing to a repeat.

---

# PHASE 3 — COMPOUNDING (Days 120–240)

## Play 11 — /vs/* SEO pages
- Shipped: `/vs/feedonomics`, `/vs/linnworks`, `/vs/channelAdvisor`, `/vs/brightpearl`, `/vs/baselinker`.
- Add: `/vs/sellbrite`, `/vs/codisto`, `/vs/veeqo`, `/vs/shopify-marketplace-connect`, `/vs/spreadsheet`.
- Template pattern: hero comparison table → 5 honest "where they win" sections → 5 "where Palvento wins" sections → migration guide CTA.
- Week-by-week: 1 page/week, draft Mon–Tue, ship Thu.
- Content lead owns follow-through.

## Play 12 — Podcast guesting (6 targets)
- **Pitch writing week:** Week 18 — one angle per show, one Palvento-data stat per pitch.
- **Outreach cadence:** 1 pitch/week across Weeks 19–24.
- **Show prep ritual:** for each booking, write the 3 "pithy moments" + rehearse once. Podcast episodes that rehearse convert at 2–3× the unprepared ones.

## Play 13 — Capterra review velocity
- 45-day-post-install automated email (not bulk — personalised via mergefield).
- Target: 25 Capterra + 15 G2 by Day 180.
- "Top 5 Multichannel Software" badge by Day 240 (requires 20+ reviews ≥4.3★).
- Monitor in-product NPS → only route ≥9-scorers to review request (LTV hygiene).

---

# PHASE 4 — SCALE (Days 240–365)

## Play 14 — Operator dinners (3 events)
- eTail Palm Desert (Feb) — $1,200. 20 invites → 10 show.
- Shoptalk Vegas (Mar) — $1,500.
- Retail Global Sydney (Apr) — $1,800 (incl. AU champion customer flights).
- **Prep rhythm per event:** 8 weeks out — venue + invite list; 4 weeks out — invites send; 2 weeks out — confirmations; 1 week out — seating + talking points.
- Target: 4 customers per event. CAC ~$1,500 each.

## Play 15 — A2X content partnership
- Outreach to Paul Grey (A2X founder, NZ) — Week 32.
- Co-authored blog: *"Closing the Shopify ops loop: catalogue → feed → fulfilment → P&L"*.
- Mutual-promotion email series (3 emails to each other's shared customers).
- Cross-promo LTD offer to A2X lapsed users.

## Play 16 — Founding-partner flywheel
- Private Palvento Slack for the founding 10 — opened Day 90.
- Quarterly NPS (Day 180, 270, 360). Target ≥60 by Day 300.
- Reference-call program: each founding partner agrees to 4 reference calls/year in exchange for a permanent discount.

---

# Cross-cutting workstreams

## Weekly cadence (lock from Week 1)

| Day | Block | Action |
|---|---|---|
| Mon | 09–11 | LinkedIn visual for Tue post + blog writing |
| Mon | 11–13 | Weekly Capterra listing update + review monitoring |
| Tue | 09:00 UK | **Publish LinkedIn post #1 of week** |
| Tue | 09–12 | Outbound (30 connection requests + cold emails) |
| Tue | 14–17 | Product work (customer-surfaced fixes) |
| Wed | 09–12 | Customer / agency / partner calls |
| Wed | 13–17 | Customer research interview + transcription review |
| Thu | 09:00 UK | **Publish LinkedIn post #2 of week** |
| Thu | 09–12 | Outbound (30 connection requests + cold emails) |
| Thu | 14–17 | Reviews + case-study work |
| Fri | 09:00 UK | **Publish LinkedIn post #3 of week** |
| Fri | 09–13 | Product + content lead sync |
| Fri | 13–15 | Weekly retro: log KPIs to `kpis.md` |
| Sat | — | Off |
| Sun | 17–18 | 30-min weekly review: next-week deliverables locked, blockers surfaced |

## KPI log (every Sunday, `kpis.md`)

- Connections added (w/w)
- Post impressions (median across week's 3 posts)
- Connection-request acceptance rate
- Cold email reply rate
- Founding-partner applications
- Discovery calls booked
- Paying customers (gross new, net new after churn)
- Capterra reviews gained + listing impressions (where exposed)
- MRR

---

## Updates log

- **2026-04-21** — Task breakdown authored.
- **2026-04-21** — App Store plays (old Play 1, old Play 7) removed. Plays renumbered 1–16 total. Play 1 repurposed for direct-install "founding-partner install kit" (the equivalent receiving asset for all outbound).
