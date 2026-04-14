import type { SupabaseClient } from '@supabase/supabase-js'

// Writes a row into public.audit_log describing an admin mutation.
// Swallows errors (logging only) so a failed audit write never blocks the primary update.
export async function logAdmin(
  admin: SupabaseClient,
  opts: {
    actorId: string
    actorEmail: string | null | undefined
    action: string          // e.g. 'admin.partners.update'
    resource: string        // e.g. 'partner_applications'
    resourceId: string
    before: Record<string, unknown>
    after: Record<string, unknown>
  },
) {
  try {
    const { error } = await admin.from('audit_log').insert({
      user_id: opts.actorId,
      action: opts.action,
      resource: opts.resource,
      resource_id: opts.resourceId,
      metadata: {
        actor_email: opts.actorEmail ?? null,
        before: opts.before,
        after: opts.after,
      },
    })
    if (error) console.warn('[admin:audit] failed', error.message)
  } catch (e) {
    console.warn('[admin:audit] threw', (e as Error).message)
  }
}
