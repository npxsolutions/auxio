# Audit trail — engineering pattern

*Standard SOC 2 Type II evidence. Every privileged write to an entity owned by a customer — admin or user-initiated — lands in `public.audit_log` with actor, timestamp, before/after diff, and request context.*

## Helper

`app/lib/audit.ts` exports two functions:

- `logAudit(supabase, opts)` — explicit, for anywhere.
- `logAuditFromRequest(supabase, request, user, opts)` — extracts IP address + request ID from a Next.js `Request`; use this in API routes.

The admin-side wrapper `app/admin/_lib/audit.ts`'s `logAdmin()` now delegates to `logAudit` under the hood, so all existing admin code continues to work unchanged.

## Canonical usage in an API route

```ts
import { logAuditFromRequest } from '@/app/lib/audit'

export async function PATCH(request: Request, { params }) {
  // ...auth + snapshot before
  const { data: before } = await supabase.from('listings').select('*').eq('id', id).single()

  const { data, error } = await supabase.from('listings').update(patch).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logAuditFromRequest(supabase, request, user, {
    action:      'listing.update',
    resource:    'listings',
    resourceId:  id,
    before:      before ?? null,
    after:       data as unknown as Record<string, unknown>,
  })

  return NextResponse.json({ listing: data })
}
```

## Action naming

Use dot-delimited names: `<resource>.<verb>`. Examples:

| Resource | Verbs | Examples |
|---|---|---|
| `listings` | `create`, `update`, `delete`, `push`, `pull` | `listing.update`, `listing.push` |
| `channels` | `connect`, `disconnect`, `sync`, `test` | `channel.connect` |
| `feed_rules` | `create`, `update`, `delete`, `toggle` | `feed_rule.update` |
| `billing` | `subscribe`, `upgrade`, `downgrade`, `cancel` | `billing.upgrade` |
| `enrichment` | `request`, `accept`, `reject` | `enrichment.request` |
| `admin.*` | anything — admin mutations get an `admin.` prefix | `admin.partner.update` |

The resource string is the table name (e.g. `listings`, `channels`, `feed_rules`) so cross-referencing audit rows against the data tables is trivial.

## What to log / not log

**Do log:**
- Any row-level write (update, delete) on a customer-owned table
- Any config change (channel credentials, feed rules, pricing rules, billing plan)
- Admin actions on customer data
- Impersonation events (when admin views a customer context)
- Bulk operations — one audit row per batch with count in metadata, not one per row

**Don't log:**
- Read-only queries (GETs)
- Ephemeral job state (queue enqueues, sync heartbeats) — those go in dedicated job tables
- Feature-flag evaluations

## Don't block on the log

Every call is fire-and-forget (`void logAuditFromRequest(...)` or `await` then ignore failure). The helper already swallows errors and logs them to stdout for Sentry capture. A failed audit write must never cause the primary mutation to fail — PE auditors understand this, and SOC 2 controls handle it via Sentry alerting on the log-failure rate.

## Current instrumentation status

As of 2026-04-21:

| Endpoint | Status | Notes |
|---|---|---|
| `app/api/listings/[id]/route.ts` PATCH | ✅ Sample | First instrumented user-side endpoint |
| `app/api/listings/[id]/route.ts` DELETE | ✅ Sample | Before-snapshot included |
| `app/admin/_lib/audit.ts` callers | ✅ Done | Admin mutations — delegates to logAudit |
| All other listing / channel / feed-rule mutations | 📋 TODO | Roll out using the pattern above |

The TODO items can be instrumented incrementally. Priority order:

1. `app/api/listings/import/route.ts` — bulk listing create
2. `app/api/*/connect/route.ts` — channel OAuth completions (11 channels)
3. `app/api/feed-rules/**` — feed-rule mutations
4. `app/api/billing/**` — subscription state changes
5. `app/api/channels/[id]/disconnect/route.ts` — needs creating (disconnect is currently a client-side Supabase call from `app/channels/page.tsx`, which bypasses the audit layer)

Item 5 is the most important long-term — client-side mutations with RLS are harder to audit than server-enforced writes.

## Related

- `app/lib/audit.ts` — implementation
- `app/admin/_lib/audit.ts` — admin wrapper
- `docs/strategy/10-item-audit-2026-04-21.md` — why this work exists (item 5 of the PE-readiness audit)
- `app/security/page.tsx` — SOC 2 Type II attestation window is open; these audit rows are the evidence
