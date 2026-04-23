/**
 * Organisation context — single source of truth for "which org is the caller
 * acting in" during a server-side request.
 *
 * Resolution order:
 *   1. Cookie `pv_active_org_id` (user selected an org via the switcher)
 *   2. First org the user belongs to, ordered by created_at ASC (their personal org)
 *   3. null (user has no orgs — shouldn't happen after Stage A backfill)
 *
 * All resolution is validated against `organization_members` — a stale cookie
 * pointing at an org the user no longer belongs to falls through to #2.
 *
 * `React.cache()` memoises across one request so the db is hit at most once.
 */

import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/app/lib/supabase-server'

export const ACTIVE_ORG_COOKIE = 'pv_active_org_id'

export type OrgContext = {
  /** The active organization's id. */
  id: string
  /** The authenticated user. Full row from auth.getUser(). */
  user: {
    id: string
    email?: string | null
  }
  /** The caller's role in this org: owner | admin | member | viewer. */
  role: 'owner' | 'admin' | 'member' | 'viewer'
}

/**
 * Resolve the active organisation for the current session. Returns null if the
 * user is not authenticated or has no memberships.
 *
 * Cached per-request via React.cache, so repeated calls within one render or
 * handler are free.
 */
export const getActiveOrg = cache(async (): Promise<OrgContext | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value

  // Try cookie first — validate membership
  if (cookieOrgId) {
    const { data: m } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', cookieOrgId)
      .maybeSingle()

    if (m) {
      return {
        id: m.organization_id,
        user: { id: user.id, email: user.email },
        role: m.role as OrgContext['role'],
      }
    }
  }

  // Fallback — first org by membership created_at
  const { data: first } = await supabase
    .from('organization_members')
    .select('organization_id, role, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!first) return null

  return {
    id: first.organization_id,
    user: { id: user.id, email: user.email },
    role: first.role as OrgContext['role'],
  }
})

/**
 * Return the active org or throw. For use at the top of API routes where a
 * missing org is an unrecoverable 401.
 *
 * Catches the "unauthenticated" case (no user) separately so callers can
 * distinguish. Default behaviour: return null gets mapped to Unauthorized at
 * the route layer.
 */
export async function requireActiveOrg(): Promise<OrgContext> {
  const ctx = await getActiveOrg()
  if (!ctx) {
    const err = new Error('ORG_CONTEXT_MISSING')
    ;(err as Error & { status?: number }).status = 401
    throw err
  }
  return ctx
}

/**
 * Return all orgs the current user belongs to, newest-first. Used to populate
 * the org switcher.
 */
export async function listUserOrgs(): Promise<
  Array<{ id: string; name: string; slug: string; role: OrgContext['role'] }>
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('organization_members')
    .select(
      `
      role,
      created_at,
      organizations:organization_id (id, name, slug)
    `,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!data) return []

  type Row = {
    role: OrgContext['role']
    organizations: { id: string; name: string; slug: string } | null
  }
  return (data as unknown as Row[])
    .filter((r) => r.organizations)
    .map((r) => ({
      id: r.organizations!.id,
      name: r.organizations!.name,
      slug: r.organizations!.slug,
      role: r.role,
    }))
}

/**
 * Write the active-org cookie. Call from a Server Action after the user selects
 * a different org in the switcher. The next request picks up the new value.
 *
 * The cookie is httpOnly + sameSite=lax + 1 year lifetime — tolerant of normal
 * session flows, invalidated by re-validation on each request.
 */
export async function setActiveOrgCookie(orgId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
}

/**
 * Clear the active-org cookie. Server Action companion to sign-out flows.
 */
export async function clearActiveOrgCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_ORG_COOKIE)
}
