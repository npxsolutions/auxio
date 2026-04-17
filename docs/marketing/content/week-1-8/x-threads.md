# X/Twitter threads — 8 weeks, 8 threads

One thread per week. Five to seven tweets each. Published Tuesday or Wednesday, timed for US East Coast morning (8–10am ET). Founder voice, first person. No emoji. No "game-changing" / "10x" / "supercharge".

Each thread maps to that week's LinkedIn topic for cross-channel reinforcement.

---

## Thread 1 — Week 1 · The gap in the market

> 1/ I spent four months talking to Shopify operators before I wrote a line of Palvento. Every single one above $100k/mo had tried Feedonomics. Exactly one had bought it.

> 2/ The other nineteen did the same two things: asked for a price, heard "$2,500/mo with a 30-day onboarding," and went back to a spreadsheet.

> 3/ On the other end: Shopify Marketplace Connect. Free up to 50 orders. Covers Amazon, eBay, Walmart. No TikTok Shop. No Etsy. No feed rules. No error handling beyond "listing failed."

> 4/ The gap between "free connector with three channels" and "enterprise feed engine with a solutions architect" is enormous. Nobody had built a self-serve feed product that respected a Shopify founder's Tuesday afternoon.

> 5/ So I rewrote the thesis in one line: self-serve multichannel feed management for Shopify-led sellers scaling past their store. Every feature decision since then has been tested against that sentence. If it fails the sentence, it doesn't ship.

> 6/ This is week one of eight where I'll share what we're building, why, and the decisions I'm getting wrong. Palvento is live — $149/mo, no sales call. palvento-lkqv.vercel.app

---

## Thread 2 — Week 2 · The spreadsheet breaks at 200 orders/day

> 1/ The spreadsheet that runs most Shopify-plus-three-channel businesses breaks at exactly 200 orders a day. I've seen it a dozen times. It's always the same shape.

> 2/ Tab 1: product master, one row per SKU, 14 columns including "Amazon title", "eBay title", "Etsy tags". Tab 2: inventory, one row per SKU-warehouse pair, manually refreshed. Tab 3: orders, one tab per channel, pasted from CSV exports every Monday.

> 3/ At 40 orders/day it's fine. At 200 orders/day three things happen. First, inventory stops matching reality because nobody has time to paste Amazon's report every morning.

> 4/ Second, the pivot cache corrupts because someone opens it on a phone. Third, an Amazon listing gets suppressed for a missing GTIN and nobody notices for nine days because the spreadsheet doesn't surface rejections.

> 5/ The fix is not a better spreadsheet. The fix is a feed engine that ingests every channel at event time, catches rejections at ingest, and makes the pivot question redundant. That's what Palvento does.

> 6/ If you recognise the spreadsheet, you are exactly the operator we built this for. $149/mo, live in ten minutes. palvento-lkqv.vercel.app

---

## Thread 3 — Week 3 · Pricing a SaaS product three times

> 1/ I priced Palvento three times before I got it right. The first two versions were impossible to sell. Here's what I learned.

> 2/ Version 1: percentage of GMV. Looked great in the model. Every pitch meeting ended the same way — "so if I grow, I pay you more for the same product?" Correct. And unsellable to operators who understand unit economics.

> 3/ Version 2: per-SKU pricing. Logical on paper. In practice, a merchant with 12,000 SKUs and $30k/mo GMV would pay more than a merchant with 200 SKUs and $500k/mo GMV. The pricing penalised the wrong axis.

> 4/ Version 3: order-volume tiers. $149/mo (Starter), $349/mo (Growth), $799/mo (Scale), Enterprise from $2,000/mo. Published in five currencies. Flat. Predictable. Reflects the actual cost of serving each tier — API calls, sync events, storage.

> 5/ The insight: operators don't object to paying. They object to not knowing what they'll pay. Feedonomics doesn't publish pricing. Rithum doesn't publish pricing. Linnworks doesn't publish pricing. We do.

> 6/ Every pricing page should answer one question in under five seconds: "what will this cost me?" If yours doesn't, you're losing the operator before the demo.

---

## Thread 4 — Week 4 · Five Amazon feed mistakes that cost real money

> 1/ Five Amazon feed mistakes I keep seeing from Shopify operators expanding to marketplace. Each one costs real money. None of them are hard to fix if you catch them at ingest.

> 2/ Mistake 1: missing GTINs. Amazon requires a valid GTIN (UPC/EAN) for most categories. Submitting without one doesn't error gracefully — the listing just never appears. Your feed tool should catch this before submission, not after.

> 3/ Mistake 2: title length violations. Amazon caps at 200 characters for most categories, 80 for some. A title optimised for Shopify SEO at 280 characters gets silently truncated. The feed should validate per-channel limits.

> 4/ Mistake 3: wrong browse node. Amazon's category taxonomy changes quarterly. Submitting to a deprecated node means the listing shows up in the wrong category or doesn't index at all.

> 5/ Mistake 4: inventory sync lag. If your sync runs on a 15-minute cron and you sell 40 units in that window across two channels, you oversell. Sub-minute sync is not a luxury — it's the floor.

> 6/ Mistake 5: no feed-level error monitoring. Marketplace Seller Central shows errors. Eventually. A feed tool should surface them at ingest, before the listing hits the marketplace, with a clear remediation path.

> 7/ Palvento catches all five at the feed level. Error hub surfaces what's wrong, why, and how to fix it — before submission. $149/mo. palvento-lkqv.vercel.app

---

## Thread 5 — Week 5 · The Feedonomics gap

> 1/ Feedonomics was acquired by BigCommerce in 2022 for $145M. Since then, a gap opened in the market that nobody has filled. Here's what happened.

> 2/ Before the acquisition, Feedonomics served anyone with a complex feed — Shopify merchants, BigCommerce merchants, custom platforms. After the acquisition, the incentive structure shifted. BigCommerce owns it. Shopify merchants are structurally the wrong buyer.

> 3/ The sales motion didn't change: demo request, 30-day evaluation, managed services retainer, $2,500+/mo floor. That motion works for enterprise retailers. It does not work for a Shopify founder doing $25k/mo who wants to add TikTok Shop.

> 4/ Meanwhile, the floor of the market got covered. Shopify Marketplace Connect (Codisto) is free up to 50 orders. Covers Amazon, eBay, Walmart. Good enough for the first channel. Not good enough for serious feed optimisation.

> 5/ The gap: self-serve feed management with real rules, real error handling, and real per-channel P&L, at a price point between $149 and $799/mo. That's the gap Palvento fills.

> 6/ If you've been quoted $2,500/mo by Feedonomics and bounced, or outgrown Marketplace Connect's channel coverage — we built this for you. palvento-lkqv.vercel.app

---

## Thread 6 — Week 6 · What the Shopify App Store actually rewards

> 1/ We launched on the Shopify App Store this week. Here's what I've learned about what the algorithm actually rewards — and what it doesn't.

> 2/ What it rewards: review velocity. Not total reviews — velocity. An app with 15 reviews in the last 30 days outranks an app with 200 reviews and none in 90 days. This means launch momentum matters more than cumulative reputation.

> 3/ What it rewards: recency of listing updates. Updating your screenshots, changelog, or description signals active development. The algorithm notices. We update something every week.

> 4/ What it rewards: install-to-active ratio. Downloads alone don't help if merchants install and churn in 48 hours. The algorithm tracks activation. This is why our onboarding targets first feed live in under ten minutes.

> 5/ What it doesn't reward: paid reviews, keyword stuffing in the description, or gaming the category taxonomy. Shopify's review team catches these and the penalty is delisting.

> 6/ The Shopify App Store is where Shopify merchants shop for ops tooling. Not Google. Not G2. Ranking well here is the single highest-leverage channel for our wedge.

> 7/ If you're building for Shopify merchants and not treating the App Store as your primary distribution channel, you're leaving the best leads on the table.

---

## Thread 7 — Week 7 · Why revenue-percentage pricing is a tax on growth

> 1/ Most multichannel software charges a percentage of your revenue. I think this is wrong on principle. Here's why.

> 2/ A percentage-of-GMV model means the merchant who grows from $50k/mo to $500k/mo pays 10x more for the same product. The software didn't get 10x better. The API calls didn't cost 10x more. The margin just got extracted.

> 3/ It also creates a perverse incentive: the vendor benefits from the merchant's growth without having to ship anything new. The product can stagnate and the revenue still goes up. That's a tax, not a partnership.

> 4/ The argument for percentage pricing is "alignment." But alignment with what? The merchant's goal is to grow margin. The vendor's goal under % pricing is to grow the merchant's top line. Those are not the same thing.

> 5/ Palvento charges flat tiers indexed to order volume. $149/mo, $349/mo, $799/mo, Enterprise from $2,000/mo. A high-AOV luxury brand and a low-AOV consumables brand pay similarly at similar volume. That reflects actual cost of service.

> 6/ If your feed tool charges a percentage of your revenue, do the maths at your 12-month projection. Then check what Palvento costs. The difference is your tax.

---

## Thread 8 — Week 8 · What we shipped in 8 weeks

> 1/ Eight weeks ago I started posting here about what we're building and why. Here's the honest scorecard — what shipped, what didn't, and what's next.

> 2/ What shipped: Shopify App Store listing live. Feed rules engine covering Amazon, eBay, TikTok Shop, Etsy, Walmart, OnBuy. Error hub with pre-submission validation. Per-channel P&L with FX spread. Sub-minute inventory sync.

> 3/ What shipped that I didn't expect to matter: the onboarding. We spent three iterations getting "first feed live in under ten minutes" right. Turns out the ten-minute promise is the single highest-converting line in every piece of copy we run.

> 4/ What didn't ship: the WooCommerce and BigCommerce connectors are behind schedule. Both need another two weeks. I underestimated the schema complexity on BigCommerce's V3 catalog API.

> 5/ What I got wrong: I thought cold outreach would be our second-best channel. It's fifth. The Shopify App Store and organic content are doing the work. Cold email converts, but the volume isn't there yet at our list quality bar.

> 6/ What's next: BigCommerce and WooCommerce connectors. Partner program for Shopify agencies. And a longer piece on what "self-serve multichannel feed management" looks like at the $1M/mo GMV tier.

> 7/ If you've been following along — thank you. If you want to try what we've built: palvento-lkqv.vercel.app. $149/mo, live in ten minutes, no sales call.
