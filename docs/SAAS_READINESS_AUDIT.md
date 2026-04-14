# Meridia — $1B SaaS Readiness Audit

**Date:** 2026-04-13
**Scope:** 20 stages, ~120 sub-categories, graded against evidence in the repo.

## Executive Summary

- **Biggest strengths.** Product engineering is genuinely dense: full Stripe billing, Supabase auth + RLS-style schema, 15+ marketplace/channel integrations (Amazon, eBay, Shopify, Etsy, TikTok, Walmart, OnBuy, BigCommerce, WooCommerce, Facebook, Google), a versioned public API (`app/api/v1/`), Sentry + PostHog + Upstash rate limiting, Vercel crons, a polished landing system (v1–v8) with a real design language, competitor `vs/` SEO pages, and legal surfaces. The *shipped product* is already closer to $100M-ready than most repos claim to be.
- **Biggest gaps.** Zero strategy docs (no market research, competitor analysis, roadmap, moat). No distribution motion (no partners/affiliates/marketplaces/referral program). No activation telemetry or product-led growth loops documented. No tests (unit/integration/e2e). No public status page, changelog, developer portal, or help-docs surface. No GDPR/DPA artifacts beyond privacy copy.
- **Top 10 distribution-blocking issues** (ranked): (1) no partner program surface, (2) no affiliate program, (3) no public changelog — kills trust + SEO, (4) no public API docs / developer portal (API exists but undocumented), (5) no status page — enterprise blocker, (6) no help docs / knowledge base, (7) no referral loop / viral mechanics, (8) no SaaS marketplace listings (Shopify App Store, Intercom, Vercel, Zapier), (9) no SEO content engine beyond 4 blog posts, (10) no email automation / lifecycle drip.

## Readiness Matrix

Legend: ✅ Exists · 🟡 Partial · ❌ Missing

| Stage | Sub-category | Status | Evidence | Notes |
|---|---|---|---|---|
| Idea | Problem Discovery | 🟡 | `app/landing/v8/page.tsx`, `app/vs/*` | Implied by positioning; no written artifact. |
| Idea | Market Research | ❌ | — | No doc. |
| Idea | Niche Selection | 🟡 | `app/vs/linnworks`, `app/blog/*` | Multichannel commerce ops, UK-leaning; undocumented strategy. |
| Idea | Competitor Analysis | 🟡 | `app/vs/baselinker`, `brightpearl`, `channelAdvisor`, `linnworks` | SEO pages exist; no internal teardown. |
| Validation | Customer Interviews | ❌ | — | No notes. |
| Validation | Landing Page Test | ✅ | `app/landing/v1`…`v8`, `app/page.tsx` | Strong multi-variant discipline. |
| Validation | Waitlist | ❌ | — | No waitlist route/table. |
| Validation | Pre Sales | ❌ | — | Pricing live but no pre-sales flow. |
| Validation | Demand Testing | 🟡 | `@vercel/analytics`, `posthog-js` | Infra present, no documented experiments. |
| Planning | MVP Scope | 🟡 | 40+ app routes | Implicit in code. |
| Planning | Feature Prioritization | ❌ | — | No roadmap.md. |
| Planning | Tech Stack | ✅ | `package.json`, `next.config.ts` | Next 16, React 19, Supabase, Stripe, Sentry, PostHog, Upstash. |
| Planning | Roadmap | ❌ | — | Missing. |
| Planning | Time to Market | 🟡 | — | No tracking. |
| Design | Wireframes | 🟡 | `design-md/*.md`, `app/brand-concepts` | Reference decks, not wireframes. |
| Design | UI/UX | ✅ | `app/landing/v8`, `DESIGN.md` | High-craft. |
| Design | Prototype | ✅ | `app/landing/v1`…`v8` | Variant prototypes. |
| Design | Design System | 🟡 | `DESIGN.md`, `app/globals.css` | Stripe-inspired spec; no tokens package. |
| Design | UX Copy | ✅ | `app/landing/v8/page.tsx` | v8 had a copy rewrite pass. |
| Development | Frontend | ✅ | `app/**` | Next 16 App Router. |
| Development | Backend | ✅ | `app/api/**` | Route handlers, server actions implied. |
| Development | APIs | ✅ | `app/api/v1/route.ts`, `channels`, `listings`, `orders`, `profit` | Versioned public API. |
| Development | Database | ✅ | `supabase/migrations/social_intel.sql` | Supabase; single migration file — 🟡 for rigor. |
| Development | Authentication | ✅ | `app/auth/callback`, `app/login`, `app/signup`, `@supabase/ssr` | Supabase SSR. |
| Development | Integrations | ✅ | `app/api/{amazon,ebay,shopify,etsy,tiktok,walmart,onbuy,bigcommerce,woocommerce,facebook,google,stripe}` | Deep integration surface. |
| Infrastructure | Hosting | ✅ | `vercel.json`, `nixpacks.toml`, `Railway` | Vercel primary, Railway fallback. |
| Infrastructure | CI/CD | 🟡 | Vercel auto-deploy | No GitHub Actions / test pipeline. |
| Infrastructure | Monitoring | ✅ | `sentry.{client,edge,server}.config.ts` | Sentry wired. |
| Infrastructure | Logging | 🟡 | Sentry + Vercel logs | No structured app logger. |
| Infrastructure | Security | 🟡 | `@upstash/ratelimit`, Supabase RLS implied | No SECURITY.md, no pen-test notes. |
| Testing | Unit Tests | ❌ | — | No test runner in `package.json`. |
| Testing | Integration Tests | ❌ | — | None. |
| Testing | QA | ❌ | — | None documented. |
| Testing | Performance | 🟡 | Vercel Analytics | No budget/Lighthouse CI. |
| Testing | Beta Testing | ❌ | — | None. |
| Launch | Landing Page | ✅ | `app/page.tsx`, `app/landing/v8` | Live. |
| Launch | Product Hunt | ❌ | — | No PH asset kit. |
| Launch | Beta Users | ❌ | — | No flag system. |
| Launch | Early Adopters | ❌ | — | No program. |
| Launch | Public Release | 🟡 | Site live | No launch checklist. |
| Acquisition | SEO | 🟡 | `app/sitemap.ts`, `robots.ts`, `app/vs/*`, `app/blog/*` | Good bones, thin content. |
| Acquisition | Content Marketing | 🟡 | 4 blog posts | Needs engine. |
| Acquisition | Social Media | ❌ | — | No links/embeds. |
| Acquisition | Cold Outreach | ❌ | — | No playbook. |
| Acquisition | Communities | ❌ | — | No presence. |
| Acquisition | Influencer Outreach | ❌ | — | None. |
| Acquisition | Affiliate Marketing | ❌ | — | **Stub created.** |
| Acquisition | Paid Ads | ❌ | — | No UTM/landers. |
| Distribution | Directories | ❌ | — | Not listed in G2/Capterra. |
| Distribution | SaaS Marketplaces | 🟡 | `shopify.app.toml` | Shopify app manifest exists; no Intercom/Zapier/Vercel/Slack. |
| Distribution | Partnerships | ❌ | — | **Stub created.** |
| Distribution | Integrations (distribution angle) | ✅ | `app/integrations/*` | Consumer-side integrations shipped. |
| Distribution | Communities | ❌ | — | None. |
| Activation | Onboarding Flow | 🟡 | `app/onboarding/page.tsx` | Single page; no multi-step checklist. |
| Activation | First Value | 🟡 | Product surfaces exist | Time-to-value unmeasured. |
| Activation | Time to Value | ❌ | — | Unmeasured. |
| Activation | Product Tours | ❌ | — | No tour library. |
| Conversion | Pricing | ✅ | `app/pricing/page.tsx` | Exists. |
| Conversion | Free Trial | 🟡 | Stripe checkout | Trial logic unclear. |
| Conversion | Freemium Model | ❌ | — | Not configured. |
| Conversion | Sales Funnel | 🟡 | Signup → billing | No funnel analytics doc. |
| Conversion | CRO | 🟡 | v1–v8 iteration | No experiments log. |
| Conversion | Demo Flow | ❌ | — | No /demo route. |
| Revenue | Subscriptions | ✅ | `app/api/stripe/checkout`, `portal`, `webhook` | Live. |
| Revenue | Usage Based | ❌ | — | No metered billing. |
| Revenue | Upsells | ❌ | — | None wired. |
| Revenue | Add-ons | ❌ | — | None. |
| Revenue | Enterprise Deals | ❌ | — | No sales motion. |
| Revenue | Lifetime Deals | ❌ | — | None. |
| Revenue | Annual Plans | 🟡 | Stripe prices | Likely in Stripe dashboard; not surfaced. |
| Retention | Onboarding | 🟡 | `app/onboarding` | Thin. |
| Retention | Email Automation | 🟡 | `resend` dep, `app/api/digest/morning` | Morning digest only; no lifecycle. |
| Retention | Customer Success | ❌ | — | No CS playbook. |
| Retention | Feature Adoption | ❌ | — | Not tracked. |
| Retention | Churn Reduction | ❌ | — | No cancel flow surveys. |
| Retention | Feedback Loops | ❌ | — | No NPS/feedback route. |
| Analytics | Tracking | ✅ | `posthog-js`, `posthog-node`, `@vercel/analytics` | Wired. |
| Analytics | Funnel Analysis | 🟡 | PostHog capability | Not configured in repo. |
| Analytics | Cohorts | 🟡 | PostHog capability | Not configured. |
| Analytics | Attribution | ❌ | — | No UTM capture. |
| Analytics | A/B Testing | 🟡 | PostHog capability, landing variants | No flags in code. |
| Growth | Product Led Growth | ❌ | — | No loops documented. |
| Growth | Referral Programs | ❌ | — | None. |
| Growth | Viral Loops | ❌ | — | None. |
| Growth | Community Building | ❌ | — | None. |
| Growth | Growth Experiments | ❌ | — | No log. |
| Growth | Network Effects | ❌ | — | None designed in. |
| Monetization Expansion | Enterprise | ❌ | — | No /enterprise route. |
| Monetization Expansion | Add-on Revenue | ❌ | — | None. |
| Monetization Expansion | Upsell Flows | ❌ | — | None. |
| Monetization Expansion | Cross Sell | ❌ | — | None. |
| Customer Success | Support | ❌ | — | No widget/inbox. |
| Customer Success | Help Docs | ❌ | — | No /docs or /help route. |
| Customer Success | Live Chat | ❌ | — | None. |
| Customer Success | Success Metrics | ❌ | — | None. |
| Customer Success | Management | ❌ | — | None. |
| Legal | Privacy Policy | ✅ | `app/privacy/page.tsx` | Live. |
| Legal | Terms | ✅ | `app/terms/page.tsx` | Live. |
| Legal | GDPR | 🟡 | Privacy page | No DPA, no data export/delete route. |
| Legal | Data Security | 🟡 | Supabase, Sentry | No SECURITY.md / trust page. |
| Scaling | Automation | 🟡 | Vercel crons | Limited. |
| Scaling | Hiring | ❌ | — | No hiring doc, no /careers. |
| Scaling | Systems | 🟡 | — | Infra present, runbooks absent. |
| Scaling | Global Expansion | 🟡 | Multi-region hubs in landing copy | No i18n. |
| Scaling | Exit Strategy | ❌ | — | No doc. |

**Totals:** ✅ 17 · 🟡 28 · ❌ 62 (out of 107 enumerated above; framework approx 120).

## Top 20 Gaps — Ranked by $1B Distribution Leverage

1. **Public changelog** (`/changelog`) — compounding SEO + trust; needed for enterprise sales cycles. *Stub created.*
2. **Developer portal + API docs** (`/developers`) — the v1 API exists but is invisible; docs unlock integrations-as-distribution. *Stub created.*
3. **Partner program** (`/partners`) — agencies reselling unlock 3PL + ecom consultancies. *Stub created.*
4. **Affiliate program** (`/affiliates`) — commerce influencers already monetize this vertical. *Stub created.*
5. **Public status page** (`/status`) — hard gate for mid-market/enterprise procurement. *Stub created.*
6. **Help docs / KB** (`/help` or `/docs`) — deflects support, ranks on long-tail. Not stubbed — flag for user.
7. **SaaS marketplace listings** — Shopify App Store (manifest exists, listing state unknown), Zapier, Intercom, Vercel, BigCommerce, Etsy app marketplaces. Strategy doc stubbed.
8. **SEO content engine** — 4 posts ≠ engine. Need calendar + cluster strategy. Stubbed.
9. **Referral program** — in-product, cash or credit. Stubbed.
10. **Email lifecycle** — Resend is wired, only morning digest exists. Need onboarding/activation/dunning/win-back. Stubbed.
11. **Tests** — zero. Add Vitest + Playwright before enterprise motion.
12. **Cold outreach playbook** — stubbed.
13. **G2/Capterra/GetApp directory listings** — stubbed.
14. **Product tours / onboarding checklist** — first-value TTV. Flag for user.
15. **Feedback loops / NPS** — stubbed.
16. **Churn reduction flow** — cancel survey + save flow. Stubbed.
17. **Enterprise / sales page** — `/enterprise` + SOC2 trust center. Flag.
18. **GDPR artifacts** — DPA, data export, DSAR route. Flag.
19. **A/B testing framework** — formalize PostHog flags, experiments log. Stubbed.
20. **Hiring / careers page** — `/careers`. Flag; ops doc stubbed.

## What Still Needs Real Work (Not Stubbable)

- Tests (Vitest + Playwright), CI pipeline (GitHub Actions).
- SOC2 / security posture work, DPA generation.
- Help docs content (needs product SME).
- Onboarding checklist redesign (needs UX pass).
- Shopify App Store listing submission + review.
