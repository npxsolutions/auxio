# Phase 1 — Stage C tracker

**Purpose:** Track the app-code migration from user-scoped to org-scoped. Stage A (schema + backfill) and Stage B (dual RLS) are done. Stage C is the biggest phase: ~75 route conversions + cron updates + UI changes + Stripe webhook rewrite. This doc is the authoritative checklist — update status as you go.

**Current status:** Stage C + Stage D migrations shipped (2026-04-23). C.2 (52 user-scoped routes), C.3 (cron/sync/webhook/admin), `/api/v1/*` API-key helper, C.4 (Stripe billing migrated to organizations with users shim), C.5 (org switcher UI, invite flow, team settings page, accept-invite page), C.6 (RLS integration test scaffold + Slack/email alerting on leak scanner). Stage A.1 migration + all Stage A.1 TODOs resolved in code. Stage D RLS cutover migration + Stage D billing column drop migration prepared, not applied. Typecheck clean. Stage D application gated on: 7 days zero rls_migration_audit + `pnpm test:rls` green + 30 days clean Stripe webhooks.

---

## 0. Exit criteria for Stage C

Stage C is done when:

1. Every route in the "Pending conversion" lists below uses `requireActiveOrg()` and writes `organization_id` on INSERT
2. All scheduled cron jobs loop per-org or explicitly filter by `organization_id`
3. The org switcher UI ships + invite flow accepts tokens
4. Stripe webhook updates the correct `organizations` row by `stripe_customer_id`
5. `SELECT count(*) FROM public.rls_migration_audit WHERE resolved_at IS NULL` = 0 for 7 consecutive days
6. Sentry RLS error rate during Stage B+C = 0

Stage D (drop old policies) gates on #5 + #6.

---

## 1. Conversion pattern (copy this for every route)

### Before

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const getSupabase = async () => { /* ... */ }

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', user.id)               // remove — RLS handles it
  // ...
}

export async function POST(req: Request) {
  // ...
  await supabase.from('listings').insert({
    user_id: user.id,                     // keep as creator attribution
    // ...
  })
}
```

### After

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'

const getSupabase = async () => { /* ... */ }

export async function GET() {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await getSupabase()
  const { data } = await supabase
    .from('listings')
    .select('*')                          // no filter — RLS scopes by org
  // ...
}

export async function POST(req: Request) {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await getSupabase()
  // ...
  await supabase.from('listings').insert({
    organization_id: ctx.id,              // required for RLS INSERT policy
    user_id: ctx.user.id,                 // creator attribution
    // ...
  })
}
```

### The 5-step checklist per route

1. Import `requireActiveOrg` from `@/app/lib/org/context`
2. Replace `supabase.auth.getUser()` + Unauthorized block with `requireActiveOrg().catch(() => null)` → 401 if null
3. Remove `.eq('user_id', user.id)` on **reads** — RLS handles scoping now
4. On **INSERT**: add `organization_id: ctx.id` + keep `user_id: ctx.user.id` for attribution
5. On **UPDATE**: leave alone (RLS prevents cross-org writes); if code explicitly writes `user_id`, leave it

### For service-role routes (uses `getAdmin()` or `getSupabaseAdmin()`)

Service role **bypasses RLS** — explicit `.eq('organization_id', ctx.id)` is mandatory on every query that reads tenant data. Pattern:

```typescript
const ctx = await requireActiveOrg().catch(() => null)
if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const { data } = await getAdmin()
  .from('channels')
  .select('*')
  .eq('organization_id', ctx.id)         // REQUIRED — service role skips RLS
  .eq('active', true)
```

Missing `.eq('organization_id', ctx.id)` = cross-org data leak. Always add it.

---

## 2. Routes already converted (session 2026-04-23)

- [x] `app/api/listings/route.ts` (GET + POST)
- [x] `app/api/orders/route.ts` (GET)
- [x] `app/api/dashboard/stats/route.ts` (GET)
- [x] `app/api/channels/health/route.ts` (GET — service role example)

These four cover every pattern you'll encounter in the remaining 75 routes.

---

## 3. Routes pending conversion — user-scoped (~60)

Grouped by surface. Convert in order within each group; verify green by manual QA after each group.

### 3.1 Core commerce (do first — highest traffic) ✅ DONE (2026-04-21)

- [x] `app/api/listings/[id]/route.ts` — listing detail
- [x] `app/api/listings/[id]/publish/route.ts`
- [x] `app/api/listings/[id]/suggest-category/route.ts`
- [x] `app/api/listings/[id]/enrich-aspects/route.ts`
- [x] `app/api/listings/[id]/autofix/route.ts`
- [x] `app/api/listings/[id]/health/route.ts`
- [x] `app/api/listings/[id]/optimize/route.ts`
- [x] `app/api/listings/stats/route.ts`
- [x] `app/api/inventory/route.ts` — ⚠️ `inventory` table missing `organization_id`; Stage A.1 follow-up
- [x] `app/api/bundles/route.ts` — ⚠️ `bundles`/`bundle_items` missing `organization_id`; Stage A.1 follow-up
- [x] `app/api/rules/route.ts`
- [x] `app/api/category-mappings/route.ts` — ⚠️ `category_mappings` missing `organization_id`; Stage A.1 follow-up

**Stage A.1 follow-up needed** — these tables still scope by `user_id` (old RLS active). Migration to add `organization_id` + org-scoped RLS on: `inventory`, `bundles`, `bundle_items`, `category_mappings`, `channel_sync_state`, `sync_log`, `listing_versions`, `feed_health`, `field_mappings`.

### 3.2 Analytics / finance ✅ DONE (2026-04-23)

- [x] `app/api/financials/route.ts`
- [x] `app/api/advertising/route.ts` — ⚠️ ad_campaigns Stage A.1
- [x] `app/api/forecasting/route.ts` — ⚠️ inventory Stage A.1
- [x] `app/api/analytics/route.ts`
- [x] `app/api/costs/route.ts`
- [x] `app/api/repricing/route.ts` — ⚠️ repricing_rules Stage A.1
- [x] `app/api/purchase-orders/route.ts` — ⚠️ purchase_orders + purchase_order_items Stage A.1
- [x] `app/api/suppliers/route.ts` — ⚠️ suppliers (plural) Stage A.1
- [x] `app/api/lookup-tables/route.ts` — ⚠️ lookup_tables + lookup_table_rows Stage A.1
- [x] `app/api/feed-health/route.ts`
- [x] `app/api/optimization-suggestions/route.ts`
- [x] `app/api/benchmarks/route.ts`

### 3.3 AI / agent ✅ DONE (2026-04-23)

- [x] `app/api/agent/route.ts` — ⚠️ product_intelligence, ppc_keyword_performance, inventory Stage A.1
- [x] `app/api/agent/approve/route.ts` — ⚠️ agent_action_log Stage A.1
- [x] `app/api/agent/dismiss/route.ts`
- [x] `app/api/agent/autopilot/route.ts` — deferred to C.3 (cron, no user session)
- [x] `app/api/chat/route.ts` — ⚠️ ai_conversations, ai_insights Stage A.1
- [x] `app/api/intelligence/route.ts` — ⚠️ agent_action_log Stage A.1
- [x] `app/api/enrichment/route.ts` — ⚠️ enrichment_usage Stage A.1
- [x] `app/api/enrichment/image/route.ts` — ⚠️ enrichment_usage Stage A.1
- [x] `app/api/enrichment/bulk/route.ts` — ⚠️ enrichment_usage Stage A.1

### 3.4 Social intel ✅ DONE (2026-04-23)

- [x] `app/api/social-intel/ingest/route.ts`
- [x] `app/api/social-intel/watchlist/route.ts`
- [x] `app/api/social-intel/query/route.ts`
- [x] `app/api/social-intel/process/route.ts` (service-role internal call — org_id flows via request body)
- [x] `app/api/sync/social-intel/route.ts` (cron — org_id flows from si_watchlist row)

### 3.5 Developer / API surface ✅ partial (2026-04-23)

- [x] `app/api/developer/route.ts` — ⚠️ api_keys + webhooks Stage A.1
- [x] `app/api/developer/keys/route.ts` — ⚠️ api_keys Stage A.1
- [ ] `app/api/v1/profit/summary/route.ts`
- [ ] `app/api/v1/channels/route.ts`
- [ ] `app/api/v1/orders/route.ts`
- [ ] `app/api/v1/listings/route.ts`

**Note on `/api/v1/*`**: these are public API endpoints for customers. Org context here comes from an API key, not a session cookie. Build `requireActiveOrgFromApiKey()` in a follow-up — blocking pattern for this group. Deferred to separate sub-task.

### 3.6 Channel-specific ✅ DONE (2026-04-23)

- [x] `app/api/channels/test/route.ts`
- [x] `app/api/shopify/backfill/route.ts`
- [x] `app/api/shopify/sync/route.ts`
- [x] `app/api/shopify/products/sync/route.ts`
- [x] `app/api/ebay/sync/route.ts`
- [x] `app/api/ebay/orders/sync/route.ts`

### 3.7 Misc ✅ DONE (2026-04-23)

- [x] `app/api/onboarding/route.ts` (user_profiles stays user-scoped per Stage C.0 tightening)
- [x] `app/api/digest/morning/route.ts` — cron, deferred to C.3 (TODO noted in file)
- [x] `app/api/data/delete/route.ts` — DSAR, stays user-scoped
- [x] `app/api/data/export/route.ts` — DSAR, TODO C.3 for org-scoped dump

---

## 4. Routes pending conversion — service-role / cron (~15)

Each of these bypasses RLS. **Must** add explicit `.eq('organization_id', ...)` to every scoped query. Typically loop per-org inside cron jobs.

### 4.1 Cron jobs (loop per-org) ✅ reviewed (2026-04-23)

Pattern:

```typescript
const admin = getSupabaseAdmin()
const { data: orgs } = await admin.from('organizations').select('id')
for (const org of orgs ?? []) {
  // do work scoped to org.id
  const { data: channels } = await admin
    .from('channels').select('*').eq('organization_id', org.id)
  // ...
}
```

All 9 cron routes reviewed. Most delegate to SECURITY DEFINER RPCs or iterate per-user/per-channel where service-role already bypasses RLS correctly. TODOs added where an SQL function (`aggregate_listings_v2`, `aggregate_metrics_daily`) or an anonymity key (feed-benchmarks, feed-patterns, benchmarks) should be switched to org_id as part of Stage A.1. Billing crons (report-usage, apply-credits) blocked by Stripe rewrite in C.4.

- [x] `app/api/cron/report-usage/route.ts` — TODO C.4 (Stripe rewrite)
- [x] `app/api/cron/email-lifecycle/route.ts` — TODO C.4
- [x] `app/api/cron/aggregations/listings/route.ts` — TODO Stage A.1 SQL fn
- [x] `app/api/cron/aggregations/metrics-daily/route.ts` — TODO Stage A.1 SQL fn
- [x] `app/api/cron/apply-credits/route.ts` — TODO C.4
- [x] `app/api/cron/revalidate-listings/route.ts` — listing_id-scoped, safe today
- [x] `app/api/cron/feed-benchmarks/route.ts` — TODO Stage A.1 (switch anonymity key)
- [x] `app/api/cron/feed-patterns/route.ts` — TODO Stage A.1
- [x] `app/api/cron/benchmarks/route.ts` — TODO Stage A.1

### 4.2 Marketplace sync jobs ✅ DONE (2026-04-23)

All converted to iterate per-channel with `organization_id` pulled alongside `user_id` from `channels`. Scoped inserts now write `organization_id` on `listings`, `listing_channels`, `transactions`, `channels` UPDATEs. Unscoped tables (`channel_sync_state`, `sync_log`) keep user_id with TODO Stage A.1.

- [x] `app/api/sync/route.ts` (drift orchestrator — TODO C.3 for publish server-to-server auth)
- [x] `app/api/sync/shopify/route.ts`
- [x] `app/api/sync/ebay/listings/route.ts`
- [x] `app/api/sync/ebay/orders/route.ts`
- [x] `app/api/sync/etsy/listings/route.ts`
- [x] `app/api/sync/etsy/orders/route.ts`
- [x] `app/api/sync/walmart/listings/route.ts`
- [x] `app/api/sync/walmart/orders/route.ts`
- [x] `app/api/sync/onbuy/listings/route.ts`
- [x] `app/api/sync/onbuy/orders/route.ts`
- [x] `app/api/sync/facebook/products/route.ts`
- [x] `app/api/sync/google/products/route.ts`
- [x] `app/api/sync/woocommerce/route.ts`
- [x] `app/api/sync/bigcommerce/route.ts`

### 4.3 Inbound webhooks (find org by channel / shop_domain)

Webhook handlers don't have a session. They identify the target org by looking up the channel row (which has `organization_id`). Pattern:

```typescript
const { data: channel } = await admin
  .from('channels')
  .select('id, organization_id')
  .eq('shop_domain', shopDomain)
  .eq('type', 'shopify')
  .single()
if (!channel) return badRequest()
// now use channel.organization_id for all subsequent writes
```

- [x] `app/api/webhooks/shopify/orders/route.ts`
- [x] `app/api/webhooks/shopify/inventory/route.ts`
- [x] `app/api/webhooks/shopify/products/route.ts`
- [x] `app/api/shopify/webhooks/shop-redact/route.ts` — switched delete from user_id to organization_id scope
- [x] `app/api/webhooks/facebook/route.ts`
- [x] `app/api/webhooks/woocommerce/orders/route.ts`
- [x] `app/api/webhooks/woocommerce/products/route.ts`
- [x] `app/api/webhooks/bigcommerce/orders/route.ts`
- [x] `app/api/webhooks/bigcommerce/products/route.ts`
- [ ] `app/api/ebay/notifications/account-deletion/route.ts` — TODO (eBay marketplace account deletion)

### 4.4 Admin routes ✅ reviewed (2026-04-23)

Admin pages use `isAdminEmail()` gate (unchanged by Phase 1). Tenant-data routes now accept optional `organization_id` filter:

- [x] `app/api/admin/publish-activity/route.ts` — accepts `?organization_id=` filter
- [x] `app/api/admin/sync-health/route.ts` — buckets keyed by org_id+channel
- [x] `app/api/admin/ebay-policies/route.ts` — exposes organization_id per channel row
- [x] `app/api/admin/feed-benchmarks/route.ts` — reads aggregated rollups, no per-tenant data
- [x] `app/api/admin/{partners,affiliates,demos,api-keys,enterprise}/[id]/route.ts` — admin-managed entities, not tenant-scoped

---

## 5. Stripe webhook rewrite

Single file, high importance:

- [ ] `app/api/stripe/webhook/route.ts` — switch from updating `users.*` to updating `organizations.*` using `stripe_customer_id` lookup

```typescript
// BEFORE: find user by subscription event.
// AFTER:  find org by stripe_customer_id event.
async function findOrgForEvent(event: Stripe.Event) {
  const customerId = /* pull from event.data.object based on event type */
  const { data } = await admin
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.id ?? null
}
```

- [ ] `app/api/stripe/checkout/route.ts` — add `metadata.organization_id: ctx.id` to every Checkout Session
- [ ] `app/api/billing/lifetime-checkout/route.ts` — same
- [ ] `app/api/billing/switch-annual/route.ts` — same
- [ ] `app/api/stripe/portal/route.ts` — use `organizations.stripe_customer_id`, not `users.stripe_customer_id`
- [ ] `app/api/billing/usage/route.ts` — read plan / billing state from `organizations`

---

## 6. UI changes

### 6.1 Org switcher

New component: `app/components/OrgSwitcher.tsx` (client component)

Drops into the top of `AppSidebar`. Uses `listUserOrgs()` to populate, calls a Server Action that invokes `setActiveOrgCookie()` then `router.refresh()`.

- [ ] Build `OrgSwitcher.tsx`
- [ ] Add Server Action `app/actions/org/switch.ts` that wraps `setActiveOrgCookie()`
- [ ] Mount in `app/components/AppSidebar.tsx`
- [ ] Handle no-orgs edge case (graceful message, not crash)

### 6.2 Invite flow

- [ ] `POST /api/org/invite` — creates `organization_invitations` row (admin-only, enforced by RLS)
- [ ] `GET  /api/org/invitations?token=...` — return invite details by token (public endpoint but hard to guess)
- [ ] `POST /api/org/accept-invite` — accepts (authenticated), inserts `organization_members`, marks invite `accepted_at`
- [ ] Page `app/settings/team/page.tsx` — list pending invites, send new, remove members
- [ ] Page `app/invite/[token]/page.tsx` — accept invite page

Invite emails are **deferred to Phase 5** per the spec — Phase 1 uses copy-paste tokens only. Admin copies token from the team page UI, pastes into an email themselves.

### 6.3 Data-surface pages

Most dashboard pages call the API routes we're converting; once those routes are updated, the pages just work via RLS. Exceptions are pages that directly query Supabase from server components — grep `app/` for `.from(` outside `api/`:

- [ ] `app/dashboard/page.tsx` — if it queries directly, add `requireActiveOrg()`
- [ ] `app/listings/page.tsx`
- [ ] `app/orders/page.tsx`
- [ ] `app/channels/page.tsx`
- [ ] `app/analytics/page.tsx`
- [ ] `app/financials/page.tsx`
- [ ] `app/admin/**/page.tsx` — admin pages, org-aware filtering

Run:

```bash
grep -rn "\.from('" app/ --include='*.tsx' --include='*.ts' | grep -v 'app/api/' | grep -v 'app/lib/' > /tmp/direct-queries.txt
```

to generate the full list.

---

## 7. Testing before Stage D

### 7.1 RLS integration tests

One file per scoped table under `tests/rls/`:

```typescript
describe('{table} org-scoped RLS', () => {
  it('user in org A cannot see org B rows', async () => { /* ... */ })
  it('user invited to B sees B rows', async () => { /* ... */ })
  it('user removed from org loses access instantly', async () => { /* ... */ })
  it('UPDATE cannot change organization_id', async () => { /* ... */ })
})
```

One-time setup via `scripts/test/seed-two-orgs.ts`.

### 7.2 E2E Playwright

- [ ] Signup flow creates personal org
- [ ] Create listing → listing scoped to org
- [ ] Invite teammate via token → teammate sees listing
- [ ] Owner removes teammate → access revoked
- [ ] Owner creates second org → data isolation verified
- [ ] Org switcher UI works both directions

### 7.3 Leak scanner monitoring

Daily cron runs `/api/cron/rls-leak-scan`. Target: zero open rows for 7 consecutive days before Stage D.

Dashboard query:

```sql
SELECT table_name, count(*) AS open_leaks
FROM public.rls_migration_audit
WHERE resolved_at IS NULL
GROUP BY table_name
ORDER BY open_leaks DESC;
```

Wire an alert (Slack/email) when count > 0. Expect **zero** for Stage D go/no-go.

---

## 8. Estimated sprint cost (remaining work)

| Slice | Effort | Notes |
|---|---|---|
| User-scoped routes (~60) | 2–3 days | Mechanical. Batch by surface. Tests optional per-route. |
| Service-role / cron routes (~15) | 1–2 days | Per-org loop is a one-line pattern once the first cron is done. |
| Stripe webhook + checkout | 0.5–1 day | One-time surgical change. High risk if wrong. |
| Org switcher UI | 0.5 day | Small. |
| Invite flow backend + page | 1–1.5 days | API + 2 pages. No emails. |
| RLS integration tests | 1–1.5 days | One file per scoped table. |
| Leak scanner alert wire-up | 0.5 day | Slack/email webhook on non-zero. |
| Monitoring window | 7 days | Calendar, not work time. |
| **Total active work** | **7–10 days** | Plus 7-day monitoring before Stage D. |

---

## 9. Session log

| Date | Session deliverable |
|---|---|
| 2026-04-23 | C.1 helpers (`app/lib/org/context.ts`), personal-table RLS tightening migration, leak scanner cron + vercel.json, 4 reference routes converted, this tracker written |
| 2026-04-21 | C.2 — 12 core commerce routes converted (listings/[id] family, stats, inventory, bundles, rules, category-mappings). 9 auxiliary tables flagged for Stage A.1 follow-up. Typecheck clean. |
| 2026-04-23 | C.2 continued — 36 more routes converted across analytics/finance (12), AI/agent (9), social-intel (5), developer (2), channel-specific (6), misc (4). Service-role cron routes (autopilot, digest) + `/api/v1/*` flagged for C.3. Typecheck clean end-to-end. |
| 2026-04-23 | C.3 — 9 cron routes reviewed (TODOs where Stage A.1/C.4 gated), 14 marketplace sync routes converted to org-scoped writes, 9 inbound webhooks converted via `channels` org lookup, 3 admin routes made org-aware. Typecheck clean. |
| 2026-04-23 | `/api/v1/*` — built `requireApiAuthWithOrg()`, converted listings/orders/channels/profit-summary to org scoping. `X-Organization-Id` header selects which org to query. |
| 2026-04-23 | C.4 — migration `phase1_stage_c4_backfill_org_billing.sql` copies billing fields from users → personal org. Rewrote stripe webhook with `resolveTarget()` (metadata → customer_id → user fallback) + `writeBillingUpdate()` (org primary, users shim). checkout, portal, lifetime-checkout, switch-annual, billing/usage all read/write `organizations`. `getMonthlyOrgUsage` helper added. |
| 2026-04-23 | C.5 — `OrgSwitcher` client component + server action `switchOrganization`, mounted in `AppSidebar`. Invite flow API: POST/DELETE `/api/org/invite`, GET `/api/org/invitations` (list + token lookup), POST `/api/org/accept-invite`, GET/DELETE `/api/org/members`. `/settings/team` and `/invite/[token]` pages. Token-only auth (no emails in Phase 1). |
| 2026-04-23 | C.6 — `scripts/test/seed-two-orgs.ts` idempotent fixture creator. `vitest.integration.config.ts` for `tests/rls/**`. Sample RLS tests: listings, channels, organization_members. `pnpm test:rls` script. Leak scanner cron now fans out to Slack webhook + email on non-zero audit rows. |
| 2026-04-23 | Stage A.1 — migration `phase1_stage_a1_auxiliary_tables.sql` adds organization_id + dual RLS to 25 auxiliary tables (inventory, bundles, category_mappings, channel_sync_state, sync_log, purchase_orders, ad_campaigns, api_keys, enrichment_usage, agent_action_log, ai_insights, orders, etc.). Backfill via personal-org lookup for user_id tables; parent-key inheritance for bundle_items / purchase_order_items / lookup_table_rows. Leak scanner list extended. |
| 2026-04-23 | Stage A.1 code cleanup — 37 "TODO Stage A.1" comments resolved across 22 files. All INSERTs to auxiliary tables now include `organization_id`; SELECT/UPDATE/DELETE filters dropped (RLS now handles it). 6 intentional carve-out TODOs remain (SQL-function updates, benchmark anonymity policy, referrals cross-org). |
| 2026-04-23 | Stage D (part 1) — `phase1_stage_d_drop_user_policies.sql` introspects pg_policies for each scoped table and drops every policy whose name doesn't match the `{table}_org_*` or `{table}_service_all` convention. Idempotent; includes sanity that every scoped table has exactly 5 policies post-cutover. Ready to apply after the 7-day zero-audit window + live RLS tests pass. |
| 2026-04-23 | Stage D (part 2) — `phase1_stage_d_drop_user_billing.sql` drops `users.stripe_customer_id` + `users.stripe_subscription_id`. Pre-flight sanity: abort if any user has a stripe_customer_id not mirrored on an org. Checkout/lifetime-checkout/switch-annual routes stopped writing the compat shim. Webhook `writeBillingUpdate()` now strips `stripe_customer_id`/`stripe_subscription_id` from the users mirror. `apply-credits` cron migrated to read from `organizations.stripe_customer_id`. `users.plan` + `users.subscription_status` + related columns DEFERRED — readers (admin metrics, AppSidebar plan badge, enrichment quota) still need to migrate before those columns can drop. |
| _pending_ | C.4 — Stripe webhook + org switcher UI + invite flow |
| _pending_ | RLS tests + 7-day monitoring → Stage D |

---

## 10. Known risks to watch during Stage C

- **A route forgets `organization_id` on INSERT** → Stage B INSERT RLS policy catches it (fails with "violates row-level security policy"). Sentry alert fires. Fix: add `organization_id: ctx.id`.
- **A service-role route forgets `.eq('organization_id', ...)`** → cross-org data leak, RLS doesn't catch service role. Mitigation: leak scanner runs daily + code review checklist.
- **UI renders data for an org the user no longer belongs to** → stale cookie. `getActiveOrg()` validates membership on every call, falls through. Low risk.
- **Webhook handler writes to the wrong org** → because it looked up the wrong channel row. Add dedicated integration test per webhook source.
