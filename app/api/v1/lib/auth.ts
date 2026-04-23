import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export type AuthResult =
  | { user: null; error: NextResponse; supabase?: undefined; source?: undefined; userId?: undefined }
  | { user: { id: string }; userId: string; source: 'jwt' | 'api_key'; error: null; supabase: SupabaseClient }

export type AuthWithOrgResult =
  | { user: null; error: NextResponse; supabase?: undefined; source?: undefined; userId?: undefined; organizationId?: undefined }
  | {
      user: { id: string }
      userId: string
      organizationId: string
      source: 'jwt' | 'api_key'
      error: null
      supabase: SupabaseClient
    }

// Validate Bearer token and return the authenticated user.
// Tries Supabase JWT first (cheap), then falls back to public.api_keys lookup.
// Returns { user, userId, source, error, supabase } — if error is set, return the error response immediately.
export async function requireApiAuth(request: NextRequest): Promise<AuthResult> {
  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Missing Authorization header. Use: Authorization: Bearer <token>' },
        { status: 401 }
      ),
    }
  }

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // 1) Try as a Supabase JWT first.
  const jwtClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error: jwtError } = await jwtClient.auth.getUser(token)
  if (user && !jwtError) {
    return { user, userId: user.id, source: 'jwt', error: null, supabase: jwtClient }
  }

  // 2) Fall back to api_keys table (hash-match).
  // Storage scheme (see app/api/developer/route.ts): sha256(raw_token) hex-encoded.
  const keyHash = crypto.createHash('sha256').update(token).digest('hex')

  // Use service role if available to bypass RLS for key lookup; otherwise anon.
  const adminKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    supabaseAnon
  const adminClient = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: keyRow, error: keyError } = await adminClient
    .from('api_keys')
    .select('id, user_id, active, expires_at')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (keyError || !keyRow) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
    }
  }

  if (keyRow.active === false) {
    return {
      user: null,
      error: NextResponse.json({ error: 'API key revoked' }, { status: 401 }),
    }
  }
  if (keyRow.expires_at && new Date(keyRow.expires_at).getTime() <= Date.now()) {
    return {
      user: null,
      error: NextResponse.json({ error: 'API key expired' }, { status: 401 }),
    }
  }

  // Fire-and-forget last_used_at bump — do not block request.
  void adminClient
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(({ error }) => {
      if (error) console.error('[v1/auth] last_used_at bump failed:', error.message)
    })

  return {
    user: { id: keyRow.user_id },
    userId: keyRow.user_id,
    source: 'api_key',
    error: null,
    supabase: adminClient,
  }
}

/**
 * Like `requireApiAuth`, but also resolves the caller's active organization.
 *
 * Resolution strategy:
 *   1. If `X-Organization-Id` header is set AND the user is a member, use it.
 *   2. Otherwise default to the user's owned org (most callers only have one).
 *
 * Today `api_keys` does not carry an `organization_id` column — Stage A.1
 * follow-up. When that column lands, prefer the key's bound org over the
 * header.
 *
 * Callers MUST filter scoped queries by `organizationId` explicitly because
 * the resolved client is service-role (RLS bypassed) for the api_key path.
 */
export async function requireApiAuthWithOrg(request: NextRequest): Promise<AuthWithOrgResult> {
  const base = await requireApiAuth(request)
  if (base.error) {
    return { user: null, error: base.error }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const adminKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    supabaseAnon
  const adminClient = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const headerOrg = request.headers.get('x-organization-id')

  if (headerOrg) {
    const { data: membership } = await adminClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', base.userId)
      .eq('organization_id', headerOrg)
      .maybeSingle()
    if (!membership) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Not a member of the requested organization' },
          { status: 403 }
        ),
      }
    }
    return {
      user: base.user,
      userId: base.userId,
      organizationId: membership.organization_id as string,
      source: base.source,
      error: null,
      supabase: adminClient,
    }
  }

  // No header — pick owner org (typically the user's personal org).
  const { data: owned } = await adminClient
    .from('organization_members')
    .select('organization_id, role, joined_at')
    .eq('user_id', base.userId)
    .eq('role', 'owner')
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!owned) {
    return {
      user: null,
      error: NextResponse.json({ error: 'No organization membership' }, { status: 403 }),
    }
  }

  return {
    user: base.user,
    userId: base.userId,
    organizationId: owned.organization_id as string,
    source: base.source,
    error: null,
    supabase: adminClient,
  }
}
