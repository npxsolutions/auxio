# Phase 1 — Multi-tenancy Migration Spec

**Status:** Spec. Reviewed. Not yet executed.
**Estimated effort:** 3–4 weeks focused engineering, 4 stages.
**Risk:** High (cross-org data leakage). All stages are reversible until Stage D.
**Blocking:** Phases 2–5. Ship nothing else until this lands.

---

## 1. Goal

Convert Palvento from single-tenant (every user = a silo) into a multi-tenant SaaS where:

- Data is scoped to an `organization`, not a `user`
- Multiple users can belong to one org (admin, member, viewer roles)
- One user can belong to multiple orgs (future — agency/consultant use case)
- RLS enforces org-scoping at the database layer
- Every existing user gets a personal org seamlessly on day-of-cutover with zero data loss

## 2. Non-goals for Phase 1

- Per-org billing changes beyond moving subscription state from `users` to `organizations` (advanced metered billing stays in Phase 4)
- Team invites UI polish (a minimal API is enough; the UI refinement is Phase 5)
- Role-based permissions beyond `owner / admin / member` (fine-grained ACLs later)
- Sub-orgs or workspace hierarchies (not needed at current scale)

## 3. Success criteria

A migration is successful when **all** of the following are true:

1. Every previously existing user has exactly one personal org with their prior data
2. No `user_id`-scoped RLS policy remains in production
3. Every API route queries with org-scoping (either via RLS or explicit filter for service-role paths)
4. A user invited to a second org can switch context without seeing the first org's data
5. An automated test suite proves cross-org isolation on every scoped table
6. Stripe webhook events update the right organization's subscription state
7. The dual-write monitoring dashboard shows zero drift for 7 consecutive days before Stage D cleanup

## 4. Data model

### 4.1 `organizations`

The tenant unit. One row per tenant.

```sql
CREATE TABLE public.organizations (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   text NOT NULL UNIQUE,              -- URL-safe, e.g. 'acme-ltd' or a generated user-{id}
  name                   text NOT NULL,                      -- display name
  owner_user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  plan                   text NOT NULL DEFAULT 'trialing',   -- mirrors prior users.plan
  subscription_status    text NOT NULL DEFAULT 'trialing',
  stripe_customer_id     text UNIQUE,                        -- NEW, previously not stored
  stripe_subscription_id text UNIQUE,                        -- moved from users
  billing_interval       text NOT NULL DEFAULT 'month',      -- moved from users
  trial_ends_at          timestamptz,                        -- moved from users
  lifetime_purchased_at  timestamptz,                        -- moved from users
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX organizations_owner_user_id_idx ON public.organizations(owner_user_id);
CREATE INDEX organizations_stripe_customer_id_idx ON public.organizations(stripe_customer_id);
CREATE INDEX organizations_subscription_status_idx ON public.organizations(subscription_status);
```

### 4.2 `organization_members`

Many-to-many: users ↔ orgs. One row per user-in-org relationship.

```sql
CREATE TABLE public.organization_members (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'member'
                   CHECK (role IN ('owner','admin','member','viewer')),
  invited_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at      timestamptz,
  accepted_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX organization_members_user_id_idx ON public.organization_members(user_id);
CREATE INDEX organization_members_role_idx ON public.organization_members(organization_id, role);
```

### 4.3 `organization_invitations`

Pending invites (accepted → becomes a member row).

```sql
CREATE TABLE public.organization_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email           text NOT NULL,
  role            text NOT NULL DEFAULT 'member'
                   CHECK (role IN ('admin','member','viewer')),
  invited_by      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token           text NOT NULL UNIQUE,                     -- opaque, 32+ chars
  expires_at      timestamptz NOT NULL,
  accepted_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)                            -- one pending invite per email per org
);

CREATE INDEX organization_invitations_token_idx ON public.organization_invitations(token);
CREATE INDEX organization_invitations_email_idx ON public.organization_invitations(email);
```

### 4.4 Active org in session

Two paths, use both:

**Path A: cookie** — `pv_active_org_id` httpOnly cookie set when user logs in (first org by joined_at ASC) or when they switch orgs.

**Path B: JWT claim** — Supabase Auth hook (`organization_ids: string[]` + `active_organization_id: string`) populated on token refresh. Enables RLS policies that use `(auth.jwt() -> 'active_organization_id')::uuid` without a db round-trip.

We implement Path A first (simpler), migrate to Path B for performance once stable.

### 4.5 Adding `organization_id` to scoped tables

Per the audit, 28 tables carry `user_id` today. Each gets `organization_id` added:

```sql
ALTER TABLE public.{table}
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
CREATE INDEX {table}_organization_id_idx ON public.{table}(organization_id);
CREATE INDEX {table}_org_user_idx ON public.{table}(organization_id, user_id);
```

`user_id` **stays** — re-roled as `created_by_user_id` (attribution inside an org). Don't drop it; multi-user orgs need "who made this change".

Full list (28 tables):

```
user_profiles, email_sends, deletion_requests, referral_codes, referrals,
user_credits, nps_responses, cancel_surveys, listing_health,
listings, listing_channel_groups, listing_channel_aspects, listing_channels,
channels, transactions, agent_pending_actions, sync_failures, sync_jobs,
feed_rules, usage_reports, supplier, metrics_daily,
si_posts, si_engagements, si_ads, si_comments, si_hook_patterns, si_insights, si_jobs, si_watchlist
```

Marketing tables (`marketing_pages`, `marketing_sections`, `marketing_section_types`) are **not** scoped — marketing is global.

## 5. RLS policy templates

### 5.1 Helper function (installed once, reused by every policy)

```sql
CREATE OR REPLACE FUNCTION public.is_org_member(org uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = org
      AND m.user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated, anon;
```

### 5.2 Template for scoped tables

Per table, replace `auth.uid() = user_id` policies with:

```sql
-- SELECT: any member of the owning org
DROP POLICY IF EXISTS "{table}_select_own" ON public.{table};
CREATE POLICY "{table}_org_select"
  ON public.{table}
  FOR SELECT
  USING (public.is_org_member(organization_id));

-- INSERT: member must set their own org_id on write
DROP POLICY IF EXISTS "{table}_insert_own" ON public.{table};
CREATE POLICY "{table}_org_insert"
  ON public.{table}
  FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

-- UPDATE: can only update rows in your org + you can't change org_id via update
CREATE POLICY "{table}_org_update"
  ON public.{table}
  FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

-- DELETE: typically owner/admin only. Check via role lookup.
CREATE POLICY "{table}_org_delete"
  ON public.{table}
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = public.{table}.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','admin')
    )
  );
```

### 5.3 Scoping the `organizations` table itself

```sql
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- SELECT: members can see their own orgs
CREATE POLICY "organizations_members_select"
  ON public.organizations
  FOR SELECT
  USING (public.is_org_member(id));

-- INSERT: authenticated users can create orgs (self-serve signup path)
CREATE POLICY "organizations_authenticated_insert"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

-- UPDATE: owner or admin only
CREATE POLICY "organizations_admin_update"
  ON public.organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','admin')
    )
  );

-- DELETE: owner only
CREATE POLICY "organizations_owner_delete"
  ON public.organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
    )
  );
```

## 6. Backfill plan

### 6.1 Create one personal org per existing user

```sql
-- Run as service role. Idempotent via ON CONFLICT.
INSERT INTO public.organizations (id, slug, name, owner_user_id, plan, subscription_status, stripe_subscription_id, billing_interval, trial_ends_at, lifetime_purchased_at, stripe_customer_id)
SELECT
  gen_random_uuid(),
  'u-' || substr(u.id::text, 1, 8),                       -- temporary slug, user can rename later
  COALESCE(p.business_name, p.full_name, u.email, 'Personal workspace'),
  u.id,
  COALESCE(u.plan, 'trialing'),
  COALESCE(u.subscription_status, 'trialing'),
  u.stripe_subscription_id,
  COALESCE(u.billing_interval, 'month'),
  u.trial_ends_at,
  u.lifetime_purchased_at,
  NULL                                                     -- stripe_customer_id backfilled from Stripe sync
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.user_id = u.id
ON CONFLICT (owner_user_id) DO NOTHING;                    -- (add partial unique index first)
```

Create a partial unique constraint before backfill to enforce one-personal-org-per-user:

```sql
CREATE UNIQUE INDEX organizations_one_personal_per_owner
  ON public.organizations(owner_user_id)
  WHERE slug LIKE 'u-%';
```

### 6.2 Create member rows for each personal-org owner

```sql
INSERT INTO public.organization_members (organization_id, user_id, role, accepted_at)
SELECT o.id, o.owner_user_id, 'owner', now()
FROM public.organizations o
ON CONFLICT (organization_id, user_id) DO NOTHING;
```

### 6.3 Backfill `organization_id` on each scoped table

For each of the 28 tables, run:

```sql
-- Template — parameterize {table}
UPDATE public.{table} t
SET organization_id = o.id
FROM public.organizations o
WHERE t.user_id = o.owner_user_id
  AND t.organization_id IS NULL;
```

After backfill, verify no nulls remain:

```sql
SELECT '{table}' AS table_name, count(*) AS null_count
FROM public.{table}
WHERE organization_id IS NULL;
-- Expect 0 for every table before proceeding to Stage B.
```

Then make `organization_id NOT NULL`:

```sql
ALTER TABLE public.{table} ALTER COLUMN organization_id SET NOT NULL;
```

### 6.4 Backfill Stripe `customer_id` from live Stripe data

```typescript
// Script: scripts/backfill-stripe-customers.ts
// Run once, post-backfill, before enabling org-scoped Stripe webhooks.

import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/app/lib/supabase-admin'

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-20.acacia' })
  const sb = getSupabaseAdmin()

  const { data: orgs } = await sb
    .from('organizations')
    .select('id, stripe_subscription_id')
    .is('stripe_customer_id', null)
    .not('stripe_subscription_id', 'is', null)

  for (const org of orgs ?? []) {
    const sub = await stripe.subscriptions.retrieve(org.stripe_subscription_id!)
    await sb.from('organizations').update({ stripe_customer_id: sub.customer as string }).eq('id', org.id)
  }
}
main().catch(console.error)
```

## 7. Migration strategy — 4 stages

### Stage A — Schema + backfill (reversible)

**Duration:** 2–3 days. Production-safe.

- Create `organizations`, `organization_members`, `organization_invitations`
- Create `is_org_member` function
- ALTER each of the 28 scoped tables: ADD `organization_id uuid` (nullable initially)
- Run backfill in a single transaction per table (wrap with savepoints)
- Verify zero nulls
- ALTER each scoped column to `NOT NULL`

**Rollback:** DROP new tables + DROP new columns. Zero write-path changes yet.

**Exit criteria:**
- All 28 tables have non-null `organization_id` on every row
- Every active user has exactly one personal org
- `SELECT count(*) FROM public.organization_members` equals active user count
- No writes to new columns from app code yet (app is blind to new columns)

### Stage B — Add org-scoped RLS alongside existing (dual-enforcement)

**Duration:** 3–5 days. Production-safe.

- Add `is_org_member` helper (idempotent with `CREATE OR REPLACE`)
- For each table, **add** org-scoped policies alongside existing user-scoped ones
- Leave user-scoped policies in place as a belt-and-braces layer
- Both must pass for any SELECT/INSERT/UPDATE/DELETE to succeed

Because the backfill makes the two conditions equivalent for all rows, this passes cleanly. The invariant:

> For any row reachable via the user-scoped policy, the org-scoped policy also passes (since `organization_id = user's personal org`).

**Exit criteria:**
- Integration test suite: for every scoped table, an authenticated user can select/insert/update/delete their row under BOTH policies.
- A "cross-org" test fails correctly — user A cannot see user B's data.

**Rollback:** DROP the new policies. Zero app behaviour change.

### Stage C — Update app code (request-scoped org context)

**Duration:** 7–12 days. The biggest stage. Staged by surface area.

**C.1 Helpers (1 day)**

```typescript
// app/lib/org/context.ts
import { cookies } from 'next/headers'
import { createClient } from '@/app/lib/supabase-server'
import { cache } from 'react'

export const getActiveOrg = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get('pv_active_org_id')?.value

  // Verify cookie's org is one the user belongs to
  if (cookieOrgId) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', cookieOrgId)
      .maybeSingle()
    if (membership) return { id: cookieOrgId, user }
  }

  // Fallback: first org by creation
  const { data: first } = await supabase
    .from('organization_members')
    .select('organization_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return first ? { id: first.organization_id, user } : null
})

export async function requireActiveOrg() {
  const ctx = await getActiveOrg()
  if (!ctx) throw new Error('ORG_CONTEXT_MISSING')
  return ctx
}
```

**C.2 API routes (3–5 days)**

For each of the ~79 user-scoped routes:

```typescript
// BEFORE
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const { data } = await supabase.from('listings').select('*').eq('user_id', user.id)

// AFTER
const ctx = await getActiveOrg()
if (!ctx) return NextResponse.json({ error: 'No organization' }, { status: 401 })
// No explicit filter needed — RLS handles it
const { data } = await supabase.from('listings').select('*')
// ...on insert:
.insert({ ...payload, organization_id: ctx.id, user_id: ctx.user.id })
```

Ordering: start with read routes (safer), move to writes, finish with admin + cron.

**C.3 Cron + service-role routes (2–3 days)**

These bypass RLS. They must filter explicitly:

```typescript
// BEFORE (single-tenant cron)
const { data: users } = await admin.from('users').select('id, stripe_subscription_id')
for (const u of users) { /* do stuff */ }

// AFTER (multi-tenant cron)
const { data: orgs } = await admin.from('organizations').select('id, stripe_subscription_id')
for (const org of orgs) { /* do stuff per org */ }
```

Every cron route gets an org loop. Every service-role read adds `.eq('organization_id', orgId)`.

**C.4 UI pages (2–3 days)**

- Dashboard pages: most use `supabase.auth.getUser()` to scope — they'll automatically work once RLS is org-scoped because the user's sessions see only their org's rows via the policy
- Add org switcher in `AppSidebar` (top utility bar in the Phase 2 Base.com layout)
- Invite flow page at `/settings/team`

**Exit criteria:**
- Every API route + page uses `getActiveOrg()` or equivalent
- No remaining `.eq('user_id', user.id)` filters in app code (except `user_profiles`, `nps_responses`, `deletion_requests` — user-scoped by design)
- Integration tests green
- Manual QA: create 2 orgs for one user, switch between them, verify zero data bleed

### Stage D — Remove user-scoped RLS (irreversible)

**Duration:** 1 day.

**Prerequisite:** 7 consecutive days of production traffic with Stage B+C in place and zero RLS failures in Sentry.

- Drop old user-scoped RLS policies from every scoped table
- Keep `user_id` column as `created_by_user_id` for audit

**Rollback:** Recreate the policies. Data model unchanged.

**After Stage D:** the only enforcement is org-scoped. RLS is the source of truth.

## 8. Stripe billing migration

Existing state lives on `public.users` (`plan`, `subscription_status`, `stripe_subscription_id`, `billing_interval`, `trial_ends_at`, `lifetime_purchased_at`).

**New state:** same columns on `public.organizations`. User-level columns become read-only / deprecated.

### 8.1 Webhook handler update

```typescript
// app/api/stripe/webhook/route.ts
// BEFORE: event.data.object.customer → user.stripe_customer_id (never stored) → update users
// AFTER:  event.data.object.customer → organizations.stripe_customer_id → update orgs

async function findOrgByStripeCustomer(stripeCustomerId: string) {
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle()
  return data?.id ?? null
}
```

### 8.2 Checkout session metadata

Every Stripe Checkout session launched from the app includes `metadata.organization_id`:

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  // ...existing config
  metadata: { organization_id: ctx.id },
  subscription_data: { metadata: { organization_id: ctx.id } },
})
```

On `checkout.session.completed`, pull `metadata.organization_id` and update the right org.

### 8.3 Transition plan for existing paying customers

For the ~N currently-paying users (pull from Stripe):
1. Backfill script pairs their user's personal-org with their Stripe customer (via subscription lookup)
2. After successful pairing, update `organizations` with all Stripe state
3. Drop Stripe columns from `users` (Stage D equivalent, optional)

## 9. Testing strategy

### 9.1 RLS integration tests (blocking gate for Stage D)

One test file per scoped table under `tests/rls/`:

```typescript
// tests/rls/listings.rls.test.ts
describe('listings RLS', () => {
  it('user A cannot see user B org listings', async () => {
    const { orgA, userA, orgB, userB } = await setupTwoOrgs()
    await insertListing({ as: userA, org: orgA, title: 'A\'s listing' })
    const { data } = await supabaseAs(userB).from('listings').select('*')
    expect(data).toHaveLength(0) // userB in orgB sees zero of orgA's listings
  })

  it('user in both orgs sees both sets', async () => { /* ... */ })
  it('user cannot insert into org they are not member of', async () => { /* ... */ })
  it('user cannot change organization_id of a row via UPDATE', async () => { /* ... */ })
})
```

### 9.2 API route smoke tests

For every API route listed in the audit (~79): a test asserting it returns only the calling user's org data.

### 9.3 End-to-end Playwright test

- User signs up → personal org auto-created
- User creates a listing → listing is org-scoped
- User invites a teammate → teammate accepts → both see the listing
- Owner removes teammate → teammate loses access
- Owner creates second org → switches → sees zero data from first org
- Owner switches back → first org's data visible again

### 9.4 Cross-org leak scanner (runs daily in CI)

Post-Stage C, a cron job that asserts:

```sql
-- Returns 0 rows if RLS is clean
SELECT table_name, count(*) AS leaks
FROM (
  SELECT 'listings' AS table_name, id FROM public.listings WHERE organization_id NOT IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = user_id
  )
  UNION ALL
  -- repeat for every scoped table
) leaks
GROUP BY table_name
HAVING count(*) > 0;
```

Alert on any non-zero row.

## 10. Rollback procedures

| Stage | What can roll back | How |
|---|---|---|
| A | Everything | DROP new tables + new columns |
| B | New policies | DROP new policies, user-scoped ones still active |
| C (per-route) | Revert individual route | Git revert, redeploy |
| C (full stage) | The app-code layer | Keep Stage B policies in place, revert Stage C commits |
| D | **Cannot roll back** without re-creating old policies | Only proceed after 7 days clean monitoring |

## 11. Sprint breakdown

### Week 1 — Stage A: Schema + backfill

- Day 1: write and review Stage A migration SQL
- Day 2: apply to staging, run backfill, verify
- Day 3: run backfill in production during low-traffic window, monitor
- Days 4–5: integration tests for organizations + members + invites

### Week 2 — Stage B: RLS policies

- Day 1: add `is_org_member` helper + test
- Days 2–3: add org-scoped policies for all 28 tables, one migration per table
- Day 4: RLS integration tests (one file per table)
- Day 5: cross-org leak scanner in CI

### Week 3 — Stage C: App code (part 1)

- Day 1: `getActiveOrg` + `requireActiveOrg` helpers
- Days 2–3: convert all user-scoped API routes (batched by surface: listings, orders, channels, etc.)
- Day 4: convert admin + cron routes with explicit org-scoping
- Day 5: org switcher UI + invite flow backend

### Week 4 — Stage C part 2 + Stage D

- Days 1–2: finish UI conversion, run E2E
- Day 3: Stripe billing webhook update + checkout metadata
- Days 4–5: production deploy, 7-day monitoring window

### Week 5 (buffer) — Stage D execution

- Drop user-scoped policies after clean monitoring
- Post-mortem doc, update `CLAUDE.md` + memory

## 12. Observability during migration

Add temp tables that the leak scanner feeds:

```sql
CREATE TABLE public.rls_migration_audit (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   text NOT NULL,
  row_id       text NOT NULL,
  issue        text NOT NULL,                   -- 'null_org_id' | 'mismatched_org_user' | 'rls_leak'
  detected_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz
);
```

Stage B ongoing job inserts a row any time an invariant fails. Dashboard at `/admin/rls-audit` shows all active issues. Zero rows for 7 days = green light for Stage D.

## 13. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| RLS policy bug lets user A read user B's data | Cross-org leak | Dual-enforcement in Stage B — old policy still runs. Leak scanner catches divergence. |
| Backfill misses a table | Queries fail with NOT NULL constraint violation | Inventory is exhaustive; Stage A verification step counts nulls per table |
| Stripe webhook maps subscription to wrong org | Billing state diverges | `metadata.organization_id` on checkout is source of truth; webhook cross-references `stripe_customer_id` |
| Cron job updates rows under wrong tenant | Data corruption | Every service-role query explicitly filters by `organization_id`; code review checklist |
| App code assumes one org per user (legacy pattern) | Subtle bugs after a user joins a second org | E2E test specifically invites a user to a second org and verifies switching behaviour |
| Large table UPDATEs in backfill lock prod | Downtime | Backfill in batches of 10,000 rows with `ON CONFLICT DO NOTHING`; run during low-traffic window |

## 14. Post-Stage D cleanup (later, optional)

- Rename `user_id` → `created_by_user_id` on scoped tables (makes intent clear for readers)
- Drop Stripe columns from `users` table
- Publish an org-level audit log viewer
- Consider row-level encryption for tenant data (regulatory hedge)

## 15. Open questions to resolve before Stage A

Three decisions need your input before I write the first migration SQL file:

1. **Personal-org naming.** Default is `u-{first-8-of-user-id}`. Want a friendlier default like `{first_name}'s workspace` (requires profile data — imperfect for some users)?

2. **Existing admin roles.** The `/admin/*` routes use `isAdminEmail()` today. Do we keep that as a superadmin layer ABOVE org membership, or migrate admins to an `organization_members` row in a dedicated palvento-internal org?

3. **Invite flow email.** Do we send invite emails via Resend (already integrated) or gate invite links behind a copy-paste token for this phase?

Recommended answers (my defaults if you don't steer otherwise):
- (1) `u-{first-8}` now; rename UI in Phase 5
- (2) Keep `isAdminEmail()` superadmin as-is — separate from tenant model
- (3) Copy-paste tokens only for Phase 1; email automation in Phase 5

## 16. Next actions

Once this spec is approved:

1. I write `supabase/migrations/phase1_stage_a_multitenancy.sql` — org tables + helper fn + column additions
2. You review + test in staging
3. I write `supabase/migrations/phase1_stage_a_backfill.sql` — backfill SQL
4. Execute in production during a low-traffic window (2–3 hour window)
5. Proceed to Stage B

No code yet. The above is the contract. Review and flag anything missing before execution.
