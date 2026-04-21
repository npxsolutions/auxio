import type { SupabaseClient } from '@supabase/supabase-js'
import { logAudit } from '@/app/lib/audit'

// Admin-specific wrapper around the generic logAudit writer in app/lib/audit.ts.
// Kept for backward compat with existing admin routes that import { logAdmin }.
// New code (admin or user-side) should call logAudit directly — it handles both.
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
  return logAudit(admin, {
    actorId:     opts.actorId,
    actorEmail:  opts.actorEmail ?? null,
    action:      opts.action,
    resource:    opts.resource,
    resourceId:  opts.resourceId,
    before:      opts.before,
    after:       opts.after,
  })
}
