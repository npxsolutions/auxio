# Twitter / X Thread Bank — 8 Ready-to-Post Threads

> Tone rules: editorial, no emoji, no exclamation marks, no "10x", no "supercharge". Specific numbers, operator vocabulary. Hook tweet is the job — if it doesn't land, the thread doesn't get read. Each tweet capped at 280 characters.

---

## Thread 1 — Marcus: 8% to 22% margin in 60 days

**Hook:**
> An operator I worked with ran five marketplaces out of Birmingham at 8% contribution margin. Sixty days later he was at 22% on the same product catalogue.
>
> He didn't raise prices. He didn't cut staff. Here is what actually changed.

**Body:**

> 2/ The business: £180k/month GMV across Shopify, Amazon UK, Amazon DE, eBay, and Etsy. Three people. Linnworks plus four spreadsheets plus a weekly Sunday-night reconcile session. Standard Tier 2 shape.

> 3/ January P&L landed at 8% contribution. He had budgeted 14%. Six points of margin disappeared somewhere between the dashboard and the bank account, and nobody could point to the cell where it lived.

> 4/ First change, week 1: pricing floors per channel. Turned out his Tuesday Amazon promo dropped price below his Etsy listing. Etsy buyers were arbitraging his own stock. Floor engine killed the leak inside four days.

> 5/ Second change, week 2: settled FX on Amazon DE. He thought his top SKU cleared 14% margin there. Real payout rate said 6%. He lifted the EUR price by €2.50, still under competing listings. Volume held, margin snapped to 13%.

> 6/ Third change, week 3: stranded stock. Two SKUs in his Sheffield warehouse hadn't moved in 11 weeks because the Amazon DE listing feed had silently 404'd. The sync caught it. £4,200 of stock moved in a fortnight.

> 7/ Fourth change, weeks 4–6: inventory buffers per channel, set from actual lead times instead of guesses. Oversell rate went from 1.6% to 0.2%. At his volume that is roughly £3,400 a quarter of refund and reship cost recovered.

> 8/ None of these were heroic. They were all numbers that were already true in his data — the platform just made them visible in the same place on the same day. The 14-point margin swing was the compound of four small fixes.

> 9/ The reason this doesn't happen on spreadsheets is not that operators are lazy. It is that the reconcile delay makes the numbers stale by the time you look at them. Stale numbers don't drive decisions.

> 10/ Playing this back: if you run multichannel and your dashboard says one number while your P&L says another, the gap is almost always in four places — fees, FX, pricing floors, stranded stock. Fix those four before you touch anything else.

**Close:**
> 11/ If you want to see the same view on your own data, Fulcra's public trial is at auxio-lkqv.vercel.app. Ten minutes to connect Shopify and one marketplace. No demo gate.

---

## Thread 2 — 5 mistakes multichannel operators make

**Hook:**
> I've looked at the ops data of about forty multichannel ecommerce businesses in the last six months.
>
> Five mistakes show up in almost all of them, and four of them have nothing to do with the products you sell.

**Body:**

> 2/ Mistake one: using a blended fee percentage in your margin model. Amazon FBA fees are not 15%. They are 8% on one SKU and 31% on another. If you average, you cannot see which SKU is paying rent for the others.

> 3/ Mistake two: booking FX at invoice date. Your Stripe or Amazon payout settles 7–14 days later at a different rate. On cross-border volume that gap runs 1.4% to 3.8%. It is real money and it compounds quarterly.

> 4/ Mistake three: a single global stock number. You need buffers per channel, not one shared pool. Amazon FBA and Shopify DTC have different lead times and different oversell costs. Treating them as one pool is why weekends hurt.

> 5/ Mistake four: not knowing your per-order fulfilment cost by channel. Pick-pack, postage, insert costs, returns handling — these vary by 40–60p per order between channels. At 5,000 orders a month that is two to three thousand pounds a month of untracked cost.

> 6/ Mistake five: optimising ad spend against revenue instead of contribution margin. A 4x ROAS on an 8% margin SKU loses money. Most ad platforms cannot see the margin column because the margin column isn't on the same system as the ad data.

> 7/ The through-line on all five: they are visibility problems, not strategy problems. The operator already knows what to do if they can see the right number. The reason they can't see it is that the data lives in seven places.

> 8/ Fixing four of these in the same tool is the entire argument for a Commerce Operations Platform. Fixing one of them at a time in four separate tools is the argument against SaaS sprawl.

**Close:**
> 9/ Essay version of this with the diagrams and numbers sits here: auxio-lkqv.vercel.app/blog/the-true-cost-of-multichannel-spreadsheets

---

## Thread 3 — Behind the scenes: building the multi-currency P&L

**Hook:**
> We built Fulcra's multi-currency settled P&L three times before it was right.
>
> The first two versions shipped wrong numbers to real customers. Here is what we learned, and the technical choices that stuck.

**Body:**

> 2/ Version one: convert every order at the invoice-date rate from the marketplace API. Fast to ship, matches what accounting tools do, and wrong — because the money you actually receive is the payout rate, not the invoice rate.

> 3/ A customer called us the week of launch. His Amazon DE margin on screen said 14%. His bank said 6%. That eight-point gap was our whole value prop running in reverse. We paused the module for a month and rewrote it.

> 4/ Version two: pull the payout-date rate from the payment processor and retroactively rewrite order rows. This produces correct settled margin, but the UI flickers when old rows change. Customers thought the data was unreliable.

> 5/ The lesson: correctness and stability have to land together. A number that is right today and different tomorrow feels worse than a number that is consistently slightly wrong. You need versioned rows.

> 6/ Version three, the one that shipped: every order stores both an indicative (invoice-date) margin and a settled margin, with a clear label and a timestamp. The settled number replaces the indicative when payout lands. Nothing flickers.

> 7/ Schema-wise we store three things per order line — gross in source currency, gross in settlement currency at payout rate, and a reconciliation delta. The delta is the interesting column. It is what makes the "your dashboard is lying" pitch concrete.

> 8/ Design-wise the P&L table shows the indicative in a lighter weight and the settled in full weight. When a payout lands, the row shifts from one state to the other with no animation. Shifts are audit-logged.

> 9/ The part we didn't expect: customers started filtering by "indicative vs settled delta desc" to find the SKUs where FX was eating them alive. That view wasn't in the spec. It became the most-used filter in the module.

> 10/ Takeaway: the correct data model rewrites itself after the first real customer. The UI decisions fall out of the data model, not the other way round. If the schema is honest, the product tends to be too.

**Close:**
> 11/ The full view lives under /finance in any Fulcra tenant. Trial is at auxio-lkqv.vercel.app — bring your real payout data, it is the only way to see whether the number has been lying to you.

---

## Thread 4 — Why dashboards lie if FX isn't normalised at sale time

**Hook:**
> If you sell across currencies and your dashboard uses the mid-market rate at order time to convert your revenue, your dashboard is lying to you.
>
> Not maliciously. By convention. Here is the exact mechanic, and what to do about it.

**Body:**

> 2/ The convention most ecommerce tools inherit from accounting: convert every foreign-currency sale to your base currency at the mid-market rate on the day the sale happened. Clean, simple, and wrong for operations.

> 3/ It's wrong because the money you actually receive is not the mid-market rate. It is the marketplace or processor payout rate, which is 1–3% lower and lands 2–14 days later. That delta is pure margin loss and it does not appear on the sales dashboard.

> 4/ Example. You sell a £20 SKU on amazon.com for $26. Mid-market says that is £20.50. The payout lands 11 days later at £19.40 after Amazon's FX spread. The dashboard said £20.50 of revenue. Your bank says £19.40. Five-point gap, invisible.

> 5/ Compound that over 5,000 cross-border orders a quarter at a 4% contribution margin, and you have erased roughly a quarter of your contribution before anyone has made a decision. The operator reads a dashboard that flatters reality.

> 6/ The fix is settlement-date FX. You wait for the payout, read the actual rate, and rewrite the margin row with the real number. Accounting hates this because it moves old rows. Operations loves it because it is finally the truth.

> 7/ Practically: you need two numbers per order, not one. An indicative margin at order time (useful for daily pacing) and a settled margin at payout time (useful for quarterly strategy). Most tools give you only the first, and call it done.

> 8/ The tell that your current dashboard is doing this wrong: your monthly revenue number looks good, and the quarterly P&L your accountant hands back looks bad, and nobody can point to the line item where the gap lives.

> 9/ If that is you, the gap almost always lives in settlement-date FX, marketplace fee drift, and refund timing — in that order. FX is usually the biggest.

**Close:**
> 10/ Full essay with a worked example and the schema we use: auxio-lkqv.vercel.app/blog/multi-currency-pnl-explained

---

## Thread 5 — Why we don't take a percentage of revenue

**Hook:**
> Fulcra's biggest competitors price as a percentage of GMV. Two to four percent of every pound you sell.
>
> We refuse. Here is why that pricing model is user-hostile, and what we charge instead.

**Body:**

> 2/ ChannelAdvisor, Rithum, and parts of the feed-management stack price on a percentage of revenue. At 2%, a business doing £5m a year pays £100k to the platform. At 4% they pay £200k. The cheque grows with the operator's success.

> 3/ The argument for it is that the platform's value grows with the customer's revenue. This is lazy thinking. The platform's cost does not grow with the customer's revenue — servers and support cost the same whether a SKU sells for £10 or £40.

> 4/ The argument against it is that the pricing model is misaligned in the exact moment the operator is scaling. A Tier 2 operator doing £300k a month pays £6k–£12k a month in platform fees on 3–7 point margins. That is a meaningful chunk of their take-home.

> 5/ It also disincentivises the platform from helping you optimise margin. If the platform is paid on revenue, it is silently rooting for you to keep running low-margin SKUs. The incentive shape is wrong.

> 6/ Fulcra charges on order volume. Predictable, flat, disclosed on the pricing page. An operator doing £100k a month at £40 AOV pays the same as one doing £100k at £15 AOV — because the platform work is per-order, not per-pound.

> 7/ This is a deliberate design choice and it costs us revenue on the high-AOV deals. We have lost deals to ChannelAdvisor on price. We are fine with that. Winning on price is not the brand we are building.

> 8/ If you are evaluating commerce ops platforms right now, run the maths on your own numbers. Put the percentage-of-GMV quote and the flat-volume quote side by side at your current revenue, and at your 24-month plan revenue. The gap widens fast.

**Close:**
> 9/ Our pricing page is public and does not require a form: auxio-lkqv.vercel.app/pricing

---

## Thread 6 — The ops stack in 2031

**Hook:**
> Predicting the commerce ops stack in 2031 is a useful exercise because most of the tools we use today were designed for a 2018 shape of problem.
>
> Five things I think will look very different, and one thing that won't change at all.

**Body:**

> 2/ One: the ten-tool stack will be a three-tool stack. Commerce operations platform, ad-buying platform, storefront. Everything currently sold as a "sync" or "feed" or "reconcile" is connective tissue and connective tissue consolidates into platforms.

> 3/ Two: settled-data-first will be the default. Every serious dashboard will show the real payout number, not the invoice number, and the gap between them will be a first-class audit column. Indicative-only pricing of margin will look like smoking on aeroplanes.

> 4/ Three: the API will be table stakes, not a premium SKU. The operator's BI stack, their 3PL, their accountant's month-end process will all pull from the ops platform over REST and webhooks. Platforms that gate the API behind a higher tier will lose the developer vote.

> 5/ Four: AI agents will do the boring 70% of ops — listing generation, pricing-floor updates against competitor moves, restock suggestions from forecast plus lead time. The interesting 30% — strategy, brand, SKU rationalisation — stays human.

> 6/ Five: multi-currency settlement will be solved at the platform layer. Stripe and Airwallex and their peers will route payouts at a known cost and the ops platform will read that cost as a first-class field. The "which rate is the real rate" argument will end.

> 7/ The thing that will not change: the number of operators who run a five-marketplace business from a laptop at a kitchen table will keep going up. The top end of ecommerce is not the interesting story. The long tail of £1m to £20m businesses is.

> 8/ The tooling shape that wins the long tail will look different from enterprise. Self-serve, priced on order volume, honest defaults, real API, no sales call. That is the bet Fulcra is making and it is why we are priced the way we are.

> 9/ If any of this is wrong, the market will tell us within three years. I would rather be specifically wrong on the record than vaguely right in private.

**Close:**
> 10/ Longer written version with citations for the stack-consolidation argument: auxio-lkqv.vercel.app/blog/what-is-a-commerce-operations-platform

---

## Thread 7 — Net margin per SKU per channel

**Hook:**
> There is one metric in multichannel ecommerce that decides whether the business is actually profitable, and almost no operator computes it.
>
> Net margin per SKU per channel. Here is why it is hard, and what it looks like when you have it.

**Body:**

> 2/ Net margin per SKU per channel means: for SKU X, sold on channel Y, at price Z — what is the contribution after fees, FX, fulfilment, returns, and a fair allocation of ad spend. A single number, per row, updated daily.

> 3/ Most operators compute a blended margin. They look at total revenue, subtract total costs, and call the ratio margin. This is useful for board decks and useless for decisions. A 12% blended margin hides SKUs at 31% and SKUs at -4%.

> 4/ The reason nobody computes the per-SKU-per-channel version is that the data lives in five systems. The marketplace has the fee. The 3PL has the pick-pack. The accounting tool has the FX. The ad platform has the spend. Nothing joins them at SKU granularity.

> 5/ When you do join them, three things happen inside a week. One: 10–15% of your SKU catalogue turns out to be losing money on at least one channel and nobody knew. Two: your ad spend redistributes materially, because the real hero SKUs are not the ones you thought.

> 6/ Three: you stop running certain promotions. The Tuesday-discount pattern that "worked" is now visible as a 3-point net loss after ad attribution and fee drag. It gets killed not by a strategy session but by the number sitting on a dashboard in front of the ops lead.

> 7/ This is not exotic. It is bookkeeping at a finer granularity than most ecom businesses are set up to do. The hard part is not the maths — it is getting the five data sources into one schema with SKU and channel as stable keys. That is the whole job.

> 8/ Fulcra does this as a default view. Every SKU row has an expand-per-channel breakout with fees, FX, fulfilment, returns, and attributed ad spend pulled through the platform's integrations. No spreadsheet step.

> 9/ If you want to compute this yourself first on your own data, the template is: gross - marketplace fees - payment fees - FX delta - fulfilment - returns reserve - attributed ad spend = net. Attributed ad spend is the hard column; start with last-click, upgrade later.

**Close:**
> 10/ The Fulcra view of this is at /finance/skus in any trial tenant. auxio-lkqv.vercel.app. Ten minutes to first number.

---

## Thread 8 — Honest take on AI in commerce ops

**Hook:**
> I have spent the last year watching operators try to put ChatGPT against their ops data.
>
> Some of it works. Some of it is hype. Here is my honest running list of which is which.

**Body:**

> 2/ Works, confidently: demand forecasting with seasonal and promo awareness. A small model trained on a year of your own orders, promos, and weather outperforms the default Amazon forecast for 60–70% of SKUs. Low risk, high payback.

> 3/ Works, with supervision: listing and description generation. LLMs produce first drafts 4x faster than a human. They also drift into plausible-but-wrong claims on materials and dimensions. Keep a human in the review loop, especially on regulated categories.

> 4/ Works, narrowly: anomaly detection on order and payout streams. A classifier that flags "this payout is 3.8% lower than your rolling average" is straightforwardly useful. No creativity required, just pattern matching.

> 5/ Hype, currently: autonomous repricing without guardrails. An LLM cannot reliably reason about floor prices, minimum margin, and competitor signals in the same loop. Rule-based repricers with a tight LLM-assisted competitor-read layer win. Fully agentic repricing is not ready.

> 6/ Hype, currently: "ask your data" chat interfaces that let an operator query their ops warehouse in natural language. They demo well and fail on the second or third question because they hallucinate join logic. Keep them behind read-only, audited SQL.

> 7/ Hype, currently: AI-generated ad creative for commerce. Image models ship fast output but violate marketplace image rules (white backgrounds, no text overlays) with enough frequency that a human has to QA every asset. Net time saved is modest.

> 8/ The pattern across the "works" list: narrow, supervised, derived from the operator's own data. The pattern across the "hype" list: wide, autonomous, asked to reason across multiple systems without a grounding layer.

> 9/ The useful shorthand: AI in ops is a power tool, not an autopilot. Treat it like a junior analyst who is fast, confident, and occasionally wrong. Build the review surfaces before you deploy the automation.

> 10/ Fulcra ships grounded AI features on the works list — forecasting, anomaly flags, listing drafts — and deliberately does not ship autonomous repricing. That is a product choice, not a technical one.

**Close:**
> 11/ If your team is building an internal "ask your data" tool and wants to compare notes on what holds up in production, my DMs are open. Still learning in public on this.
