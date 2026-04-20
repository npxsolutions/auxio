# AI in the Palvento workflow — research + roadmap

*Drafted 2026-04-20. Research prompt: "how can AI assist the user workflow?" Author: founder + Claude-assisted.*

This memo maps the multichannel operator's weekly workflow, identifies where AI earns its keep in each stage, inventories what Palvento has shipped vs what's missing, and ranks the next five builds by ROI.

## 1. The operator's workflow — five stages

Every Shopify-led seller running 3–5 channels moves through the same loop each week:

| Stage | What it is | Where friction lives |
|---|---|---|
| **Prepare** | Turn a raw Shopify product into listings that fit each marketplace's schema (title, description, category, attributes, images) | Per-channel rewriting, category mapping across 18,000+ eBay / 30,000+ Amazon nodes, attribute completion |
| **Validate** | Check the listing will pass marketplace ingest before submit | GTIN format, image pixel floor, banned words, category-required fields, policy IDs |
| **Sync** | Push listings + pull orders, two-way, every channel | Schema drift, rejection handling, variant-group edge cases |
| **Monitor** | Catch rejections, suppressions, and schema changes | Alert fatigue vs missed incidents; quarterly marketplace policy updates |
| **Reconcile** | Close the loop — which channel was profitable? which SKU cost you? | Line-item fee attribution, payout reconciliation, margin drift detection |

AI is high-leverage in **Prepare, Validate, and Monitor**. Rule-based logic is the right tool for **Sync**. Reconcile is partially AI (narrative summaries on top of deterministic math).

## 2. What Palvento has today

Based on a scan of `app/api/enrichment/`, `app/api/chat/`, `app/lib/feed/category-suggester.ts`, `app/api/listings/[id]/autofix/`, and `app/api/social-intel/`:

| Surface | Status | Notes |
|---|---|---|
| **Enrichment API** (Claude-powered per-channel content) | ✅ Shipped | Generates title, description, bullets, attributes, search terms, category, GTIN hint, tags. Per-channel prompts (Amazon/eBay/Etsy/Shopify/TikTok). Quotas: Starter 10/mo, Growth 200/mo, Scale unlimited. |
| **Category suggester** | ✅ Shipped (eBay only) | 3-layer: exact map → fuzzy match → AI fallback. Cached. Amazon + TikTok + Etsy categories NOT yet covered. |
| **Image analysis / alt text / hero suggestion** | ✅ Shipped | Separate endpoint, per-plan quotas on image analyses. |
| **Aspects enrichment** (Amazon attribute completion) | ✅ Shipped | `app/lib/feed/aspects.ts`. |
| **Per-listing autofix** | ✅ Shipped | `app/api/listings/[id]/autofix/` — single-listing error remediation. |
| **AI chat agent** | ✅ Shipped | `app/api/chat/route.ts` — Claude Sonnet 4 answers with the seller's actual orders, products, PPC keywords, insights. |
| **Social intelligence** | ✅ Shipped (likely WIP) | `app/api/social-intel/` — query + process endpoints. |
| **Bulk enrichment** | ✅ Shipped | 10 at a time on Growth tier. |

The product already has a real AI surface. The gap is not "add AI" — it's "integrate AI deeper into the five workflow stages."

## 3. Competitive landscape

- **Sellbrite, Codisto, Linnworks** — **zero AI** in marketing, light AI in product. Template-based automation only. This is an unclaimed positioning wedge.
- **Feedonomics** — AI-assisted taxonomy + attribute enrichment, but gated behind a managed-services retainer (i.e. their human team uses AI tools internally; the merchant doesn't).
- **Pacvue** (retail media, adjacent category) — comprehensive AI suite: an agent with governed action, plain-English SQL for analytics, Slack integration, report generation. Far ahead of anyone in the feed-management category. Worth studying as a model for conversational-ops UX, even though it's a different product.

Takeaway: **the feed-management category has no serious AI-first competitor.** Palvento can own "AI for Shopify multichannel" if it ships meaningfully better than internal tooling.

## 4. High-value AI features for the Palvento workflow

Prioritised by leverage-to-build ratio. Each maps to a specific workflow stage.

### P0 — Ship next (highest leverage)

1. **Category suggester — expand to Amazon, Etsy, TikTok Shop, Walmart.** (`app/lib/feed/category-suggester.ts` is eBay-only today.) This is the feature Post 13 says operators mention first on onboarding calls. Each new channel unlocks the same UX win. Seed each channel's taxonomy, re-use the 3-layer strategy, cache results.

2. **Per-rejection diagnosis & rewrite.** When the pre-flight validator catches a banned word, oversized image, or category-attribute gap, AI should propose the specific fix (not a generic "rewrite your title"). Input: listing + error + marketplace rule. Output: exact new field value. Surface inside the error hub with one-click accept.

3. **Natural-language P&L queries.** Extend the chat agent (`app/api/chat/route.ts`) from general-purpose Q&A to structured queries like *"Which SKU on Amazon UK had the worst margin last month?"* The agent already has `transactions` in context; it needs a tighter system prompt + examples of the question shapes and guaranteed-correct arithmetic (hand the model pre-computed aggregates rather than raw rows).

### P1 — Follow

4. **Schema-drift monitor.** When TikTok Shop / Amazon change category schemas (they do quarterly), an AI pass over the diff should flag which of your customers' live listings will break, and propose the migration. Pacvue does a version of this for retail-media. No one in feed management does.

5. **Hero-image re-crop + background compliance.** Amazon's image policy is strict (pure white background, product fills 85% of frame, no badges). AI can detect violations and either fix them (background removal, re-crop) or surface them before submit. Higher trust + lower support volume.

### P2 — Further out

6. **Competitor-listing differentiation.** Given your listing + the top 3 competing listings on the same ASIN, suggest 3 specific title/bullet changes that differentiate. Reads as AI marketing assistance. High perceived value; moderate build cost (need public listing scrape).

7. **Governed action.** Borrow from Pacvue. AI proposes a batch of changes (rewrites, repricing, policy swaps); operator reviews as a single approvable diff; execute or reject. Reframes AI from "generates outputs" to "drives outcomes with a safety net."

8. **Slack / email digest.** Weekly summary in plain language: *"Your Amazon UK listings had 14 new rejections this week — all GTIN format. TikTok Shop schema changed Monday; 3 listings need updates."* Low-build, high-retention.

## 5. Pricing & quotas — does the current tier math still work?

Current quotas (from `app/api/enrichment/route.ts`):
- Starter: 10 enrichments/mo
- Growth: 200 enrichments/mo
- Scale: unlimited
- Enterprise: unlimited

If we add the P0 features (multi-channel category suggester, per-rejection fix, NL queries), each adds incremental token usage per operator. Rough sketch:

- A Growth-tier operator (3–5 channels, 500 SKUs, 220 orders/day) will burn ~600–1,000 AI calls/mo across enrichment + category + autofix + chat combined.
- 200/mo cap is too tight once the surface expands. Suggest raising Growth to **500 enrichments/mo** and separately counting chat messages (target: 200/mo free on Growth, soft-cap then slow down).
- Or: move to a **credit bundle** model — 1 credit = 1 enrichment = 1 chat message = 1 autofix. Simpler to market, easier to expand without breaking tier math.

Decision not urgent, but cost tracking should be wired before the new features ship.

## 6. Positioning angle

Sellbrite, Codisto, Linnworks have no AI story. Feedonomics' AI is gated behind a managed-services retainer. Palvento can own the position *"AI that works for a Shopify operator on a Tuesday afternoon — not for a channel-ops team on a three-month contract."*

Anchor copy (consider for Post 19 — currently about "AI drafting vs validating"):
- *"We don't pitch AI drafting as the differentiator. Everyone has that. The differentiator is AI validating — the 12 reasons your listing will be suppressed before it ships. That's what we catch."*

This positioning already lines up with the post content. It's not invention — it's sharpening what the product literally does.

## 7. Five next-build asks

1. **Extend category suggester** to Amazon, Etsy, TikTok Shop, Walmart (add seeds + tests). Est. 3 days.
2. **Per-rejection AI diagnosis** in the error hub (new `app/api/listings/[id]/fix-error` route). Est. 2 days.
3. **Structured P&L agent** — refactor `app/api/chat/route.ts` to hand Claude pre-computed aggregates (channel totals, per-SKU margins, top/bottom performers) and constrain answers. Est. 2 days.
4. **Usage tracking + quota UX** — surface remaining enrichments per plan in the dashboard, warn at 80%, suggest upgrade at 100%. Est. 1 day.
5. **Credit-model migration** — decide by Day 60. Not before real usage data lands.

Total P0 scope: ~8 engineering days. Shippable in one sprint. Meaningfully improves the product before the first 10 founding partners land.
