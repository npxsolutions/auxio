# LinkedIn — 8 weeks, 24 posts

Three posts per week. Cadence: Tuesday, Thursday, Friday. Times tuned for UK operator hours.
Voice rules: no exclamation marks, no emoji, no "game-changing" / "supercharge" / "10x" / "the future of".
Founder voice, first person. Specific numbers. Labelled composites when a customer story appears.

> **⚠️ 2026-04-21 — REWRITE PENDING.** App Store distribution is closed (decision: direct install via palvento.com). Do **NOT publish** the following without rewriting first:
>
> - **Post #3** (line ~86) — references "App Store ranking" as the go-forward business. Swap to "Capterra ranking + direct-install motion".
> - **Post #11** (line ~169) — "Self-serve install from the Shopify App Store" in the product pitch. Swap to "Self-serve install direct from palvento.com".
> - **Post #21** (line ~584) — whole post is *"App Store is the primary acquisition channel"*. Entire post needs retargeting to *"Capterra is the primary acquisition channel"* or *"Direct install is the primary channel"*. See `task-breakdown.md` Play 3 for the new framing.
> - **Post #23** (line ~646) — "Shopify App Store install" in the product description. Swap to "Direct Shopify OAuth from palvento.com".
> - **Post cadence table** (line ~705) — Week 7 Friday is listed as "POV — App Store". Retarget to "POV — why direct install beats App Store for a bootstrapped wedge" or similar.
> - **Post #24** (line ~677) — "Shopify App Store install to a live marketplace listing" in the final retro post. Swap to "palvento.com signup to a live marketplace listing".
>
> Rival-name sweep for Posts 2–24 is also still pending per `project_current_state.md`. Bundle both sweeps into one pass.

Legend on the content mix:

- **Narrative** (8) — founder thesis, decisions, lessons
- **Tactical** (8) — operator friction, how-to, spreadsheets that break
- **Product** (4) — feature reveals tied to a real pain
- **POV** (4) — category commentary

Weeks 1–2: founder thesis. Weeks 3–4: tactical. Weeks 5–6: product. Weeks 7–8: POV + launch teaser.

---

## Week 1

### Post 1 — Narrative · Tue 08:30 UK

**Hook**
I spent four months talking to Shopify operators before I wrote a line of Palvento.
What I found killed the pitch deck I had.

**Body**
Every single operator I spoke to above 100k a month had looked at the enterprise feed tools. Exactly one had bought. The other nineteen had done the same two things — asked for a price, heard 2,500 a month with a 30-day onboarding, and gone back to a spreadsheet.

The spreadsheet was the problem I thought I was solving. It turned out to be the symptom. The actual problem was that the tier between the free channel add-ons and the enterprise feed engines didn't exist. Nobody had built a self-serve feed product that respected a Shopify founder's Tuesday afternoon.

So I threw the deck out and rewrote the thesis in one line: self-serve multichannel feed management for Shopify-led sellers scaling past their store. Every feature decision since then has been tested against that sentence. If it fails the sentence, it doesn't ship.

This is week one of eight where I'll share what we're building, why, and the decisions I'm getting wrong.

10 founding-partner spots open at 40% off for life. palvento.com — or DM me.

**Hashtags**
#Shopify #Ecommerce #Multichannel #BuildInPublic

**Visual brief**
Market-map illustration. Left column: "Free · Basic channel sync" with 3-channel cap / 50 orders/mo / no feed rules. Right column: "Enterprise · Managed feed services" with 2,500/mo / 30-day onboarding / quote-gated. Centre gap claimed by a cobalt italic "here." with Palvento wordmark.

---

### Post 2 — Tactical · Thu 09:15 UK

**Hook**
The spreadsheet that runs most Shopify-plus-three-channel businesses breaks at exactly 200 orders a day.
Here is where it breaks.

**Body**
I've seen this spreadsheet a dozen times. It's always the same shape:

- Tab 1: product master, one row per SKU, 14 columns including "Amazon title", "eBay title", "Etsy tags".
- Tab 2: inventory, one row per SKU-warehouse pair, manually refreshed.
- Tab 3: orders, one tab per channel, pasted from marketplace CSV exports every Monday.
- Tab 4: a pivot table that is always one week out of date.

At 40 orders a day it is fine. At 200 orders a day it is a liability. Three specific things happen. First, the inventory tab stops matching reality because nobody has time to paste Amazon's inventory report every morning. Second, the pivot cache corrupts because someone opens it on a phone. Third, an Amazon listing gets suppressed for a missing GTIN and nobody notices for nine days because the spreadsheet doesn't surface rejections.

The fix is not a better spreadsheet. The fix is a single ledger that ingests every channel at event time, catches rejections at ingest, and makes the pivot question redundant. That's what we're building.

If you recognise the spreadsheet, you are exactly the operator I want to talk to.

If you recognise the shape — Shopify-led, three to five channels — DM me. 10 founding-partner spots open at palvento.com, 40% off for life.

**Hashtags**
#Shopify #Ecommerce #Operations #Multichannel

**Visual brief**
A screenshot-style mockup of a real Google Sheets tab with four tab names across the bottom. Red annotation arrows pointing at three specific cells labelled "breaks here", "goes stale", "corrupts on mobile".

---

### Post 3 — Narrative · Fri 10:00 UK

**Hook**
I turned down a 400k seed round last November.
Best call I made all year.

**Body**
The term sheet was good. The investor was smart. The problem was the pitch I'd given them.

I'd shown them the 7.6 trillion dollar global commerce number. I'd shown them Shopify, Amazon, Mercado Libre. I'd used the phrase "operating system for commerce" three times on a single slide. They bought every word of it and wanted to fund it.

And on the flight home I realised I'd sold them a story I didn't believe. The real business is narrower. It is not a commerce OS. It is a feed-management product for a specific kind of operator — Shopify-led, three to five channels, quoted by the enterprise feed vendors and bounced. That business does not need 400k. It needs 60k, twelve months of focus, and the App Store ranking.

So I emailed the investor the next morning, declined, and narrowed the thesis. The landing page got rewritten that weekend. The wedge locked. And the product started shipping in the right direction for the first time in six months.

The lesson I took: a smaller, truer story funds a bigger real business than the reverse.

10 founding-partner spots open at 40% off for life. palvento.com — or DM me.

**Hashtags**
#Startups #Founders #Shopify #BuildInPublic

**Visual brief**
A photograph of a closed laptop on a plane tray table, window light. Caption overlay: "declined Nov 2025".

---

## Week 2

### Post 4 — Narrative · Tue 08:30 UK

**Hook**
I priced Palvento three times before I got it right.
The first two attempts made the product impossible to sell.

**Body**
Version one was 99 a month flat. Too cheap to fund the engineering, too expensive for the Starter tier, and priced exactly where Shopify's own first-party sync already sat — so every prospect asked why they'd switch.

Version two was usage-based. One cent per synced SKU, one cent per order. Elegant on a spreadsheet, hostile to a founder trying to forecast their March invoice. Three trialists told me the same thing — "I can't approve this because I don't know what it'll cost".

Version three is what ships: 59 for one channel, 159 for five, 499 for unlimited, flat, published in five currencies, no percentage of GMV. It is boring and legible and every operator I've shown it to nods at 159 and says "that's what I'd expect to pay". Boring beats clever on pricing every single time.

The lesson: you can be creative on the product and strict on the price. The reverse gets you nowhere. Every competitor in the enterprise tier that hides a price is telling you they haven't figured out their own business yet.

10 founding-partner spots open at 40% off for life. palvento.com — or DM me.

**Hashtags**
#Pricing #SaaS #Shopify #Founders

**Visual brief**
Three simple cards stacked vertically, labelled "v1 — flat 99", "v2 — usage", "v3 — 59 / 159 / 499". Only v3 has a checkmark.

---

### Post 5 — Tactical · Thu 09:15 UK

**Hook**
Five mistakes I see every multichannel Shopify seller make in their first year on Amazon.
Three of them cost real money.

**Body**
One. Using the same product title on Amazon as on Shopify. Shopify titles optimise for brand. Amazon titles optimise for keyword match. Copying across costs you search visibility and, within a week, revenue.

Two. Shipping without a UPC or EAN on new ASINs. Amazon auto-generates a GCID and two months later you discover you've been losing the buy box to a counterfeit because your listing has no canonical identifier.

Three. Setting the same price across channels. Amazon's fee structure is not eBay's fee structure is not TikTok Shop's fee structure. A flat price across channels means you are losing money on at least one of them. Per-channel floors, set once, enforced at sync, solve this.

Four. Not reconciling FBA removal fees. They sit in a separate payout line, most Shopify operators never look at them, and for inventory-heavy sellers they cost 300 to 1,200 a month invisibly.

Five. Treating the feed as a one-time setup. It isn't. Category schemas change. Banned-word lists expand. A feed that was clean in January is non-compliant by July.

None of this is glamorous. All of it is margin.

If you recognise the shape — Shopify-led, three to five channels — DM me. 10 founding-partner spots open at palvento.com, 40% off for life.

**Hashtags**
#Amazon #Shopify #Ecommerce #Multichannel

**Visual brief**
A clean 5-row checklist, each row with a red strike-through and a green-tick fix beside it. Black text on cream background.

---

### Post 6 — POV · Fri 10:00 UK

**Hook**
30,000 Shopify operators globally are running three to five marketplaces on a spreadsheet.
That is the operator we built Palvento for.

**Body**
They're doing 100,000 to 500,000 a month in GMV. They started on Shopify and they're staying on Shopify — marketplaces are additive, not replacement. They added Amazon first. Then eBay. Then TikTok Shop. By the time they hit three channels the catalogue has quietly turned into a Google Sheet with one tab per marketplace and a pivot table that's always a week out of date.

They are not running an enterprise retail operation. They don't have a channel-ops team. They don't need a solutions architect, a 30-day onboarding, a custom SLA, or a percentage-of-GMV deal. What they need is the feed to be clean, every marketplace that matters to be live, and a price they can forecast to a line item.

That is the exact shape Palvento is cut to. Self-serve install from the Shopify App Store. Live on the first channel in under ten minutes. Nine target channels. Pre-flight feed validation that catches missing GTINs, image-resolution failures, banned words, and category-attribute gaps before the feed hits the marketplace. Per-channel pricing floors. Per-channel P&L with line-item fee attribution. Published pricing in five currencies — 59, 159, 499, flat.

Everything else is a distraction until this operator is served well. That is the whole thesis. That is the whole roadmap.

10 founding-partner spots open at 40% off for life. palvento.com — or DM me.

**Hashtags**
#Ecommerce #Shopify #SaaS #Commerce

**Visual brief**
An ICP portrait card. Title "Who we built Palvento for". Four rows: "Shopify-led · 100k–500k/mo GMV · 3–5 channels · small ops team." Cobalt accent on the title. Cream background.

---

## Week 3

### Post 7 — Tactical · Tue 08:30 UK

**Hook**
The true cost of a missing GTIN on Amazon is not the suppression.
It is the nine days you don't notice.

**Body**
Here is the sequence I have now watched play out on six different Shopify-plus-Amazon sellers.

Day 0. A new variant gets pushed to Amazon. The listing goes live because Amazon's ingestion is lenient at the edges. No error is surfaced to the seller.

Day 2. Amazon's catalogue team flags the listing for missing GTIN. The listing is suppressed. An email arrives in a seller-central inbox nobody checks daily.

Day 5. The seller notices search ranking has dropped for the parent ASIN. They do not yet connect it to the variant.

Day 9. Revenue on the ASIN is down roughly 22 percent week on week. The seller opens Seller Central, finds the suppression, fixes the GTIN, and re-submits. Re-indexing takes another 48 hours.

Total damage from one missing 13-digit identifier: eleven days of suppressed revenue on a listing that was otherwise working. I have seen this cost operators 900 to 4,000 in a single incident.

The fix is trivial. Catch the missing GTIN at ingest, before the feed is pushed to Amazon. Surface it to the operator with the exact variant and the suggested fix. That is one of the first things Palvento's pre-flight validator does and it is the single feature every trialist has commented on.

If you recognise the shape — Shopify-led, three to five channels — DM me. 10 founding-partner spots open at palvento.com, 40% off for life.

**Hashtags**
#Amazon #Ecommerce #Operations #Shopify

**Visual brief**
A horizontal timeline with day labels 0, 2, 5, 9. A revenue line chart overlaid, dropping from day 2 through day 9, flat until the fix on day 11.

---

### Post 8 — Narrative · Thu 09:15 UK

**Hook**
Someone asked me last week why we support TikTok Shop when it feels like a fashion thing.
Here is what the data says.

**Body**
In the Shopify operators I've surveyed, TikTok Shop is the single highest-growth channel for anyone selling consumer product under 40 dollars. Not clothing specifically. Not even gifting specifically. Any impulse-priced item with a visual story. Candles, pet accessories, kitchen gadgets, stationery, skincare, desk hardware — every one of these categories has at least one operator in my network doing 20k a month or more on TikTok Shop, usually inside the first 90 days of listing.

The friction is not the channel. The friction is the feed. TikTok Shop's category schema has different required attributes than Amazon, different image ratios, different compliance checks for any product touching beauty or wellness. The free first-party Shopify sync does not cover TikTok Shop. Most one-off TikTok Shop apps do not enforce feed quality. So operators list, get rejected, manually fix, list again, get rejected, give up.

We support TikTok Shop because it is the fastest-growing legitimate sales channel for our ICP and because the feed problem there is worse, not better, than on Amazon. "Fashion thing" is the story of 2022. The 2026 story is that TikTok Shop is where a Shopify founder doing 30k a month gets to 60k in a quarter, if the feed is clean.

10 founding-partner spots open at 40% off for life. palvento.com — or DM me.

**Hashtags**
#TikTokShop #Shopify #Ecommerce #Multichannel

**Visual brief**
A bar chart, five categories (candles, pet, kitchen, stationery, skincare), each showing "month 1" vs "month 3" GMV. Month 3 is meaningfully taller in every category.

---

### Post 9 — Tactical · Fri 10:00 UK

**Hook**
I audited one operator's last 60 days of feed rejections.
Four error types accounted for 81 percent of them.

**Body**
This was an operator running Shopify plus Amazon US, Amazon UK, eBay, and TikTok Shop. Roughly 1,600 SKUs, 220 orders a day, no dedicated ops hire. They gave me read access to Seller Central, eBay Seller Hub, and TikTok Shop for 60 days of history.

Out of 417 feed rejections across all four marketplaces, the top four causes were:

- **Missing or malformed GTIN** — 34 percent. Most from new variants where the UPC was entered into the Shopify "barcode" field but reformatted incorrectly for Amazon.
- **Image below minimum resolution** — 22 percent. Mostly TikTok Shop, where the required pixel floor is higher than Shopify's default thumbnail.
- **Category attribute missing** — 15 percent. Amazon variation theme mismatches and eBay item specifics that had gone stale after a schema update.
- **Banned or restricted words** — 10 percent. The worst offender was the word "free" in a TikTok Shop title, which triggered a policy check.

Nineteen remaining error types accounted for the other 19 percent. Four error classes, fixed at ingest, would have eliminated more than 300 rejections over two months. That is real revenue and real operator time.

When we talk about feed validation at Palvento, this is the list the validator is trained on. Not academic. Actual rejections from actual sellers.

If you recognise the shape — Shopify-led, three to five channels — DM me. 10 founding-partner spots open at palvento.com, 40% off for life.

**Hashtags**
#Ecommerce #Amazon #TikTokShop #Operations

**Visual brief**
A horizontal bar chart with four bars — GTIN, Images, Category, Banned words — sized 34, 22, 15, 10. Fifth bar labelled "19 other errors" at the bottom, thin.

---

## Week 4

### Post 10 — Tactical · Tue 08:30 UK

**Hook**
Per-channel pricing rules are the boring feature that pays for the platform.
Here is the math most operators miss.

**Body**
A Shopify operator I know sells a 48-dollar SKU across Shopify, Amazon, and eBay. Same price everywhere. Feels fair. Feels simple.

Shopify fee on a 48-dollar order: 1.39 plus 2.9 percent. Roughly 2.78. Net: 45.22.

Amazon fee on the same order: 15 percent referral, 3.60 FBA pick-and-pack if FBA. Roughly 10.80. Net: 37.20.

eBay fee on the same order: 12.9 percent plus 0.30. Roughly 6.49. Net: 41.51.

Three different landed nets for the same catalogue price. On a product with a 24-dollar cost-of-goods, Shopify contributes 21. Amazon contributes 13. eBay contributes 17. The Amazon SKU is making 38 percent less per unit than the Shopify SKU and nobody in the business knows, because the pricing rule is "same price everywhere".

The fix is to set a target net-margin per channel and let the pricing engine back out the list price that hits it. 48 on Shopify. 54.99 on Amazon. 51 on eBay. Same margin, different list. Amazon ads campaign ROAS targets now work because the contribution per unit is consistent.

This is unglamorous. It is also usually worth 1,800 to 4,500 a month on a mid-seven-figure run rate.

If you recognise the shape — Shopify-led, three to five channels — DM me. 10 founding-partner spots open at palvento.com, 40% off for life.

**Hashtags**
#Ecommerce #Pricing #Amazon #Shopify

**Visual brief**
A three-row comparison table: Channel · List Price · Fee · Net · Contribution. Row 1 Shopify highlighted green, row 2 Amazon red, row 3 eBay amber.

---

### Post 11 — Tactical · Thu 09:15 UK

**Hook**
I spent a morning with a Shopify operator reconciling one month of FBA payouts.
We found 1,340 dollars in fees they weren't tracking.

**Body**
Composite profile — mid-seven-figure US seller, roughly 40 percent of revenue on Amazon FBA, using A2X plus Xero for accounting, no channel-specific P&L tool.

We pulled one month of Amazon payout reports and lined them up against the P&L as it appeared in Xero. The macro numbers matched. The detail did not. Four line items were either understated or absent.

FBA removal fees — 340 over the month, from a seasonal clear-out nobody had costed.
FBA long-term storage fees — 210, from three SKUs sitting in FBA for 11+ months.
Aged inventory surcharges — 180, a fee most operators do not realise exists.
Returns processing fee — 610, because 23 units were returned and disposed, each carrying its own line.

Total: 1,340 in a single month, invisible. Annualised: 16k. On a business doing 1.8M, that is a full percentage point of margin going into a fee line that nobody in the company could name.

Tracking this is not difficult. It is tedious. Any feed platform worth its price ought to ingest the payout report at line-item grain and attribute every fee to the SKU it belongs to. If yours does not, you are leaving the ability to make a good reorder decision on the table.

If you recognise the shape — Shopify-led, three to five channels — DM me. 10 founding-partner spots open at palvento.com, 40% off for life.

**Hashtags**
#Amazon #FBA #Ecommerce #Margins

**Visual brief**
A receipt-style layout with four line items — Removal, Long-term storage, Aged, Returns — totalling 1,340 at the bottom, rubber-stamped "invisible" in red.

---

### Post 12 — Product · Fri 10:00 UK

**Hook**
The pre-flight validator is the first thing we built and the last thing I would cut.
Here is why.

**Body**
Before any listing goes to Amazon, eBay, TikTok Shop or Etsy, Palvento runs it through a per-channel validator. The validator checks exactly the things each marketplace will check — and the specific things that cause silent suppressions the operator will not see for days.

For Amazon: GTIN format, UPC check-digit, variation theme consistency, image pixel floor, category-required attributes, restricted words in title and bullets, brand name registration status.

For eBay: item-specifics completeness against the current category schema, condition-ID validity, image aspect ratio, shipping-service mapping.

For TikTok Shop: category-required attributes including specific beauty compliance checks, image ratio and floor, banned-word list, restricted-category flags.

For Etsy: tag length, material attribute completeness, shop section mapping.

The result is surfaced as a single pre-flight panel before any push. You see the error, the exact SKU, and the suggested fix. Every trialist who has shipped a bulk update has told me this alone is the reason they stayed past week one.

The simplest product pitch I've written: we stop you shipping bad data to the marketplace that was going to embarrass you anyway.

Live at palvento.com. 10 founding-partner spots open at 40% off for life.

**Hashtags**
#Shopify #Ecommerce #Feed #Product

**Visual brief**
A UI mockup of a "pre-flight check" panel. Four rows, each a channel, with a count of errors and a "fix" button. Top row Amazon has 3 errors, TikTok 1, eBay and Etsy clean.

---

## Week 5

### Post 13 — Product · Tue 08:30 UK

**Hook**
Palvento's category suggester started as a 90-minute experiment.
It is now the feature operators mention first on onboarding calls.

**Body**
Here is the problem. A Shopify store has one product taxonomy — usually collections, tags, and a vendor. Amazon has roughly 30,000 browse nodes. eBay has around 18,000 categories. TikTok Shop has about 8,000. Mapping one Shopify catalogue to three marketplace taxonomies, correctly, is a two-week job on a first launch and a permanent tax on every new product thereafter.

The category suggester runs the product title, description, attributes, and image through a model that returns the top three likely categories per channel, each with a confidence score and the reason. The operator confirms or overrides. The mapping is saved. Subsequent products from the same Shopify collection default to the confirmed mapping.

What surprised me in user research: the three-choice UI matters more than the accuracy. Operators do not want a single auto-chosen category, even when the model is right. They want the model to narrow 30,000 options to three, and to keep the decision theirs. The product learned a lesson here — confidence is not acceptance. Narrowing the question is the value.

It is one of the features I'm proudest of, and one of the smallest product surfaces we ship.

Live at palvento.com. 10 founding-partner spots open at 40% off for life.

**Hashtags**
#Shopify #Ecommerce #AI #Product

**Visual brief**
A UI screenshot-style mock showing a product row and three category suggestion cards side by side, each with a confidence bar and a small "why" caption.

---

### Post 14 — Narrative · Thu 09:15 UK

**Hook**
I fired a shipping customer in March.
It taught me more about the ICP than the 24 who stayed.

**Body**
They were doing roughly 9k a month, single channel, no plans to add a second for at least a year. They'd signed up because a friend had recommended us. They were a good person running a good business.

They were also not our customer.

Every support ticket took an hour because the questions were about Shopify, not about Palvento. Every feature request pushed us toward single-channel convenience, not multichannel quality. Every month I compared their usage to the 159-dollar price and felt ridiculous.

I wrote them an email. I said the honest thing — you are too early for us, we are too heavy for you, here are three alternatives that fit your shape better. I cancelled their subscription and refunded the month. They thanked me and left a positive review unprompted.

Two lessons. One — the hardest customers to fire are the nice ones who like you. Two — a wedge only works if you defend it against everyone outside it, including the ones who would pay you money to pull you off it. The 24 who stayed are Shopify operators running three to five channels. Every product decision since has been better because the 25th customer is no longer in the room.

10 founding-partner spots open at 40% off for life. palvento.com — or DM me.

**Hashtags**
#Founders #SaaS #Startups #Shopify

**Visual brief**
A photo of a laptop screen showing a single "Subscription cancelled" confirmation dialog. Cream background around it, shot slightly from above.

---

### Post 15 — Product · Fri 10:00 UK

**Hook**
eBay policy auto-provisioning is the most boring feature on the Palvento roadmap.
It is also the one operators in the UK cite as the reason they stayed.

**Body**
If you sell on eBay, you know this pain. Every single listing requires three policy IDs — payment, shipping, and returns. These policies live in eBay's Seller Hub, have to be created per marketplace (UK vs DE vs US), and their IDs change if the underlying policy is edited. Every bulk listing tool I have seen handles this as "please paste in your policy ID". Operators paste the wrong one. Listings fail. Operators lose an hour.

Palvento's integration reads your existing eBay business policies on connect, maps them per marketplace, and offers a single policy profile per channel per shop. When you edit a policy in eBay's Seller Hub, we re-read the ID. When a listing goes out, the correct ID is attached. You never see an ID again.

This is five days of engineering work for what sounds, on the roadmap, like a checkbox. It saves the average UK eBay seller roughly one full hour a week and — more importantly — one silent failure a month where a listing goes out with the wrong returns policy and the operator only finds out when a buyer opens a case.

Boring features are usually the ones that retain users. This is one of them.

Live at palvento.com. 10 founding-partner spots open at 40% off for life.

**Hashtags**
#eBay #Ecommerce #Shopify #Product

**Visual brief**
A UI mock showing three policy dropdowns (payment, shipping, returns) all set to "auto — matched to UK". A small green dot with text "re-read 2 minutes ago".

---

## Week 6

### Post 16 — Product · Tue 08:30 UK

**Hook**
Variant groups in Palvento look like a catalogue setting.
They are actually the hardest product decision I've made.

**Body**
Every marketplace treats variants differently. Amazon wants a parent-child ASIN with a named variation theme. eBay wants a multi-variation listing with specific aspect values. TikTok Shop wants SKUs grouped under a product with required images per variant. Shopify is its own flavour entirely.

The naive approach is to push each marketplace whatever it expects. The problem: when an operator edits the parent in Shopify, three channels need to re-sync the whole variant group, and if any single marketplace rejects one variant, you have to decide whether to block the group or let partial syncs through.

Palvento treats variant groups as a first-class entity, separate from individual SKUs. The operator edits a variant group. We push per-channel. We report back per-variant. Rejections are quarantined to the offending variant without blocking the parent. A suppressed colour on Amazon does not take down the size-chart on Etsy.

This sounds obvious written down. It is not obvious in the database schema. Almost every multichannel tool I have reverse-engineered gets this wrong in a subtle way — usually by treating each variant as a fully independent listing, which works until the moment you rename the parent product.

This was a hard week of decisions. It is also the feature that makes a three-variant pet bed listing, with 9 colour-size combinations, stay consistent across four channels without manual stitching.

Live at palvento.com. 10 founding-partner spots open at 40% off for life.

**Hashtags**
#Shopify #Ecommerce #Product #Engineering

**Visual brief**
A product-tree diagram. Parent node "Pet bed". Three variant branches for size. Each branching into three colours. Each of the 9 leaves shows four marketplace dots (Amazon, eBay, TikTok, Etsy), 8 green, 1 red.

---

### Post 17 — Product · Thu 09:15 UK

**Hook**
We publish prices in five currencies.
Nobody else at this tier of the market does.

**Body**
Palvento has three tiers: 59, 159, 499. You can toggle the page into USD, GBP, EUR, AUD or CAD. What you see is the price you pay. No conversion fees pushed to the invoice. No "contact us for local pricing". No quote form.

I thought this was a table-stakes decision when I made it. I was wrong. Every enterprise competitor hides their price behind a form. Every self-serve peer publishes in USD only. The entire middle band of the market — operators in London, Sydney, Toronto, Berlin, Milan — is asked to do currency math and accept foreign-exchange risk as a pre-condition of signing up.

We are a UK-registered company selling mostly in USD. There is no particular reason this should be easier for a London seller than a New York one. So we built the currency toggle into the pricing page, made it sticky across the site, and priced each currency to a clean number in that currency — 159 USD becomes 129 GBP, 149 EUR, 249 AUD, 219 CAD. Not a conversion. A price.

This took two days to build and has become a line item at every discovery call. "You're the first tool that actually tells me the GBP price". Small detail, high signal. Boring choices compound.

Live at palvento.com. 10 founding-partner spots open at 40% off for life.

**Hashtags**
#Pricing #SaaS #Shopify #Global

**Visual brief**
A pricing card mocked in five versions side by side — same layout, different currency labels. A small toggle at the top shows the currency chip.

---

### Post 18 — Tactical · Fri 10:00 UK

**Hook**
If you're running Shopify plus more than one marketplace, do this one exercise this week.
It takes an hour. It changes the business.

**Body**
Pull the last 90 days of orders from every channel into one spreadsheet. One row per order. Columns: channel, SKU, list price, fees total, shipping cost, COGS, net contribution.

You are going to hate every minute of building this. That's fine. It is the ledger question most operators duck.

When you are done, sort by net contribution per unit, descending. Three things will happen.

One. Your top-three SKUs on Amazon will not be your top-three SKUs on Shopify. The feeds are different. The audiences are different. Your catalogue is quietly running two businesses.

Two. At least one channel will have at least one SKU contributing negatively. Almost always it is a low-priced item with high fulfilment cost on a marketplace with heavier fees. You have been paying to ship it.

Three. Your hero SKU — the one you tell yourself is the business — will contribute less than you think, because ad spend and returns have not been allocated to it.

This exercise is the P&L the platform replaces. Running Palvento means you don't rebuild this spreadsheet every quarter. But do it once by hand, because what you learn is usually a pricing decision worth more than a year of subscription.

If you recognise the shape — Shopify-led, three to five channels — DM me. 10 founding-partner spots open at palvento.com, 40% off for life.

**Hashtags**
#Ecommerce #Margins #Shopify #Operations

**Visual brief**
A spreadsheet-style screenshot with six columns visible, one row highlighted green (top contribution), one highlighted red (negative). Hand-drawn circle around the negative row.

---

## Week 7

### Post 19 — POV · Tue 08:30 UK

**Hook**
Everyone is talking about AI-drafted listings.
The real feed bottleneck in 2026 is not the drafting. It is the validating.

**Body**
Every feed tool in the market has an AI listing drafter now. Palvento does too. So does every competitor within three clicks of a Google search. It is table stakes.

The problem is that a perfectly drafted listing still gets rejected. AI-drafted or human-drafted, the feed has to pass per-marketplace compliance — GTIN format, category attribute completeness, image specs, banned words, policy IDs, condition values, ship-from address validation. A listing can be beautifully written and still get suppressed for a 13-digit identifier missing a check digit.

So the differentiator in 2026 is not "we can write a title". Everyone can write a title. The differentiator is "we catch the 12 reasons the title won't work before it ships". That is validator work. It is harder than it sounds because the per-marketplace schemas change quarterly without notice, and every tool maintaining a validator is doing catalogue research every month to stay current.

If a feed product is only pitching AI drafting, they are pitching the easy half of the problem. Ask about the validator. Ask when the schemas were last updated. Ask which rejection patterns they catch at ingest. That is where the real engineering lives.

Following the 8-week build in public — palvento.com for the full thesis.

**Hashtags**
#AI #Ecommerce #Shopify #Commerce

**Visual brief**
A two-column comparison. Left: "AI drafting — easy". Right: "AI validating — hard". Bottom caption: "the one that matters is on the right".

---

### Post 20 — Narrative · Thu 09:15 UK

**Hook**
A month ago I almost shipped a feature that would have killed the positioning.
Saying no is the product decision I get wrong most often.

**Body**
The feature was a shipping-label integration. Our top ten trialists had asked for it — which in early-stage product is usually the signal that you should build it.

The problem was that shipping is not feed management. Shipping is a whole product — label pricing negotiation, carrier integrations, returns portal, manifesting, rate shopping. Zonos does it. ShipStation does it. Sendle does it. Every one of them has a team of forty on the problem and we had one engineer considering how to fit it in between the TikTok Shop compliance work.

If we had shipped a bad shipping feature, three things would have happened. One — we'd have owned support for a workflow we didn't actually control. Two — the wedge positioning would have slipped from "feed management" to "vague multichannel tool", the exact phrase the positioning doc explicitly bans. Three — every prospect evaluating us against Shipstation would have asked us to be ShipStation, which we would have lost.

I almost built it anyway. The thing that saved me was a 90-minute call with an operator who said "honestly I just want the feed to be clean, I will buy ShipStation separately". That one sentence killed the feature.

The hardest part of positioning is saying no to customers you like.

10 founding-partner spots open at 40% off for life. palvento.com — or DM me.

**Hashtags**
#Product #SaaS #Shopify #Founders

**Visual brief**
A photograph-style note pinned to a corkboard, reading "feature killed, March 2026". Handwritten.

---

### Post 21 — POV · Fri 10:00 UK

**Hook**
The Shopify App Store is our primary acquisition channel.
Here is the five-part playbook we're running to rank inside the top three by day 60.

**Body**
One. Listing copy. Tight headline, two-line value prop, three specific product screenshots with captions written for the App Store's own search algorithm. Function-first, keyword-clean. No brochure language.

Two. Onboarding video. A 75-second walkthrough that goes from install to a live Amazon listing, shot on a real test store. No music, no narrator. Operators watch it, see that the product is real, install in the same breath.

Three. Review velocity. Every founding partner gets a direct email 14 days after install asking for an honest review. No incentives, no scripts. The ask is "if this saved you time, say so publicly — if it didn't, reply to me." Review quality and velocity both matter to the ranking algorithm.

Four. Uninstall feedback loop. Every uninstall triggers a short email — one question, no funnel. Uninstalls tell us more about product-market fit than installs do.

Five. Weekly iteration. The listing ships updates every week for the first 90 days — new screenshots, updated copy, fresh changelog entries. Shopify's ranking is recency-weighted. Nothing gets to stay static.

This is not a growth hack. It is the basic, unglamorous work of taking the App Store seriously as the top-of-funnel for Shopify-led operators. The target is top three for "multichannel feed management" and "Shopify multichannel sync" by day 60. Every other acquisition channel is a supplement to this one.

Following the 8-week build in public — palvento.com for the full thesis.

**Hashtags**
#Shopify #AppStore #SaaS #Commerce

**Visual brief**
A five-box checklist diagram, each box labelled: "Listing · Video · Reviews · Uninstall loop · Weekly iteration". Each box has a one-line metric underneath. Cobalt banner at the top reading "Top 3 by day 60." Cream background.

---

## Week 8

### Post 22 — POV · Tue 08:30 UK

**Hook**
TikTok Shop's policy updates in Q1 2026 broke half the feed integrations in the market.
This is why the validator matters.

**Body**
In February TikTok Shop tightened the category schema for Beauty and Personal Care — new mandatory fields for ingredient lists, new image-ratio rules for product-first vs lifestyle shots, and a rebuilt banned-word list for claims around skincare.

If you were a seller in that category and your feed tool had not updated its validator, you woke up to silent rejections. Your existing listings remained live, but any edit or new product got suppressed. Support queues at two of the major multichannel apps hit three-day response times. One app's team apparently did not know the schema had changed for six weeks.

TikTok Shop will do this again. So will Amazon. So will eBay. Marketplace schemas are not a one-time integration. They are a quarterly maintenance burden. The validator inside the feed tool has to be updated by someone whose job is to read policy notes and translate them into schema code.

At Palvento, category-schema monitoring is on a named engineer's calendar every week. Not because it is glamorous. Because if the validator drifts, the product is broken in a way the user will not discover until they list a new product and are silently rejected.

When you are evaluating a feed tool, the question to ask is not "does it support TikTok Shop". The question is "who updates the TikTok Shop schema when it changes, and how quickly".

Following the 8-week build in public — palvento.com for the full thesis.

**Hashtags**
#TikTokShop #Ecommerce #Shopify #Compliance

**Visual brief**
A calendar grid showing "schema change" markers sprinkled across Q1 2026. A single bold box around February labelled "TTS Beauty v3".

---

### Post 23 — Narrative · Thu 09:15 UK

**Hook**
We ship v1 publicly in 11 days.
Here is what made the cut, what did not, and what I am still nervous about.

**Body**
In the cut. Eight channels. Pre-flight validator for Amazon, eBay, TikTok Shop, Etsy. Category suggester. Per-channel pricing floors. Variant groups. Five-currency pricing. eBay policy auto-provisioning. Per-channel P&L with line-item fee attribution. Shopify App Store install.

Not in the cut. Shipping-label integration. Automated repricing. A mobile app. Native Amazon PPC management. A public API beyond the read-only reporting endpoints. These are fair follow-up asks. None of them fit the wedge sentence.

Still nervous. Support capacity. A good Shopify App Store launch attracts 150 to 300 installs in week one, and roughly 40 percent of them will ask a question within 72 hours. I have one founder, two contract engineers, a support doc, and a fast Intercom. If we ship above 200 installs and a single bug creeps into week one, we will feel it.

What I'm most proud of. The pricing page in five currencies. The validator catching missing GTINs at ingest. The onboarding flow that gets a Shopify install to a live Amazon sync inside twelve minutes measured on 38 test runs. Every one of those was a small decision that compounded.

If you are reading this and you fit the shape — Shopify-led, three to five channels, somewhere between "the free first-party sync is not enough" and "the enterprise tier just quoted me 2,500 a month" — reply or DM. You are exactly the operator we built this for.

**Hashtags**
#Launch #Shopify #BuildInPublic #SaaS

**Visual brief**
A handwritten-style launch checklist on cream paper. Four boxes ticked. One box left open labelled "you".

---

### Post 24 — POV · Fri 10:00 UK

**Hook**
The Google Sheet is the product Palvento replaces.
Not a competitor. The incumbent.

**Body**
Roughly 60 percent of Shopify operators running three-plus channels are managing their feed in a spreadsheet. The spreadsheet is free, flexible, and scales exactly as far as the operator is willing to spend a Sunday morning on it. It works until it doesn't.

It breaks at the point we described in post two — 200 orders a day, four channels, one missed GTIN. After that, three things happen every quarter. A listing gets suppressed for a missing attribute and nobody notices for nine days. The pivot table stops matching the payout report. The operator realises they can't answer "which channel was profitable last month" without rebuilding the sheet.

Palvento beats the spreadsheet on three axes.

One. Setup. A Shopify App Store install to a live marketplace listing in under ten minutes. No tab-building. No formula debugging. No pasting CSV exports every Monday morning.

Two. Rejections. Every listing passes a per-channel pre-flight check before it ships — GTIN format, image resolution, banned words, category attributes. The spreadsheet cannot do this. The marketplace surfaces the rejection after the damage is done. Palvento catches it at ingest.

Three. Margin. Per-channel P&L with line-item fee attribution — FBA removal fees, eBay insertion costs, TikTok Shop commission — all reconciled into the contribution margin per SKU per channel. The spreadsheet can approximate this with three tabs and a weekend. Palvento surfaces it as one screen.

Every feature on the roadmap is tested against the spreadsheet. If it does not beat the spreadsheet clearly, it is not ready.

We ship in 7 days. If you are still running the spreadsheet and you are tired of it — reply, DM, or install. See you on the other side.

**Hashtags**
#Shopify #Ecommerce #Launch #Multichannel

**Visual brief**
A split-screen image. Left: a chaotic Google Sheet with red cells and one highlighted "GTIN missing". Right: a clean Palvento panel showing the same SKU flagged with a green "fix suggested: enter 13-digit UPC". Cobalt arrow between them.

---

## Summary sheet

| Week | Tue | Thu | Fri |
|---|---|---|---|
| 1 | Narrative — thesis | Tactical — spreadsheet breaks | Narrative — declined round |
| 2 | Narrative — pricing v3 | Tactical — 5 mistakes | POV — enterprise-tier hole |
| 3 | Tactical — GTIN cost | Narrative — TikTok thesis | Tactical — 417 rejections |
| 4 | Tactical — per-channel pricing | Tactical — FBA fees | Product — validator |
| 5 | Product — category suggester | Narrative — fired a customer | Product — eBay policies |
| 6 | Product — variant groups | Product — 5 currencies | Tactical — one-hour P&L |
| 7 | POV — AI drafting vs validating | Narrative — killed feature | POV — App Store |
| 8 | POV — TikTok schema | Narrative — launch status | POV — spreadsheet is the competitor |
