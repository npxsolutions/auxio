# Palvento v2 — Phased Implementation Plan

Concrete 14–20 week delivery plan for the v2 vision in `palvento-v2-brief.md`. Each phase is deployable independently; architecture never enters a broken state.

---

## Phase 0 — Vision + CMS foundation (2–3 days)

**Scope**
- Save strategic brief (`palvento-v2-brief.md`) ✅ DONE
- Save phased plan (this file) ✅ DONE
- Build `SectionRegistry` pattern: `app/lib/cms/registry.ts` + 3 initial section components (hero, feature_grid, cta)
- Convert `/app/landing/v1/page.tsx` to CMS-rendered as reference implementation
- `marketing_pages` + `marketing_sections` Supabase tables (no RLS required — marketing is public)

**Why first:** low-risk, additive, unlocks marketing velocity. Also the cleanest standalone deliverable.

**Success criteria:** a new landing page variant can be created by inserting JSON rows in Supabase, with zero code deploys.

---

## Phase 1 — Multi-tenancy migration (3–4 weeks)

**The big rock.** Everything else depends on this.

**Scope**
1. Schema migration:
   - Create `organizations` (id, name, slug, plan, stripe_customer_id, created_at)
   - Create `memberships` (user_id, organization_id, role, created_at) — unique on (user_id, org_id)
   - Add `organization_id` column to every user-scoped table: `listings`, `channels`, `sync_jobs`, `sync_failures`, `transactions`, `usage_metrics`, `audit_log`, `feed_rules`, `metrics_daily`, `channel_sync_state`, etc.
   - Backfill: for each existing user, create a personal org; set `organization_id` on all their rows
2. RLS policy rewrite:
   - Replace `auth.uid() = user_id` with org-based policies using `auth.jwt() -> 'organization_ids'`
   - Add policy-level enforcement on inserts (no cross-org writes)
3. Request-layer enforcement:
   - Middleware sets `X-Organization-Id` header from session
   - Supabase client wrapped to always scope queries by active org
   - Org switcher UI in top utility bar
4. Audit log schema update: add `organization_id` column, backfill
5. Billing migration: subscription moves from `users.stripe_subscription_id` to `organizations.stripe_subscription_id`

**Risk mitigation**
- Dual-write period: both `user_id` AND `organization_id` populated on all writes for 2 weeks
- Audit script that detects any row with mismatched org vs user
- RLS policies applied table-by-table, tested with integration tests per table
- Rollback plan: revert column drops only after 30 days of clean dual-write

**Success criteria**
- Every table has `organization_id` with RLS enforcement
- User invited to a new org cannot see their previous org's data
- No cross-org data leaks detected in 7 days of dual-write monitoring

---

## Phase 2 — Products/Listings decoupling + Inventory ledger (3–4 weeks)

**Scope**
1. Schema:
   - Create `products` (master SKU, org-scoped)
   - Rename `listings` → `channel_listings` (per-channel instance of a product)
   - Add FK: `channel_listings.product_id → products.id`
   - Backfill: each existing listing becomes both a product AND a channel_listing
2. Inventory ledger:
   - Create `inventory_movements` (product_id, location_id, delta, reason, ref_id, created_at)
   - Create `inventory_lots` for FIFO/lot tracking (optional in v2.0, required for v2.1)
   - `inventory_state` becomes a materialised view computed from movements
3. UI updates:
   - `/products` page (new master table)
   - `/listings` becomes `/channel-listings` — drill-down from product
   - Drawer editing on both surfaces
4. Sync engine updates:
   - `pushProductToChannel(productId, channel)` — pushes master → channel_listing
   - Conflict resolution when channel-side edits diverge from master

**Success criteria**
- Operator can have one product with 5 channel listings across 5 marketplaces
- Inventory movements auditable from a single ledger
- Product edits propagate to channel listings on opt-in basis

---

## Phase 3 — Amazon SP-API + TikTok Shop integrations (4–6 weeks)

**Scope**
1. Amazon SP-API (MWS-era code may exist; modernise to SP-API):
   - OAuth refresh token handling
   - Listings push (XML feeds v1, upgrade to JSON listings API)
   - Orders poll every 15 min
   - Inventory feed every hour
   - Fee reconciliation (payout reports → `transactions.fees_breakdown`)
2. TikTok Shop:
   - OAuth (US + UK regions)
   - Product catalog push
   - Orders webhook + 5-min poll fallback
   - Inventory sync every hour
   - Content compliance validator (ingredient lists for beauty, banned-word check)
3. Both integrations:
   - `integrations` table entry per connected account
   - Rate-limit aware (token bucket per marketplace)
   - Retry on 429 with exponential backoff
   - Health-check endpoint per integration

**Blockers**
- Amazon SP-API developer registration and security audit (~2–4 weeks wait)
- TikTok Shop partner approval (~2–6 weeks)
- Apply for both during Phase 1 so approvals land by Phase 3 start

**Success criteria**
- Full product-listing-order-inventory loop on both marketplaces
- Surface in Sync Logs + admin Metrics dashboard
- Documented in operator help centre

---

## Phase 4 — Central job orchestrator + retention loop (2–3 weeks)

**Scope**
1. Orchestrator:
   - Adopt Inngest or Trigger.dev (vs. self-hosted Temporal — overkill for current scale)
   - Migrate sync cron endpoints to event-driven: `listing.updated` → `sync.push.required`
   - Keep cron endpoints for scheduled pulls (orders poll, inventory reconcile)
   - Dashboard in `/admin/sync-health` shows orchestrator state
2. In-app notification surface:
   - `notifications` table (org_id, user_id, type, severity, data, read_at)
   - Bell icon + dropdown in top utility bar
   - Severity → email escalation: LOW (in-app only), MEDIUM (daily digest), HIGH (immediate email)
3. Retention triggers:
   - Stock-out risk (7 days of cover remaining) → notification
   - Feed rejection → notification + playbook link
   - Account-health score drop → notification
   - Payout reconciliation anomaly → notification
   - New marketplace category opportunity → notification (quarterly)

**Success criteria**
- Orchestrator replaces >70% of cron-inline sync
- Average operator logs in ≥5 days/week to clear notifications
- Time-to-resolution on feed rejections drops 50%+

---

## Phase 5 — CMS expansion + marketing migration (2–3 weeks)

**Scope**
1. Section registry expansion: `hero`, `feature_grid`, `step_flow`, `integration_grid`, `testimonial`, `cta`, `product_preview`, `pricing_table`, `faq`, `logo_wall`, `stat_card`, `video_embed`
2. Migrate remaining landing pages (v2–v9) to CMS
3. Admin UI for non-dev marketing staff:
   - Create/edit pages
   - Drag-reorder sections
   - Preview before publish
   - Publish/unpublish state
4. SEO foundations: sitemap from `marketing_pages`, per-page OG images, schema.org markup

**Success criteria**
- Marketing team can launch a new landing page in 30 minutes without engineering
- Existing landing pages render from CMS without regression

---

## Cross-phase workstreams (continuous)

**Testing**
- Integration tests per channel, run on every PR
- RLS integration tests per table (critical for Phase 1)
- E2E Playwright suite for dashboard critical paths

**Observability hardening**
- OpenTelemetry traces on all API routes (via Sentry Performance or equivalent)
- Structured logging with `organization_id` on every log line
- `/admin/system-health` page with real-time status

**Design system evolution**
- Extract spacing scale: `space.sm = 8px, space.md = 16px, space.lg = 24px, space.xl = 32px`
- Codify typography scale with named sizes (`text.xs / sm / md / lg / xl / display`)
- Share tokens between marketing + app (move from `app/lib/design-system.tsx` to `app/lib/tokens/`)

**Exit readiness (ongoing)**
- Every new table requires RLS policy review before merge
- Every integration requires retry + audit + observability
- No "founder-only" or manual-only flows introduced

---

## Timeline summary

| Phase | Weeks | Parallelisable? |
|---|---|---|
| P0 — Vision + CMS foundation | 0.5 (2-3d) | — |
| P1 — Multi-tenancy | 3–4 | Blocking; nothing else merges |
| P2 — Products + Inventory | 3–4 | Sequential after P1 |
| P3 — Amazon + TikTok Shop | 4–6 | Partial parallel with P2 once P1 lands |
| P4 — Orchestrator + retention | 2–3 | Parallel with P3 possible |
| P5 — CMS expansion | 2–3 | Parallel with P3/P4 |
| **Total (sequential)** | **~16 weeks** | |
| **Total (with parallelisation)** | **~12 weeks** | If 2+ engineers after P1 |

---

## What I'd do first, right now

**Start Phase 0 today.** Specifically:

1. Add 3 Supabase tables: `marketing_pages`, `marketing_sections`, `marketing_section_types`
2. Write `app/lib/cms/registry.ts` with `SectionRegistry` map
3. Write 3 section components: `HeroSection`, `FeatureGridSection`, `CtaSection`
4. Build `app/(marketing)/[slug]/page.tsx` that fetches a page by slug and renders its sections
5. Seed one page from `app/landing/v1/page.tsx` content, leave the v1 hardcoded page untouched during transition

**Deliverable:** `/cms-demo` renders from the database, visually identical to `/landing/v1`, proves the pattern.

**Next session options:**
- Begin Phase 1 multi-tenancy planning doc + schema migrations
- Start Amazon SP-API partner registration (external blocker)
- Refine Phase 2 products/listings split SQL

Pick one — or continue Phase 0 execution.
