# Palvento v2 — Strategic Architecture Brief

**Status:** Vision doc. Phased implementation. Captured 2026-04-23.
**Exit target:** 15× EBITDA, 5-year horizon.
**Positioning:** Multi-tenant commerce operations & synchronisation platform with CMS-driven marketing layer.

---

## 0. Strategic objective (non-negotiable)

Palvento is engineered as a venture-scale SaaS asset:

- multi-tenant architecture (strict org-level isolation)
- billing system support (subscription + usage)
- retention-driven workflows (system requires user return)
- full auditability (logs + sync history)
- observable system behaviour (every action traceable)
- strong switching costs via integrations + workflows
- structurally capable of a high-multiple SaaS exit

Not a website. A sellable SaaS infrastructure product.

---

## 1. Core product definition

Palvento is a Commerce Operations & Synchronisation System. It manages:

- master products
- channel listings (Shopify, Amazon, eBay, TikTok Shop, Etsy, Walmart, WooCommerce, BigCommerce, OnBuy, Facebook Catalog, Google Shopping)
- inventory state
- sync operations
- integrations
- workflow automation
- marketing CMS layer

---

## 2. Architecture overview

Single Next.js application with two surfaces:

**A. Public marketing layer**
- CMS-driven landing pages
- SEO-optimised
- section-based composition via `SectionRegistry`
- shared design system with app

**B. Authenticated SaaS layer**
- entity-driven dashboard
- table-first UI
- drawer-based editing
- Supabase-backed state system

Both share: design system, components, tokens (spacing, typography, colors).

---

## 3. Multi-tenant requirement (critical)

- `organizations` (tenants)
- users belong to organizations (many-to-many via `memberships`)
- strict row-level security (Supabase RLS) scoped to `organization_id`
- no global/shared tenant data
- org context resolved via JWT claim or request header

---

## 4. Supabase data model

**Commerce**
- `products` (master entity, org-scoped)
- `channel_listings` (per-channel instance of product, one-to-many from products)
- `inventory_ledger` (event log; current state is a materialised view)
- `sync_jobs` (queue + history)
- `integrations` (per-org connected channels + credentials)

**System**
- `organizations`
- `users` / `memberships` (users ↔ orgs)
- `audit_logs`
- `billing_plans`
- `subscriptions` (per-org)
- `usage_metrics` (metered events for billing)

---

## 5. Sync engine (core logic)

Deterministic, retryable, observable operations:

- `pushProductToChannel(productId, channel)`
- `syncInventory(productId)`
- `fetchChannelUpdates(channel)`
- `reconcileStateConflicts()`

Every action:
- writes a `sync_jobs` entry
- is retryable with exponential backoff
- generates `audit_logs` entry
- is visible in UI (Sync Logs page)

Cron is fine for scheduled pulls. Event-driven sync uses a central orchestrator (Inngest / Trigger.dev / Temporal) for pushes triggered by user actions.

---

## 6. SaaS UI (Base.com-style)

**Layout**
- sidebar navigation
- top utility bar (org switcher, notifications, search)
- main entity workspace

**Pages**
- **Dashboard** — KPIs, sync health, failed jobs, activity feed
- **Products** — master table, drawer-based editing
- **Channels** — mapping + status per channel
- **Inventory** — stock tracking + alerts
- **Sync Logs** — full audit trail, retry actions
- **Settings** — integrations, billing, organization

---

## 7. UI rules

- tables = primary interface
- drawers = primary editing surface
- no page-based editing flows
- no marketing UI inside the app
- strict entity-driven design

---

## 8. Marketing system (CMS-driven)

Pages are JSON/DB-driven:

```ts
type MarketingPage = {
  slug: string;
  sections: Section[];
  seo: { title: string; description: string; ogImage?: string };
};

type Section =
  | { type: 'hero'; props: HeroProps }
  | { type: 'feature_grid'; props: FeatureGridProps }
  | { type: 'step_flow'; props: StepFlowProps }
  | { type: 'integration_grid'; props: IntegrationGridProps }
  | { type: 'testimonial'; props: TestimonialProps }
  | { type: 'cta'; props: CtaProps }
  | { type: 'product_preview'; props: ProductPreviewProps };
```

Renderer uses a `SectionRegistry` mapping `type → component`. No hardcoded pages. Content stored in Supabase (`marketing_pages`, `marketing_sections`).

---

## 9. Motion system (minimal)

- scroll reveal only (opacity + translateY 12px → 0)
- hover lift (2–4px)
- consistent 200–400ms timing
- no parallax, no heavy animation
- motion supports hierarchy only

Implementation: small motion primitives in `app/lib/motion.tsx`. No framer-motion dependency unless justified.

---

## 10. Billing + revenue structure

Must support:
- subscription plans (`billing_plans` table, Stripe Price IDs)
- usage tracking foundation (`usage_metrics` table → Stripe Meters)
- upgrade/downgrade flows
- per-organization subscription (not per-user)
- lifetime / legacy pricing support (already exists)

---

## 11. Observability layer (critical)

Every action generates:
- `audit_logs` entry (actor, org_id, action, resource, resource_id, before/after, IP, timestamp)
- `sync_jobs` entry if applicable
- user + org attribution
- timestamp

System is fully traceable. `audit_logs` is the legal / compliance record.

---

## 12. Design system

- Inter font (body) + Instrument Serif (display) — current stack holds
- 8px spacing system (codify as tokens — currently implicit)
- neutral palette with single warm accent (`P.cobalt` — orange `#e8863f`)
- borders over shadows
- strict typography hierarchy
- shared system across app + marketing

---

## 13. Retention loop engine

System creates recurring usage loops:
- sync activity (new orders, price changes, inventory movements)
- alerts (stock-out risk, feed rejections, account-health warnings)
- inventory changes (reorder point triggers)
- failed job resolution (operator must fix)

Goal: system is always active and requires user return. In-app notification surface + email escalation for severe events.

---

## 14. Exit-readiness principles (15× EBITDA target)

Architecture maximises:
- **retention** — workflow dependency, sync state tied to Palvento
- **switching costs** — multi-channel integrations, operational runbooks in-app
- **expansion revenue** — per-channel, per-SKU, per-order metered pricing
- **operational visibility** — logs + audit trails for diligence
- **predictable unit economics** — usage meters → Stripe Billing

No brittle scripts, no one-off flows, no manual-only operations.

---

## 15. Output requirements (phased)

See `docs/architecture/v2-phased-plan.md` for the phased implementation schedule.

---

## Current state snapshot (2026-04-23)

| Requirement | Status | Notes |
|---|---|---|
| Multi-tenancy | MISSING | User-scoped only. `organization_id` column absent everywhere. |
| Commerce schema | PARTIAL | `listings` doubles as product+channel-instance. `products` / `inventory_ledger` / `integrations` tables missing. |
| Sync engine | EXISTS | 11+ cron endpoints. `sync_jobs` + `sync_failures` with retry/backoff. |
| Channel integrations | PARTIAL | 7 production (Shopify/eBay/Etsy/Walmart/OnBuy/Woo/BigCommerce). Amazon OAuth-only. TikTok stubbed. Facebook/Google product-only. |
| Dashboard/UI | EXISTS | Table-first, drawer-edit, `AppSidebar`. Pattern aligns with brief. |
| Marketing/CMS | HARDCODED | 9 landing variants, blog, comparison pages — all TSX. No SectionRegistry. |
| Billing | EXISTS | Stripe checkout, webhooks, metered meters, lifetime support. |
| Observability | PARTIAL | `audit_log`, Sentry, PostHog, admin metrics. No request tracing. |
| Design system | EXISTS (informal) | Single file. No 8px spacing scale tokens yet. |
| Motion | MINIMAL | Single keyframe. Matches brief. |
| Retention | MONITORED | `email-lifecycle` cron. No in-app re-engagement triggers. |

---

## Definition of done

Palvento v2 functions as:

> A multi-tenant commerce synchronisation platform with CMS-driven marketing pages and entity-driven SaaS UI, designed as a scalable infrastructure asset capable of enterprise-grade retention and high-multiple exit potential.
