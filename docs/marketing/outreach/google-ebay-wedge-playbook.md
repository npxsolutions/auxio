# The Google-Shopping → eBay Wedge Playbook

> The first 20 customers. Truthful pitch, narrow ICP, executable today. Replaces nothing — complements `cold-email-sequence.md` which is the Tier 2 sequence once we ship P&L and more channels.

---

## The wedge in one sentence

**Shopify merchants who are already running Google Shopping ads but are not on eBay (or vice versa), $100k–$500k/mo GMV, solo or small-team ops.** They have proven intent on marketplace expansion and are currently using whatever Shopify connector came free. We land them on the second channel in 10 minutes.

## Why this wedge and not the broader Tier 2

- Every claim is verifiable today. Shopify import works, eBay push works, Google Shopping push works. No P&L module, no FX settlement layer, no Amazon. We pitch what we ship.
- The qualifier is **publicly observable**: you can search Google Shopping for their brand in one tab and eBay for their brand in another. No data enrichment vendor required.
- The ROI case is concrete: adding a second channel typically adds **5–15% incremental GMV** inside 60 days. At $100k–$500k/mo GMV that pays for $149/mo in the first week.
- Our two shipped destinations (eBay + Google Shopping) happen to be the two most common "first marketplace" choices for Shopify-led sellers — we're not asking them to reshape their strategy, just executing the expansion they were already planning.

## Disqualifiers — don't send if any apply

- Running on a Shopify connector already priced $349/mo+ (likely Codisto, Linnworks, Rithum). They'll bounce because they think they've solved it.
- Selling exclusively on Shopify with no marketplace intent on their public site/social — they're DTC-only, not our ICP.
- Already on eBay AND Google Shopping. Different pitch (feed quality), different playbook — later.
- Shopify Plus + multi-region. Tier 3 Enterprise. Different cycle, different deck.
- Amazon seller in a restricted category (firearms, supplements, alcohol). Our Amazon integration doesn't exist, and the approval cycle is the blocker for them anyway.

---

## The 20-prospect list — how to build it in 90 minutes

**Inputs you need:** a browser, a Google account, a blank Google Sheet.

### Step 1 — seed 60 candidates (45 min)

Search Google Shopping for 20 product categories Palvento validates well for. Use queries the actual Tier 2 ICP buys into:

```
site:shopify.com                         # filters to Shopify-hosted stores
intext:"Shopify"                         # catches custom domains
"powered by Shopify"                     # ditto, footer fingerprint
```

Combine with vertical terms: `candle`, `yoga mat`, `running shoe`, `coffee beans`, `ceramic mug`, `leather wallet`, `skincare serum`, `dog collar`. These map to the categories already in `seed-google-product-categories.ts` so the Palvento demo will actually resolve real categories.

For each result, open the Shopping ad → click through to the product page → confirm it's a real Shopify store with a full catalog, not a dropshipping landing page. Record the domain.

### Step 2 — qualify to 20 (30 min)

For each candidate, in two browser tabs:

1. `ebay.com` → search the brand name. If they have >10 active listings, **drop them** (already on eBay; different pitch later).
2. Their site → footer → find the founder name, usually in an `/about`, a contact form, or a Twitter link. If no founder name is visible within 90s, drop them (can't personalize).

Target 20 survivors. Expect ~1 in 3 to pass — that's why you seed 60.

### Step 3 — enrich (15 min)

For each survivor, grab into the sheet:

| column                    | source                           | why                                              |
|---------------------------|----------------------------------|--------------------------------------------------|
| `domain`                  | obvious                          |                                                  |
| `founder_first_name`      | site footer / LinkedIn           | `{{firstName}}` merge variable                   |
| `founder_email`           | site contact / `hunter.io` free  | sending address                                  |
| `category`                | their homepage                   | picks the right demo SKU in the pitch            |
| `example_sku`             | the product running Shopping ads | concrete reference in the opener                 |
| `currency_observed`       | product page                     | GBP vs USD reframes the pitch                    |
| `on_google_shopping`      | `yes` (filter condition)         |                                                  |
| `on_ebay`                 | `no` (filter condition)          |                                                  |
| `rough_catalog_size`      | collection page count × 12       | determines $149 vs $349 pitch                    |
| `touch_1_sent_at`         | you fill in at send              |                                                  |
| `reply_status`            | `none` / `reply` / `oof` / `bounce` | only field that matters for the next 28 days |

No CRM yet. A Google Sheet with these 11 columns beats a Hubspot seat until you have 100+ prospects.

---

## The opener — two variants, pick per prospect signal

### Variant A — broad, scalable, honest

**Subject:** `eBay for {{shopify_store}} — 10 min via your Shopify catalog`
**Preview:** `noticed you're on Google Shopping but not eBay`

Hi {{firstName}},

Quick one. I noticed {{shopify_store}} is running Google Shopping ads on {{example_sku}} but the same SKU isn't on eBay. For Shopify stores in the {{currency_observed}}{{monthly_gmv_band}} range, adding eBay as a second channel typically picks up 5–15% incremental GMV inside 60 days — the eBay buyer isn't a Google Shopping buyer, so it's net-new demand, not cannibalization.

We built Palvento because the Shopify App Store connectors for eBay are brittle and Feedonomics charges $2k+/mo for the same thing. Ten minutes of OAuth, your Shopify catalog lands on eBay with the GTINs, categories, and images mapped, and you share one inventory pool so nothing oversells. $149/mo, self-serve trial, no implementation call.

Worth 15 minutes against your real catalog this week?

— Naveen
palvento.com · Shopify → eBay + Google Shopping in one tool

### Variant B — high-signal, targeted, requires you to actually run the scan

**Subject:** `{{shopify_store}} — {{n}} Google Shopping feed errors`
**Preview:** `they're silently suppressing SKUs from ads`

Hi {{firstName}},

Not a sales note. I ran {{shopify_store}}'s product feed through our validator earlier today. {{n}} of {{total}} SKUs have errors that Google Shopping silently uses to suppress products from ads — the common culprits are missing GTINs, titles over the 150-character cap, and `availability` set to values Google rejects.

Full per-SKU report is attached. Worth an afternoon for someone on your team whether or not you end up looking at our tool — the errors fix themselves in Shopify once you know where they are.

If the tool itself is interesting, we ship Shopify → eBay + Google Shopping at $149/mo, self-serve.

— Naveen
palvento.com

**When to use B:** only when you've actually run their catalog through `/api/listings/{id}/validate` for Google and have real numbers. Don't fabricate. One burned sender reputation costs 3 months of outbound.

---

## Reply handling — five common objections, one-sentence answers each

| objection                                                          | reply                                                                                                                                                                   |
|--------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| "We already use Shopify's free Marketplace Connect."               | Marketplace Connect caps at 50 marketplace orders/mo and doesn't support Google Shopping or eBay's category-specific aspects — worth 10 min to see the real feed quality difference. |
| "We're planning to add eBay later this quarter."                   | We can run the eBay connection as a dry-run (catalog mapped, products in draft) so when you're ready you're flipping a switch, not starting a project. Happy to do that now? |
| "How does this compare to Feedonomics?"                            | We're ~10% of the price because we're self-serve — no onboarding fee, no dedicated CSM. If you need managed onboarding you're actually our Tier 3 customer, happy to refer you to someone who does that. |
| "What about Amazon?"                                               | Amazon is on the roadmap, not shipping today. We lead with Shopify → eBay + Google Shopping because that's what ships; we'll tell you the day Amazon is live.          |
| "Is the Google Shopping connection GDPR / data-resident?"          | Data flows Shopify → Palvento (Frankfurt region) → Google Merchant Center. No US transit. Full DPA available on request. (Only true if you're on EU Supabase — verify before sending.) |

---

## Send cadence — 20 sends/day, max

- Day 0: send Touch 1 (Variant A or B). 20 prospects.
- Day 4: Touch 2 from the existing sequence at `cold-email-sequence.md` — but rewrite the "$15k/quarter oversell" anecdote to something truthful (or skip Touch 2 entirely until you have one real customer data point).
- Day 9, 17, 28: Touches 3–5 from the existing sequence. Touch 4's blog link is broken — remove it or replace with a link to `/vs/feedonomics` which we have shipped.

Cap sends at 20/day per mailbox for the first two weeks; ramp to 40/day after that. Don't send Fri–Sun. Don't send on Black Friday week (Nov 21–28), Cyber week, or Dec 20–Jan 3.

---

## Success signal for the first cohort

**Reply rate ≥ 4%** on Touch 1 = good list + good copy. Under 2% means disqualifiers are too loose or the opener is wrong.
**Meeting booked rate ≥ 20%** of replies = the pitch lands. Under 10% means the opener is misrepresenting the product.
**Trial → paid conversion ≥ 25%** of trials = the product delivers on the pitch. Under 10% means either the trial is broken or we oversold in the email.

First cohort goal: **3 paying customers out of 20 first-touches** inside 21 days. If we hit that, the wedge is real; scale the list to 100 next.
