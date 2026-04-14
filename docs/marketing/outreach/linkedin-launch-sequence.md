# LinkedIn Launch Sequence — Founder, 6 Weeks

> One post per week for six weeks, founder-led. Tone: editorial, first-person, no emoji, no exclamation marks. Each post ends with a single question to open comments. Hashtags kept to 3–5, all lowercase. UK time zone — founder posts from London.

---

## Week 1 — Founder narrative: why we built Meridia

**Engagement profile:** Narrative (personal story)
**Optimal day/time:** Tuesday, 08:15 UK
**Visual brief:** A single photograph of a battered spreadsheet printout with handwritten margin notes in red pen. Landscape, slightly desaturated. No product UI in frame.

**Hook (first two lines):**

> The spreadsheet that broke my last business had 14 tabs and 47 VLOOKUPs. It took a Sunday night to reconcile and a Monday morning to argue about.
> That spreadsheet is why Meridia exists.

**Body:**

In 2023 I was running a small homewares business across Shopify, Amazon UK, and eBay. Revenue looked fine. The dashboard said we were up. The quarterly P&L said otherwise by about six points of margin, and nobody could explain where the gap lived. It lived in fees we didn't model, FX we booked at invoice rate instead of settlement, and oversells we paid to refund.

I tried the incumbents. Linnworks wanted six weeks and a sales call before I could see my own data. Brightpearl priced out at what would have been half a junior hire. ChannelAdvisor wanted a percentage of revenue, which is the one pricing model an operator on thin margin cannot stomach.

So we built Meridia. One ledger. Every channel. Every currency. Ten minutes to the first honest number. Order-volume pricing — never a percentage of revenue.

We're shipping it publicly now. If you've lived inside that spreadsheet, I'd like to hear what finally broke it for you.

**Hashtags:** #ecommerce #shopify #multichannel #commerce #operators

---

## Week 2 — Tactical: the spreadsheet that breaks at 200 orders/day

**Engagement profile:** Tactical (operator how-to)
**Optimal day/time:** Wednesday, 07:45 UK
**Visual brief:** A carousel screenshot (slide 1) of a redacted spreadsheet with five tabs — Inventory, Amazon orders, eBay orders, Shopify orders, Reconcile. Slide 2: the same spreadsheet with red circles on the cells that break. Slide 3: the replacement Meridia view.

**Hook:**

> Here is the exact spreadsheet shape that five-marketplace operators use. I've seen twelve variations of it in the last six months.
> It breaks, predictably, at around 200 orders a day. Here is why.

**Body:**

The structure is always the same. Tab 1: a master SKU list with opening stock. Tabs 2–5: one per channel, with orders imported by hand every morning. Tab 6: a reconcile sheet that subtracts channel orders from opening stock and writes back adjusted availability. Tab 7: a P&L tab that applies a blended fee percentage and calls it margin.

It works at 30 orders a day. It wobbles at 80. At 200 it breaks, and it breaks in three specific places.

First, the reconcile tab lags the actual sales. You oversell on Amazon because eBay's morning orders haven't been imported yet. Second, the blended fee percentage hides the SKU-level truth — one product is subsidising another and nobody knows which. Third, FX is booked at the invoice date, not the payout date, so the GBP figure in cell F4 is an accounting fiction.

The fix is not a better spreadsheet. It is a live ledger that writes stock and fees in the same moment the order lands.

What was the specific tab that broke for you first?

**Hashtags:** #ecommerce #operations #shopify #amazonsellers #multichannel

---

## Week 3 — Product: the multi-currency P&L view

**Engagement profile:** Product (feature spotlight)
**Optimal day/time:** Thursday, 08:30 UK
**Visual brief:** A clean screenshot of Meridia's multi-currency P&L table. Three rows — one SKU sold across amazon.co.uk (GBP), amazon.com (USD), amazon.de (EUR). Columns: gross, fees, FX, net. A single cell highlighted in cobalt showing the real post-settlement margin. Annotation arrow: "settled rate, not invoice rate."

**Hook:**

> Most multi-currency dashboards lie. Not on purpose — by convention.
> This is the view we built after we stopped trusting ours.

**Body:**

If you sell across currencies, your accounting software probably converts every sale at the rate on the invoice date. That is the standard convention. It is also wrong for the purpose of running a business, because the money that actually lands in your bank is the settled rate, not the invoice rate, and by the time the Amazon payout clears the gap is material.

On a £25 SKU sold through amazon.com with a typical two-week payout lag, we've seen the gap run at 1.4% to 3.8% depending on the quarter. For a business doing 20,000 cross-border orders a year, that is real money — and it is the difference between a product line you lean into and one you quietly kill.

Meridia's settled P&L view reads payout data directly. Every order shows its true net after FX, fees, and any payout adjustment. No blended percentage. No monthly surprise.

If you're running cross-border and would like to see the same view on your own numbers, there is a public trial at auxio-lkqv.vercel.app.

Which channel is your biggest cross-border line, and do you trust the margin number on it?

**Hashtags:** #ecommerce #finance #multicurrency #amazon #commerceops

---

## Week 4 — Customer story: Marcus, 8% to 22% margin

**Engagement profile:** Narrative (customer story)
**Optimal day/time:** Tuesday, 08:00 UK
**Visual brief:** A simple two-colour line chart. X-axis: weeks 1–8. Y-axis: contribution margin. One line labelled "before" flat at 8%. One line labelled "after" climbing to 22% by week 8. No branding on the chart — just the numbers.

**Hook:**

> Marcus runs a five-marketplace homewares business out of Birmingham. Eight percent contribution margin in January. Twenty-two percent by April.
> Here is what changed, and what didn't.

**Body:**

Marcus is a composite — an operator I worked with alongside two others with near-identical shape. £180k/month GMV across Shopify, Amazon UK, Amazon DE, eBay, and Etsy. Three-person team. On spreadsheets and Linnworks, in that order.

What changed in 60 days was not the product mix. It was visibility.

First, pricing floors per channel. He was running an Amazon promo every Tuesday that dropped price below his Etsy floor; Etsy customers were rebuying and arbitraging his own stock. The floor engine killed the cross-leak in a week.

Second, settled FX. His top SKU on amazon.de was sold at a contribution margin he believed was 14%. At the real payout rate it was 6%. He raised the EUR price by €2.50 — still below the competing listings — and the margin snapped to 13% with no volume loss.

Third, stranded stock. Two SKUs in a Sheffield warehouse hadn't been touched in 11 weeks because the listing feed had silently 404'd on Amazon DE. The sync caught it. £4,200 of stock moved in the next fortnight.

None of these are miracles. They are all numbers that were already true — and now visible.

What's the number in your own business you suspect is lying to you?

**Hashtags:** #ecommerce #shopify #multichannel #casestudy #operators

---

## Week 5 — Industry POV: the era of point tools is over

**Engagement profile:** Narrative (opinion piece)
**Optimal day/time:** Wednesday, 09:00 UK
**Visual brief:** A simple diagram. Left panel: seven tool logos (spreadsheet, repricer, feed manager, 3PL portal, A2X, Xero, Linnworks) arranged in a cluttered stack. Right panel: a single Meridia box. A minimal arrow in between. Editorial layout, lots of whitespace.

**Hook:**

> The commerce ops stack in 2020 was seven tools held together with Zapier and prayer. In 2026 it is one platform and an API.
> Every point tool between here and there is on borrowed time.

**Body:**

The argument for point tools made sense in 2018. Feeds were hard. Repricing was hard. Inventory sync was hard. Each problem earned its own SaaS, and the best of each — Feedonomics, Repricer, Linnworks — built real businesses.

Then the surface area grew. Operators now work across five marketplaces, two currencies, three fulfilment locations, and an ad stack that touches all of them. Stitching seven tools together to reason about a single SKU is no longer a tractable problem for a three-person team.

The next generation of platforms will not win by having a better repricer. They will win by holding the full loop — supplier to payout — in one data model, and exposing a real API so the rest of the operator's stack can read from it.

This is not a marketing line. It is why Feedonomics bolted onto BigCommerce, why Linnworks is priced at a point only the upper mid-market can afford, and why ChannelAdvisor charges a percentage of revenue — the unit economics of the point-tool era are no longer stable.

Meridia is opinionated about this. One ledger, every channel, one API. If we are wrong, the market will tell us within 18 months.

What does your own stack look like today, and what would you consolidate first if you could?

**Hashtags:** #ecommerce #saas #commerce #operators #platforms

---

## Week 6 — Demo invite + Product Hunt teaser

**Engagement profile:** Product (soft launch)
**Optimal day/time:** Thursday, 08:20 UK
**Visual brief:** A single still frame from a screen recording — the Meridia onboarding screen with a timer overlay showing 00:09:47. Caption burned into the image: "first real number, under ten minutes." Clean, documentary.

**Hook:**

> We are launching Meridia publicly in two weeks. Before that, a small invitation.
> If you want to see what a ten-minute time-to-first-value actually looks like on your own data, read on.

**Body:**

Meridia goes out on Product Hunt on a Tuesday later this month. Before that happens, I'd like to run twenty live demos with operators who are already living inside the multichannel problem — Shopify plus two or more marketplaces, somewhere between £50k and £500k a month, feeling the weight of it.

The demo is twenty minutes. We connect your Shopify and one marketplace live, pull your real SKUs and real orders, and look at the settled P&L and inventory view together. No slide deck. You leave with a working tenant whether or not you buy.

Two reasons this is useful to me. One, we find the edges of the product on real data. Two, the operators who see it first become the reference set for the launch week — which matters more than any paid channel.

If this is useful to you, comment below or DM me and I'll send slots. Public trial lives at auxio-lkqv.vercel.app for anyone who prefers to self-serve.

What would you want to see on screen in the first three minutes to decide if it's worth your twenty?

**Hashtags:** #ecommerce #producthunt #shopify #launch #commerce
