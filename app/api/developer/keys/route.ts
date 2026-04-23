import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireActiveOrg } from '@/app/lib/org/context'

// /api/developer/keys — authenticated user manages their own public API keys.
// Storage scheme (matches /api/developer):
//   raw_key   = 32 random bytes, hex-encoded (64 chars)
//   key_prefix = first 8 chars of raw_key
//   key_hash  = sha256(raw_key) hex
// Plaintext is returned ONCE on creation; only the hash is persisted.
// api_keys is org-scoped (Stage A.1).

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// GET — list current user's keys (no plaintext).
export async function GET() {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, last_used_at, expires_at, active, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ api_keys: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST — create a new key, return plaintext once.
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'API Key'
    const expiresAt = typeof body.expires_at === 'string' ? body.expires_at : null
    const scopes = Array.isArray(body.scopes) ? body.scopes : ['read']

    const rawKey    = crypto.randomBytes(32).toString('hex')
    const keyPrefix = rawKey.slice(0, 8)
    const keyHash   = crypto.createHash('sha256').update(rawKey).digest('hex')

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        organization_id: ctx.id,
        user_id:         ctx.user.id,
        name,
        key_hash:        keyHash,
        key_prefix:      keyPrefix,
        scopes,
        expires_at:      expiresAt,
      })
      .select('id, name, key_prefix, scopes, active, expires_at, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ api_key: data, raw_key: rawKey })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE — revoke a key the caller owns (soft: active=false).
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const url = new URL(request.url)
    let id = url.searchParams.get('id')
    if (!id) {
      const body = await request.json().catch(() => ({} as Record<string, unknown>))
      if (typeof body.id === 'string') id = body.id
    }
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase
      .from('api_keys')
      .update({ active: false })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
