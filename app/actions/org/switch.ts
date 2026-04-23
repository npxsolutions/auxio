'use server'

/**
 * Server action — switch the active organization.
 *
 * Validates that the signed-in user is a member of the target org, writes the
 * `pv_active_org_id` cookie, and revalidates the root layout so every server
 * component re-reads with the new context.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/app/lib/supabase-server'
import { setActiveOrgCookie } from '@/app/lib/org/context'

export type SwitchOrgResult =
  | { ok: true; organizationId: string }
  | { ok: false; error: string }

export async function switchOrganization(orgId: string): Promise<SwitchOrgResult> {
  if (!orgId || typeof orgId !== 'string') {
    return { ok: false, error: 'Invalid organization id' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  // Confirm membership before setting cookie.
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!membership) {
    return { ok: false, error: 'Not a member of that organization' }
  }

  await setActiveOrgCookie(orgId)
  revalidatePath('/', 'layout')

  return { ok: true, organizationId: orgId }
}
