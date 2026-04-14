# Cold Email Sequence — Growing Operator (Tier 2)

> Target: multichannel operators running Shopify + eBay + Amazon, $50k–$500k/mo GMV, 1–5 person team. Sequence length: 5 touches across 28 days. Single sender, single inbox thread. Replies route to founder inbox.

Merge variables used throughout:
`{{firstName}}`, `{{shopify_store}}`, `{{primary_marketplace}}`, `{{monthly_gmv_band}}`, `{{competitor_inferred}}`

---

## Touch 1 — Day 0

**Subject:** `quick one about {{shopify_store}} + {{primary_marketplace}}`
**Preview:** `the question most dashboards can't answer`

Hi {{firstName}},

Saw {{shopify_store}} is also listing on {{primary_marketplace}}. If your GMV is in the {{monthly_gmv_band}} band, there's one question that tends to eat an afternoon every month: which SKU, on which channel, at which price, is actually profitable after fees and FX.

We built Meridia because spreadsheets stop being honest around 200 orders a day. One ledger, live inventory across every channel, and a multi-currency P&L that settles against payout currency — not invoice rate. First real number on screen inside ten minutes of connecting Shopify and {{primary_marketplace}}.

Would a 20-minute walkthrough against your real data be useful this week or next?

— <FOUNDER_NAME>
Meridia — the operating system for modern commerce

---

### Touch 1 — A/B Variant (same hook, different opener)

**Subject:** `quick one about {{shopify_store}} + {{primary_marketplace}}`
**Preview:** `the question most dashboards can't answer`

Hi {{firstName}},

A pattern I keep seeing in {{monthly_gmv_band}} stores on Shopify + {{primary_marketplace}}: the dashboard says the business is up, but the quarterly P&L lands 4–6 points lower than expected. Fees, FX, inbound freight, refunds — each small, each invisible until the accountant files.

Meridia is one ledger across every channel and currency, with a settled P&L that shows real per-order margin the same day the payout lands. Ten minutes to connect, no implementation team.

Worth 20 minutes against your real data this week or next?

— <FOUNDER_NAME>
Meridia — the operating system for modern commerce

---

## Touch 2 — Day 4

**Subject:** `re: quick one about {{shopify_store}}`
**Preview:** `one customer's number, in case it's useful`

Hi {{firstName}},

Following up gently. One data point in case it helps calibrate: an operator we onboarded last quarter — similar shape to {{shopify_store}}, Shopify + Amazon + eBay, {{monthly_gmv_band}} — cut their oversell rate from 1.8% to 0.2% in the first six weeks. At their volume that recovered roughly $15k/quarter of refund and reship cost.

No miracle — just live inventory sync across the three channels, and a pricing floor per channel so nothing ships at a loss during an Amazon promo.

Happy to show you the same view on your own data. Does Thursday or Friday work?

— <FOUNDER_NAME>

---

## Touch 3 — Day 9

**Subject:** `still copy-pasting {{primary_marketplace}} orders?`
**Preview:** `if yes, you're not alone — 20 mins?`

Hi {{firstName}},

Permission-based bump — tell me to go away if the timing is wrong.

The specific friction I'm guessing at: someone on your team is exporting {{primary_marketplace}} orders into a sheet once a day, reconciling against Shopify stock, and flagging mismatches by hand. It's the last ops task people automate because the existing tools — {{competitor_inferred}} in particular — want a 6-week implementation to do it.

Meridia does it in ten minutes of OAuth. If that's the shape of the problem, a short call would be worth your time.

Reply with a yes and I'll send two slots.

— <FOUNDER_NAME>

---

## Touch 4 — Day 17

**Subject:** `the multi-currency P&L thing most ops dashboards get wrong`
**Preview:** `short read, no pitch`

Hi {{firstName}},

Not a sales note. Wrote this piece last month and it keeps coming up in conversations with operators in the {{monthly_gmv_band}} range selling into the US from the UK, or vice versa:

https://auxio-lkqv.vercel.app/blog/multi-currency-pnl-explained

The short version: if your dashboard normalises FX at invoice rate rather than settlement rate, it's lying by 2–4 points of margin on every cross-border order. That's the difference between a profitable SKU and a loss-leader, and it compounds quietly.

If it's useful, forward it on. If you want the same view on your own data, reply and I'll set up an account.

— <FOUNDER_NAME>

---

## Touch 5 — Day 28

**Subject:** `closing the loop, {{firstName}}`
**Preview:** `last note, promise`

Hi {{firstName}},

I've written four times, which is the threshold where it stops being useful to write a fifth.

Closing this thread. If a Commerce Operations Platform is ever on your list — replacing {{competitor_inferred}}, or graduating off spreadsheets — the door is open and the trial is self-serve at auxio-lkqv.vercel.app. No demo gate.

Wishing {{shopify_store}} a strong quarter either way.

— <FOUNDER_NAME>

---

## Do not send if

- The account sells on only one channel (Shopify-only, Amazon-only). Our wedge is multichannel.
- Monthly GMV is under $20k. Shopify + a spreadsheet is still the right answer for them.
- The operator is pure B2B wholesale with no marketplace exposure.
- The account is on Shopify Plus with a dedicated NetSuite instance — different sales motion, longer cycle, belongs to a separate Tier 3 track.
- It is Black Friday week, Cyber Monday week, or the 10 days before Christmas. Their inbox is hostile and the send will burn the domain.
- The contact has replied "not interested" on any previous Meridia outbound thread in the last 12 months.
- The contact is in the EU and has not passed a GDPR legitimate-interest test (must be a business email, must list company, must be decision-making seniority).

## Deliverability notes

- Send from a warmed secondary domain (e.g. `getfulcra.com`), not the primary `auxio-lkqv.vercel.app` root. Primary domain stays clean for transactional mail.
- SPF, DKIM, and DMARC records must resolve green before first send. Verify with `mxtoolbox` and Google Postmaster.
- Ramp slowly: 20 sends/day for week 1, 40/day week 2, 60/day week 3, cap at 80/day per mailbox. Spread across two mailboxes before exceeding 80 total.
- Keep HTML out of the body. Plain text only, one inline link maximum per touch (Touch 4 is the only link in the whole sequence).
- No tracking pixels. Link tracking via a branded redirect domain only — third-party tracking domains (bit.ly, HubSpot click tracking) will hurt placement.
- Monitor reply rate, not open rate. A touch-1 reply rate under 2% means the list is wrong, not the copy.
- Pause the whole sequence automatically on reply, out-of-office, or hard bounce. No exceptions.

## Target-list sources

- Shopify App Store public reviews — filter for apps relevant to multichannel (Codisto, SellBrite, Linnworks app, Amazon sales channel). The reviewer's store URL is usually visible.
- Seller Central community forums (Amazon) — operators who post about repricing, inventory sync, or FBA-to-FBM transitions.
- eBay seller groups on Facebook (private, joined manually) — specifically UK-based cross-border sellers.
- Ecommerce Fuel forum (paid, gated) — high-intent Tier 2. Do not cold-email the forum; engage first, email later.
- Twitter/X ecommerce community — @PrestonHolland6, @Ecomcrew, @mattyonem reply guys often reveal their store.
- LinkedIn Sales Navigator — filter: "founder" OR "head of ecommerce" OR "operations manager", company size 1–20, industry retail, with Shopify + Amazon signals from tech-graph tools (BuiltWith, Wappalyzer).
- Retail Global, eTail, and White Label Expo attendee lists (public agendas + LinkedIn enrichment, never scraped registration data).
- Podcast guest lists from *Ecommerce Fuel*, *2x eCommerce*, *My First Million* commerce episodes — public, pre-qualified.
