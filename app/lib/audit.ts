import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generic audit-log writer. Every privileged write (admin mutation,
 * user-initiated listing / channel / feed-rule / billing change) should
 * call this to produce a row in `public.audit_log` suitable for SOC 2
 * Type 2 attestation and PE-diligence review.
 *
 * Swallows errors (logging only) so a failed audit write never blocks
 * the primary mutation. Failed writes go to stdout for Sentry capture.
 *
 * For the admin-side wrapper, see `app/admin/_lib/audit.ts` which
 * re-exports this with a pre-tagged `action` prefix.
 */
export async function logAudit(
  supabase: SupabaseClient,
  opts: {
    actorId: string
    actorEmail?: string | null
    action: string           // e.g. 'listing.update', 'channel.connect', 'admin.partner.update'
    resource: string         // table name — e.g. 'listings', 'channels'
    resourceId: string       // row id
    before?: Record<string, unknown> | null
    after?: Record<string, unknown> | null
    ipAddress?: string | null
    requestId?: string | null
    metadata?: Record<string, unknown> | null
  },
): Promise<void> {
  try {
    const { error } = await supabase.from('audit_log').insert({
      user_id: opts.actorId,
      action: opts.action,
      resource: opts.resource,
      resource_id: opts.resourceId,
      metadata: {
        actor_email: opts.actorEmail ?? null,
        ip_address: opts.ipAddress ?? null,
        request_id: opts.requestId ?? null,
        before: opts.before ?? null,
        after: opts.after ?? null,
        ...(opts.metadata ?? {}),
      },
    })
    if (error) console.warn('[audit]', opts.action, 'failed:', error.message)
  } catch (e) {
    console.warn('[audit]', opts.action, 'threw:', (e as Error).message)
  }
}

/**
 * Convenience: extract actor + request context from a Next.js Request
 * and a Supabase user. Wraps logAudit with defaults.
 */
export async function logAuditFromRequest(
  supabase: SupabaseClient,
  request: Request,
  user: { id: string; email?: string | null },
  opts: Omit<Parameters<typeof logAudit>[1], 'actorId' | 'actorEmail' | 'ipAddress' | 'requestId'>,
): Promise<void> {
  const headers = request.headers
  const ipAddress =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    null
  const requestId = headers.get('x-request-id') ?? null
  return logAudit(supabase, { ...opts, actorId: user.id, actorEmail: user.email, ipAddress, requestId })
}
