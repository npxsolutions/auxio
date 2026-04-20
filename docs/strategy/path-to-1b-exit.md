# Path to a $1B+ exit — what Thoma Bravo actually buys, and how Palvento gets there

*Drafted 2026-04-20. Research prompt: "Thoma Bravo bought Dayforce for $1.5B — let's copy their infrastructure so they buy us at that price." Author: founder + Claude-assisted.*

Two facts to correct before the strategy, because the premise is off by an order of magnitude:

## 1. The Dayforce deal was $12.3 billion, not $1.5 billion

| Metric | Dayforce at acquisition (Aug 2025) |
|---|---|
| Deal price | **$12.3B** |
| 2024 revenue | $1.76B |
| Revenue multiple | ~7× |
| Employees | 9,600 |
| Market | Human Capital Management (payroll, HR, benefits) |
| Structure | Public → private take-private |

Source: Wikipedia + Thoma Bravo press. Thoma Bravo's most recent $1.5B-ish deals were **NextGen Healthcare ($1.8B, 2023)** and **Everbridge ($1.8B, 2024)** — the *floor* of their recent buying. Not Dayforce.

## 2. Thoma Bravo does not buy startups

Their 2020–2025 acquisitions, by deal size:

| Company | Deal | Year | Company stage at sale |
|---|---|---|---|
| Instructure | undisclosed | 2020 | Public, ~$250M ARR |
| Stamps.com | $6.6B | 2021 | Public, ~$600M revenue |
| Medallia | $6.4B | 2021 | Public, ~$500M ARR |
| Anaplan | $10.4B | 2022 | Public, ~$600M ARR |
| Coupa | $6.15B | 2022 | Public, ~$870M ARR |
| NextGen Healthcare | $1.8B | 2023 | Public, ~$620M revenue |
| Everbridge | $1.8B | 2024 | Public, ~$450M revenue |
| Dayforce | $12.3B | 2025 | Public, ~$1.76B revenue |

**Pattern:**
- Always public or late-stage private
- Always $200M+ revenue at acquisition
- Always category leader (top 1–3 in their vertical)
- Always recurring-revenue model with documented retention
- Always existing enterprise customer base

Thoma Bravo's stated thesis is "mature, cash-generative software businesses ripe for AI-driven transformation." They apply operational playbooks to de-risked assets. **They never buy pre-revenue companies.** Pre-revenue → growth equity (Bessemer, Insight, ICONIQ, Accel) or strategic acquirer (Shopify, Amazon, BigCommerce).

## 3. "Copy their infrastructure" is the wrong mental model

Infrastructure doesn't drive PE valuation. Business fundamentals do. The only reason Thoma Bravo paid 7× revenue for Dayforce wasn't because Dayforce had "good infrastructure" — it was because Dayforce had **$1.76B of recurring revenue, growing ~15% annually, with 90%+ gross retention, serving 9,600 enterprises.** If Dayforce had identical infrastructure and $50M ARR, the deal wouldn't have happened.

Infrastructure *enables* the business metrics (multi-tenant, auditable, SOC 2, exportable) but doesn't cause the valuation. Copying the architecture of a 9,600-person company while running a 1-founder company is over-engineering — it burns the runway the business actually needs to generate the ARR.

## 4. What actually drives a $1B+ SaaS exit (the real checklist)

Based on the Thoma Bravo / Vista / Francisco Partners pattern across 30+ recent SaaS take-privates:

| Metric | Bar for $1B+ exit | Palvento today (2026-04-20) |
|---|---|---|
| ARR | $100M+ minimum, $150–300M typical | $0 |
| Revenue multiple | 5–10× for mature SaaS (Dayforce: 7×) | N/A |
| Growth rate | 15–30% YoY (PE wants efficient growth, not hypergrowth) | N/A |
| Net revenue retention | 110%+ preferred, 120%+ premium | N/A |
| Gross margin | 70%+ | Not yet measured |
| Rule of 40 (growth + EBITDA margin) | 40+ | N/A |
| Customer concentration | No customer > 10% of revenue | N/A |
| Recurring share of revenue | 90%+ | Intended 100% (flat monthly) ✓ |
| Category position | Top 3, ideally #1 | Wedge locked, not yet proven ✓ |
| Audited financials | 3+ years of clean audits | 0 years |
| Security posture | SOC 2 Type II, ideally ISO 27001 | Planned (per `/security`) |

## 5. What Palvento should take from the Thoma Bravo playbook *now*

There is a real playbook — it just isn't "architecture." It's the business DNA that keeps a company buyable at $1B when it reaches ARR scale in 7–10 years. The work starts now because retrofitting it at $50M ARR is expensive; baking it in at $0 is free.

**Architectural / operational decisions to make now:**

1. **Clean SaaS ARR only.** No percentage-of-GMV, no per-order fees above plan. ✓ Already done — this is the single biggest lever. Rithum's legacy % of GMV contracts are the reason they don't trade at Dayforce multiples.
2. **Multi-currency billing + revenue recognition.** ✓ Done — 5 currencies. Critical for any enterprise rollout.
3. **Enterprise path from day 1.** ✓ `/enterprise` quote form + SSO/SAML/data residency as an upsell. Buyers value an upmarket motion even at small scale.
4. **Data exportability.** Every SKU, mapping, rule exports to CSV at any time. ✓ Documented on `/vs/feedonomics`. PE buyers check this during diligence — lock-in tactics lower the multiple.
5. **Audit trail in the database.** Every read / write / config change logged with actor, IP, request ID. On the SOC 2 path. Mentioned in `/enterprise`.
6. **Named SOC 2 roadmap.** Start the Type 1 audit at $1M ARR, Type 2 at $3M ARR. Two years earlier is a mistake; two years later is a deal-breaker for enterprise upsell.
7. **Metrics infrastructure from month 1.** ARR, NRR, GRR, logo churn, CAC payback, LTV/CAC, Rule of 40 — measured monthly, stored in a single dashboard (PostHog + a finance sheet will do for the first 2 years). The dashboard is the single most-requested artefact during PE diligence.
8. **Boring, standardised contracts.** MSAs, DPAs, SLAs templated from day 1. Not bespoke deals. PE buyers scrutinise the contract portfolio for non-standard terms; every custom carve-out is a discount lever.
9. **Category leadership signalling.** The `/vs/*` SEO pages + App Store ranking + category-defining content are the right plays. The goal isn't volume — it's Google / buyer perception that Palvento *is* the category.
10. **English-language market first.** Dayforce's global footprint was built on an anglo core. Palvento's UK / US / AU / CA focus is the right shape; adding a 5th currency for EUR was correct. Don't chase Japan / Brazil until $20M ARR.

**Things NOT to copy from Dayforce at this stage:**
- Their 9,600-person operational structure (you're 1)
- Their multi-product suite (you have one wedge)
- Their enterprise-only sales motion (you need self-serve volume first)
- Their geographic spread (they're global by necessity — you're Shopify App Store first)

## 6. Realistic 10-year path to a $1B+ exit

Stage gates for Palvento, anchored to ARR milestones:

| Year | ARR target | What's happening | Buyer interest |
|---|---|---|---|
| 0–1 (now) | $0 → $250k | 10 founding partners, product proven | None — too early |
| 1–2 | $250k → $1M | 100 customers, retention measured, SOC 2 Type 1 | None |
| 2–3 | $1M → $5M | App Store leadership, first enterprise contracts, SOC 2 Type 2 | Seed / Series A possible |
| 3–5 | $5M → $25M | Category leadership, NRR > 110%, audit-ready financials | Growth equity — Bessemer, Insight, Accel |
| 5–7 | $25M → $75M | International expansion, second product line | Growth equity + strategic (Shopify, Square, Amazon) |
| 7–10 | $75M → $200M+ | Rule of 40, 90%+ retention, 3 years audited | **PE take-private (Thoma Bravo tier) — $1B+ exit** |

This path is possible. It is also 7–10 years of compounding. The architectural decisions that matter are made in years 0–2 — specifically the first 10 on that list.

## 7. The two questions to answer today

1. **Are the 10 points in §5 actually on the roadmap?** Audit against the codebase. Most are either done or planned — flag anything missing.
2. **What's the concrete goal for the next 12 months that advances the path?** Not "get acquired." Not "build Dayforce's stack." The goal is: *first 10 founding partners live, $250k ARR, SOC 2 Type 1 started.* That unlocks everything downstream.

The $1B exit is the right ambition. The path is a decade of boring right-decisions, not a shortcut through a different company's architecture.
