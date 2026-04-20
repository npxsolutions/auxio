# Product Marketing Context

*Last updated: 2026-04-20*
*Source docs: `docs/marketing/positioning.md`, `docs/marketing/icp.md`, `docs/marketing/channel-mix.md`, `docs/marketing/index.md`. This doc is the distilled context every marketing skill reads. Full detail lives in the source docs — do not duplicate; update there.*

---

## Product Overview
**One-liner:** Self-serve multichannel feed management for Shopify-led sellers.
**What it does:** Palvento lets a Shopify merchant sync clean product feeds to Amazon, eBay, TikTok Shop, Etsy, Walmart, and more — with feed rules, error catching before marketplace rejection, and honest per-channel P&L in one product. From $149/mo, no sales call.
**Product category:** Self-serve multichannel feed management. *Not* "commerce OS", "commerce operations platform", "multichannel ERP", or "listing tool" — these overclaim or undersell.
**Product type:** B2B SaaS, Shopify App Store distribution primary.
**Business model & pricing:** Flat monthly subscription, published in USD / GBP / EUR / AUD / CAD.
- $149/mo — 1 channel
- $349/mo — 5 channels
- $799/mo — unlimited channels
- Enterprise from $2,000/mo (Tier 3 — SSO, SLA, data residency, multi-region, 10+ channels)

**Current live state (as of 2026-04-20):** Only **Shopify source → eBay + Google Shopping** are actually working. Amazon is blocked (seller account deactivation → SP-API registration impossible). `/channels` shows the other destinations badged "coming soon." Positioning copy still lists Amazon/TikTok/Walmart/Etsy aspirationally — this tension is flagged and needs resolving in public-facing copy.

---

## Target Audience
**Three tiers, bracketed by Shopify GMV. Tier 2 is the wedge.**

### Tier 1 — Shopify-led Starter (volume acquisition)
Shopify + 1–2 channels · $10k–$100k/mo GMV · solo operator. WTP $49–$79/mo. Pure self-serve via Shopify App Store. Won't fill a form. Acquisition: App Store, r/shopify, Indie Hackers.

### Tier 2 — Shopify-led Growth Operator (**the wedge**)
Shopify + 3–5 channels · $100k–$500k/mo GMV · small ops team. WTP $149–$799/mo, cheerful at $349 if it replaces Marketplace Connect + one-off apps + feed spreadsheets. Acquisition: App Store + `/vs/*` SEO + agency partnerships.

### Tier 3 — Shopify-led Scale Operator (enterprise upsell)
Shopify Plus multi-region · $500k+/mo GMV · 10+ person team. WTP $2k–$10k+/mo, annual prepay. Run by COO / Head of Ecom, not founder. Acquisition: outbound, partner referral, `/enterprise` form.

**Primary use case:** Expand from Shopify onto 2–5 marketplaces without losing margin to feed rejections, listing suppressions, and spreadsheet-driven reconciliation.

**Jobs to be done:**
1. Add a new channel on a Tuesday and have clean listings live by Wednesday — no 40-day onboarding.
2. Catch feed errors (missing GTINs, oversize images, banned words, category mismatches) at ingest — not after the marketplace takes the listing down.
3. Know which channel is actually profitable after fees, without rebuilding a spreadsheet.

---

## Personas (B2B)

| Persona | Cares about | Challenge | Value we promise |
|---|---|---|---|
| **Founder-operator (Tier 1)** | Speed, price, documentation quality | Shopify Marketplace Connect caps at 50 orders/mo and doesn't cover TikTok / Etsy properly | Working install in 10 min, $149/mo, every channel that matters |
| **Growth-operator founder (Tier 2 — primary)** | Channel breadth + feed quality + margin visibility | Feed quality varies per channel, listings get suppressed, no single view of per-channel P&L | One product closes the loop: feed rules + error hub + per-channel P&L at $349/mo |
| **COO / Head of Ecom (Tier 3 champion)** | Process, named contact, procurement fit | Feedonomics doesn't scale economically; internal security review requires SSO / SOC 2 / data residency | Enterprise tier with named CSM, security posture, multi-region feeds, 10+ channel support |
| **CFO (Tier 3 financial buyer)** | Predictable cost vs % of GMV | Rithum/Feedonomics quotes scale with revenue in ways that feel punitive | Flat fee, annual prepay, exit-survivable data export |
| **Developer / IT gatekeeper (Tier 3 technical influencer)** | API quality, webhooks, security questionnaire answers | Needs to rule out lock-in and API instability | Published API, two-way sync sub-minute, data exportable |

---

## Problems & Pain Points
**Core problem:** The multichannel tool market is barbelled. On the cheap end, Shopify Marketplace Connect is free–$99/mo but only covers Amazon/eBay/Walmart and doesn't do real feed optimisation. On the expensive end, Feedonomics / Rithum / Linnworks / Brightpearl are quote-only, $2,500–$10k+/mo, with 30–90 day onboarding. A Shopify founder doing $250k/yr has nothing in the middle.

**Why alternatives fall short:**
- Enterprise tools (Feedonomics, Rithum, Brightpearl) require demos, solutions architects, retainers. Wrong shape for self-serve.
- Shopify Marketplace Connect (Codisto) covers too few channels and lacks feed rules / error handling.
- One-off per-channel apps create a spreadsheet mess and no P&L view.
- Sellbrite (GoDaddy) is the closest self-serve peer but under-invested; channel breadth and rule engine are thin.
- Veeqo is Amazon-owned — many Shopify merchants won't run multichannel ops inside their biggest marketplace competitor.

**What it costs them:**
- **Money.** Amazon orders ship at a loss because repricers don't know landed cost. Feedonomics quote is $30k/yr before a demo.
- **Time.** Every new channel is a 2-week research project. Reconciling payouts across 5 marketplaces in Sheets is a weekly half-day.
- **Opportunity.** Listings get suppressed for GTIN / banned-word issues the merchant discovers only when a category manager complains. Lost days of revenue per incident.

**Emotional tension:** The founder knows channel expansion is the growth lever but feels priced out (Feedonomics), locked in (Linnworks), or under-served (Marketplace Connect). Frustration compounds into risk aversion → they delay adding the next channel → revenue plateaus.

---

## Competitive Landscape

**Internal positioning language — do NOT surface competitor names in public LinkedIn / ad / blog copy per founder rule (see `feedback_no_rival_names.md`). `/vs/*` SEO pages are the exception.**

**Direct — same solution, same problem:**
- **Feedonomics** (primary named competitor) — enterprise-only, $2,500+/mo floor, quote-form, 30–90 day onboarding. No self-serve, no interest in $25k/mo merchants.
- **Rithum** (ex-ChannelAdvisor / CommerceHub) — quote-only, historic % of GMV pricing. Built for retailers with dedicated channel-ops teams.
- **Shopify Marketplace Connect (Codisto)** — free to 50 orders, 1% capped at $99/mo. Amazon/eBay/Walmart only. No TikTok / Etsy / OnBuy, thin feed optimisation.
- **Baselinker** — strong in EU, weak US/UK. Cheap, but weak on feed optimisation and Shopify-native workflows.
- **Sellbrite** (GoDaddy) — $19–$129/mo, closest peer on shape + price. Under-invested since acquisition.
- **Veeqo** (Amazon-owned) — cheap, but Amazon's tool.
- **Linnworks** — ~$549/mo entry, 40-day implementation. Inventory-first, feed is secondary.

**Secondary — different solution, same problem:**
- **A2X** — solves P&L but not feeds.
- **Repricers** (Repricer Express, BQool, Seller Snap) — solve price floors but not feed rules or error handling.

**Indirect — conflicting approach:**
- **Brightpearl (Sage)** — ERP with channel bolt-on. $2k+/mo, 60–90 day implementation. Wrong shape entirely.
- **Shopify + manual CSV / Google Sheets** — the true incumbent for Tier 1. Free, infinitely flexible until you need to enforce per-channel rules or catch rejections.

---

## Differentiation

**Five things Palvento has that alternatives — specifically Feedonomics — do not:**

1. **Self-serve signup from a Shopify App Store install.** First channel live, first feed syndicated, first error surfaced inside 10 minutes, no sales call.
2. **Published pricing in five currencies.** $149 / $349 / $799 / Enterprise from $2,000, USD / GBP / EUR / AUD / CAD. Nobody in the quote-only tier does this.
3. **Feed optimisation and P&L in one product.** Feedonomics does feeds. A2X does P&L. Palvento closes that loop.
4. **Shopify-native install and sync.** OAuth via App Store, two-way sync, sub-minute latency, no middleware.
5. **Channel breadth at this price band.** Amazon, eBay, TikTok Shop, Etsy, Walmart, OnBuy, BigCommerce, WooCommerce targeted. *(Live today: eBay + Google Shopping only. Others coming.)*

**Why customers choose us:** They want the feed to be clean, every channel that matters to be live, and a flat price published on the site — without a 40-day implementation or a solutions architect.

---

## Objections

| Objection | Response |
|---|---|
| *"Shopify Marketplace Connect is free / $99 — why pay you $149?"* | SMC only covers Amazon/eBay/Walmart and does sync, not feed optimisation. One suppressed listing on Amazon costs more than a year of Palvento. The step up is real feed rules + error catching + TikTok/Etsy/OnBuy. |
| *"We already got quoted by Feedonomics / Rithum."* | The quote is probably $2,500+/mo with a managed-services retainer and 30–90 day onboarding. Palvento gives you self-serve in 10 minutes at $349/mo. When you cross $500k/mo GMV, the Enterprise tier picks you up — no migration. |
| *"We're on a spreadsheet + one-off apps and it works fine."* | Until a feed rejection or a suppressed listing. Also — can you answer which channel was profitable last month in under 5 minutes? If not, the tool has already paid for itself in founder hours. |
| *"What if you go under?"* | Feed data is exportable. No trap. That's why customers stay. |
| *"Why not Sellbrite / Baselinker / Veeqo?"* | Sellbrite is under-invested since the GoDaddy acquisition. Baselinker is EU-first and the UI is translated rather than designed. Veeqo is owned by Amazon — the rest of your channels don't love that. |

**Anti-persona (do NOT sell to):**
- Pure DTC single-channel Shopify under $10k/mo — Shopify + CSV is fine.
- Big-box retailers with EDI-first supplier relationships — we don't do EDI well yet.
- Non-Shopify-led sellers (BigCommerce-native, WooCommerce-native, Magento) — we support them but the App Store motion is primary.
- Pure B2B wholesale with no marketplace exposure.
- Agencies white-labelling.

---

## Switching Dynamics (JTBD Four Forces)

**Push** (away from current): Marketplace Connect channel-coverage wall hit; Feedonomics quote that priced them out; a suppressed Amazon listing that cost real revenue; spreadsheet reconciliation eating hours.

**Pull** (toward Palvento): Self-serve install from the App Store they already live in; published price on the site (no demo); specific proof that feed rejections get caught at ingest; one P&L view across channels.

**Habit** (keeps them stuck): Free is hard to argue with — SMC at $0–$99 is the strongest incumbent for Tier 1. Spreadsheets feel "under control" even when they aren't. Fear of breaking existing Shopify → Amazon sync during migration.

**Anxiety** (worry about switching): "Will my Amazon orders break during the switch?" "Is this another tool that will be acquired and die (like Sellbrite)?" "Do I lose my feed history?" Answer each with: zero-downtime migration path, data export guarantee, published roadmap.

---

## Customer Language

**How they describe the problem** (verbatim — [TBD: pull from 5 real customer convos]):
- *"I maxed out Marketplace Connect and I need to add TikTok Shop but there's no obvious next step."*
- *"I've been quoted by Feedonomics and it's way out of range for us."*
- *"I can't tell you if Amazon is profitable this quarter without rebuilding the sheet."*

**How they describe us** (verbatim — [TBD: post-customer-1]):
- *[Awaiting first customer. Cold start.]*

**Words to use:** feed, channel, listing, marketplace, per-channel P&L, feed rejection, error hub, rules, SKU, GMV, published pricing, Shopify-native, self-serve, in under ten minutes.

**Words to avoid:** "commerce OS", "operating system for commerce", "multichannel ERP", "listing tool", "repricer", "unified commerce platform", "AI-powered" (as standalone claim). These either overclaim or mis-categorise us. Also avoid naming competitors in public LinkedIn / ad / blog copy (`/vs/*` SEO pages are the exception).

**Glossary:**
| Term | Meaning |
|---|---|
| Feed | The product catalogue Palvento syndicates from Shopify out to each marketplace, formatted per channel. |
| Error hub | Ingest-time validation surface. Catches GTIN / image / banned-word / category errors before the feed reaches the marketplace. |
| Per-channel P&L | Revenue minus fees minus postage minus landed cost, per marketplace, per SKU. |
| Wedge | Tier 2: Shopify-led Growth Operator at $100k–$500k/mo GMV with 3–5 channels. |
| Shopify-led | The operator's primary store is Shopify; marketplaces are additive, not replacement. |

---

## Brand Voice

**Tone:** Direct, practical, opinionated. No hype. Closer to *Ecommerce Fuel* / 37signals / Stripe changelog than to Gartner marketing or SaaS landing-page boilerplate.

**Style:** Plain English. Specific numbers ($149, 10 minutes, 50 orders/mo, 40-day onboarding). Concrete nouns (feed, GTIN, rejection). First-person plural when we own a claim, second-person when describing the reader's job.

**Personality (5 adjectives):** Direct. Practical. Opinionated. Founder-voice. Shopify-native.

**Name origin (use where tone-appropriate):** *Palvento* is an Italian architectural term — the wind-shelter wall in Mediterranean farmhouses. "We shelter your commerce from multichannel chaos." Use sparingly; doesn't belong on every page.

---

## Proof Points

**Metrics:** [TBD — zero paying customers as of 2026-04-20. Pre-PMF.]
**Customers:** [TBD]
**Testimonials:** [TBD — awaiting first design partner]
**Value themes:**
| Theme | Proof (current) | Proof (needed) |
|---|---|---|
| Setup speed | Shopify OAuth + App Store install path shipped | Loom of a real merchant going from install to first listing in under 10 min |
| Feed quality | Error hub shipped, validation rules in place | Worked example: 3 real rejections caught at ingest with before/after |
| P&L visibility | Per-channel P&L view live | Screenshot of a real channel P&L over 30 days |
| Price transparency | Pricing page live in 5 currencies | — |
| Exit-survivable | Feed export implemented | — |

---

## Goals

**Primary business goal:** Build a system worth a $1B USD exit (per `project_mission_statement.md`). Near-term: land the first 10 Tier 2 paying customers and get one cornerstone `/vs/*` page ranking.

**Key conversion action:**
- Tier 1 → Shopify App Store install → trial → auto-convert at day 14
- Tier 2 → `/vs/*` page or cold outbound → trial + sales-assisted onboarding call within 7 days
- Tier 3 → `/enterprise` quote form → demo → POC → annual contract

**Current metrics (2026-04-20):**
- Paying customers: 0
- Live destination integrations: 2 (eBay, Google Shopping)
- LinkedIn connections: near-zero (cold outbound blocked until ~30 real connections added)
- Content calendar: Week 1 starts Tue 2026-04-22
- Cornerstone posts live: 4 of 4 existing + 4 new planned

---

## Open gaps to fill (for next pass)

1. **Verbatim customer language** — no real customer convos yet. Re-run this doc after first 5 design partners.
2. **Proof points** — need one end-to-end demo video of a merchant install.
3. **Live-channel/positioning tension** — public copy still implies Amazon / TikTok / Walmart / Etsy are live; actually only eBay + Google Shopping are. Decide whether to narrow the pitch to match reality or keep the aspirational list with "coming soon" badges.
4. **Marketing Post #1 + 23 follow-ups** — need rival-name sweep on posts 2–24.
