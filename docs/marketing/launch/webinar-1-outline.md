# Webinar 1 — Running 5 Marketplaces on One Ledger, Live Walkthrough

> Format: 45 minutes, live. 30 minutes content + demo, 15 minutes Q&A. Zoom Webinar (not Meeting) for attendee controls. Recording posted to the blog within 24 hours of airing.

---

## Registration page copy

**Title (78 chars):**
> Running 5 marketplaces on one ledger — a live walkthrough of the operator view

**Sub-line (156 chars):**
> A 45-minute working session for Shopify-plus-marketplace operators. Connect channels, reconcile inventory, settle multi-currency P&L — all inside one tenant.

**What you'll learn:**
- How a five-marketplace operator moves from 14 spreadsheet tabs to one live ledger in under a working day.
- Why your current multi-currency margin number is 1.4% to 3.8% lower than your dashboard thinks, and how to read the real one.
- The four fixes — pricing floors, settled FX, stranded-stock alerts, per-channel buffers — that typically unlock 4–8 points of contribution margin inside a quarter.

**Who this is for:**
> Founders and ops leads at multichannel ecommerce businesses between £50k and £500k a month GMV, on Shopify plus two or more marketplaces, currently living inside spreadsheets or actively trying to leave Linnworks.

**Hosted by:** <FOUNDER_NAME>, founder of Fulcra

**Date and time:** <DATE_PLACEHOLDER>, 14:00 UK / 09:00 ET

**Register:** https://auxio-lkqv.vercel.app/webinars/one-ledger

---

## Pre-event email — sent 24 hours before

**Subject:** tomorrow, 14:00 UK — one ledger, five marketplaces

**Body (82 words):**

Hi {{firstName}},

Quick reminder that tomorrow's session runs at 14:00 UK / 09:00 ET for 45 minutes. We will connect a live Shopify + Amazon tenant in the first ten minutes and look at the settled multi-currency P&L on real orders. No slides for the middle twenty.

Bring one question from your own ops. I will queue audience questions after the demo and we will work through as many as we can before the hour closes.

Join link: <JOIN_LINK_PLACEHOLDER>

See you tomorrow.

— <FOUNDER_NAME>

---

## Slide-by-slide outline — 18 slides

### Slide 1 — Title (1 min)
- Running 5 Marketplaces on One Ledger
- Host name, company, date
- Housekeeping: 45 minutes, Q&A at the end, recording will be sent
- Demo or visual: static title card, cobalt on off-white

### Slide 2 — Who this is for (1 min)
- Multichannel operators, £50k–£500k/mo, 1–5 person teams
- Shopify plus two or more marketplaces
- Currently on spreadsheets or trying to leave Linnworks
- If you're pure single-channel DTC, this won't apply
- Demo cue: none

### Slide 3 — What we're going to do today (1 min)
- Four-point agenda: problem, demo (the bulk), four fixes, Q&A
- "No slides for the middle twenty — it's a product walkthrough"
- Promise: you will leave with a copyable checklist, not a sales deck
- Demo cue: none

### Slide 4 — The shape of the problem (2 min)
- 14 spreadsheet tabs, 47 VLOOKUPs, Sunday-night reconcile
- Dashboard says up, quarterly P&L says down by 6 points
- The gap has a name, and the name is "settlement"
- Visual: the spreadsheet printout photograph from LinkedIn week 1

### Slide 5 — Why incumbents don't solve it (2 min)
- Linnworks: 6-week implementation, rep-gated, 2016 UI
- Brightpearl: 90-day setup, $7,500/mo entry
- ChannelAdvisor: percentage of GMV, enterprise-only
- Spreadsheets: free, infinitely flexible, break at 200 orders/day
- Visual: competitive landscape strip from positioning.md

### Slide 6 — Demo bridge (1 min)
- "For the next twenty-two minutes I'm going to stop talking about this and show it"
- Show the pre-setup: empty tenant, Shopify store ready to connect, Amazon seller account ready to connect
- Demo cue: switch to full-screen browser, Fulcra onboarding URL

### Slide 7 — Demo: connect Shopify (2 min)
- OAuth flow, store selected, data import begins
- Show import log in real time
- Highlight: no CSV, no IT, no API keys pasted by hand
- Demo cue: live browser

### Slide 8 — Demo: connect Amazon (2 min)
- Amazon Seller Central OAuth
- First order row lands on screen within ninety seconds of connection
- Demo cue: live browser, commentary on what's appearing

### Slide 9 — Demo: the inventory ledger (3 min)
- Stock per SKU per location per channel, live
- Deliberate oversell scenario: toggle a SKU to 2 units, show buffer per channel updating
- Show webhook log: when a Shopify order lands, Amazon availability updates inside seconds
- Demo cue: split screen — Fulcra inventory view left, Shopify admin right

### Slide 10 — Demo: the multi-currency P&L (4 min)
- Show the settled vs indicative view
- Filter by delta descending — surface the SKUs where FX is eating margin
- Click into one row: show fees, FX, fulfilment, returns breakdown
- Commentary: "this column is the one that doesn't exist in your current stack"
- Demo cue: P&L view, specific SKU drilldown

### Slide 11 — Demo: pricing floors (2 min)
- Set a floor per SKU per channel
- Trigger a fake promo that would breach the floor — show the block
- Show audit log of the attempted change and the reason it was rejected
- Demo cue: pricing module

### Slide 12 — Demo: the API (2 min)
- Open /developers in a second tab
- Show a cURL against the orders endpoint, live response
- "This is the same auth your BI tool or your accountant's month-end script uses"
- Demo cue: terminal plus browser

### Slide 13 — Back to slides: the four fixes (2 min)
- One: pricing floors per channel
- Two: settled FX on every cross-border order
- Three: stranded-stock alerts on listing failures
- Four: per-channel inventory buffers sized by actual lead times
- Visual: four-tile grid with a number next to each

### Slide 14 — What changes in a quarter (2 min)
- Composite operator: 8% to 22% contribution margin in 60 days
- Breakdown of where the 14 points came from
- Honest caveat: results scale with volume and are not linear
- Visual: the before/after line chart from LinkedIn week 4

### Slide 15 — What Fulcra is not (1 min)
- Not an ERP. Not an accounting tool. Not a repricer with a percentage-of-GMV bill.
- Not a 6-week implementation. Not a demo-only product.
- The point is clarity on what to compare us to, not defensiveness
- Visual: a short "is / is not" two-column list

### Slide 16 — Pricing and trial (1 min)
- Flat order-volume pricing, public on the site
- 14-day trial, self-serve, no card for the first week
- A single line: "we don't take a percentage of your revenue, ever"
- Demo cue: quick cut to pricing page

### Slide 17 — How to get started today (1 min)
- Three paths: self-serve trial, 20-minute demo, download the multichannel cost essay
- Every path is on one URL: auxio-lkqv.vercel.app
- Demo cue: static URL slide

### Slide 18 — Q&A and thank-you (15 min)
- Hand to host for moderated Q&A
- If slow, seed with prepared questions (see below)
- Closing remark: replay and deck will land in their inbox within 24 hours

---

## Demo flow — 11 minutes, live

Ordered sequence of clicks and script cues.

**00:00–01:00 — Open tenant.** Blank tenant, no connections. Narrate: "nothing connected, nothing imported — ten-minute clock starts now."

**01:00–02:30 — Connect Shopify.** Click Connect → Shopify. OAuth flow, approve, return to tenant. Import bar appears. Narrate while the bar runs: "this is pulling your last 12 months of orders, SKUs, and inventory state. For most stores it finishes in two to three minutes."

**02:30–04:00 — Connect Amazon.** Click Connect → Amazon Seller Central. OAuth flow through Amazon. First order row lands inside ninety seconds. Narrate: "Amazon's API is slower than Shopify's, this is normal."

**04:00–06:00 — Inventory ledger.** Navigate to /inventory. Show stock per SKU per location per channel. Pick one SKU with low stock. Toggle a test adjustment to 2 units — watch all three channel buffers update inline. Narrate: "this is the weekend-oversell problem solved at the schema level."

**06:00–08:30 — Multi-currency P&L.** Navigate to /finance/pnl. Switch view from indicative to settled. Sort by delta descending. Click into the top offender. Walk through fees, FX, fulfilment, returns. Narrate: "this column — the FX delta column — is what your spreadsheet cannot give you."

**08:30–09:30 — Pricing floors.** Navigate to /pricing/floors. Set a floor on one SKU. Simulate a promotion that breaches it. Show the block and the audit log. Narrate: "nobody ships at a loss by accident. Ever."

**09:30–11:00 — The API.** Open /developers. Show a live cURL against the orders endpoint. Show the typed SDK quick-start. Narrate: "this is a surface, not a premium SKU. Your developer or your accountant can read from this without a support ticket."

**11:00 — Return to slides.**

---

## Q&A seed prompts

Five questions the host can pose if audience Q&A runs slow.

1. "For an operator currently on Linnworks — how long does a migration take, and what happens to the historical data?"
2. "How does Fulcra handle oversell prevention specifically during a 12-hour marketplace API outage?"
3. "Can the multi-currency P&L reconcile against Xero or QuickBooks at month-end, or does it replace them?"
4. "What's the story on VAT and sales tax — is this handled inside Fulcra or does it hand off to a dedicated tool?"
5. "If I'm running a private label brand on Amazon and not using Shopify yet, is this still the right platform, or do I wait?"

---

## Follow-up email — sent 1 hour after

**Subject:** the replay, the deck, and a short next step

**Body (96 words):**

Hi {{firstName}},

Thank you for joining today. A few things from the session:

Replay: <REPLAY_LINK_PLACEHOLDER>
Deck: <DECK_LINK_PLACEHOLDER>
The multichannel cost essay I referenced in slide 14: https://auxio-lkqv.vercel.app/blog/the-true-cost-of-multichannel-spreadsheets

If you want to see the settled P&L and inventory views on your own data, the self-serve trial is live at auxio-lkqv.vercel.app — ten minutes to connect Shopify and one marketplace. If you would rather walk it together, reply with a timezone and I will send two slots this week.

Either way, I would like to hear what is breaking for you currently.

— <FOUNDER_NAME>

---

## Promotion plan

**Four-week window before air date.**

Week minus 4 — announce on the founder's LinkedIn with the registration link. Cross-post to the Fulcra company page. Target 150 registrations from organic LinkedIn alone.

Week minus 3 — email the newsletter list (current size, segmented to Tier 2 signals). Include a one-line personalised note from the founder. Target 40% open rate, 12% click-through to registration.

Week minus 2 — Twitter thread announcing the session (reuse Thread 2 topic as a teaser thread, ending with the registration link). Partner co-promotion ask to three ecommerce podcasts and two agency partners — offer them a reciprocal plug in the replay email.

Week minus 1 — second LinkedIn post from the founder (narrative framing, not a flyer). One segmented reminder email to everyone who opened but did not register. Twitter reminder in the 48-hour window.

Day of — 2-hour-before Twitter reminder. LinkedIn story or short-form post 30 minutes before go-live.

Post-air — replay embedded in the blog post, clip the strongest 90-second demo moment for LinkedIn and Twitter distribution in the following week. Repurpose the slide deck as a SlideShare / PDF lead magnet on the blog.

**Success metrics.** Registrations: 400. Live attendance: 35% of registrations (140). Replay views in first 7 days: 300. Trial signups attributed to the webinar: 25. Booked demos: 10.
