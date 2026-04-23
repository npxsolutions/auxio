/**
 * Developer API — manages `api_keys` and `webhooks`. Org-scoped (Stage A.1).
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireActiveOrg } from '@/app/lib/org/context'

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// GET — list API keys + webhooks
export async function GET() {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const [keysRes, hooksRes] = await Promise.all([
      supabase.from('api_keys').select('id, name, key_prefix, scopes, active, last_used_at, expires_at, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('webhooks').select('*')
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({ api_keys: keysRes.data || [], webhooks: hooksRes.data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create API key OR webhook
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const body = await request.json()

    if (body.type === 'api_key') {
      const rawKey    = `palvento_${crypto.randomBytes(32).toString('hex')}`
      const keyPrefix = rawKey.slice(0, 14) + '...'
      const keyHash   = crypto.createHash('sha256').update(rawKey).digest('hex')

      const { data, error } = await supabase.from('api_keys').insert({
        organization_id: ctx.id,
        user_id:         ctx.user.id,
        name:            body.name || 'API Key',
        key_hash:        keyHash,
        key_prefix:      keyPrefix,
        scopes:          body.scopes || ['read'],
        expires_at:      body.expires_at || null,
      }).select('id, name, key_prefix, scopes, active, expires_at, created_at').single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ api_key: data, raw_key: rawKey })
    }

    if (body.type === 'webhook') {
      const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`
      const { data, error } = await supabase.from('webhooks').insert({
        organization_id: ctx.id,
        user_id:         ctx.user.id,
        url:             body.url,
        events:          body.events || [],
        secret,
      }).select().single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ webhook: data })
    }

    return NextResponse.json({ error: 'type must be api_key or webhook' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH — toggle active / update webhook events
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const { id, type, ...updates } = await request.json()
    if (!id || !type) return NextResponse.json({ error: 'id and type required' }, { status: 400 })

    const table = type === 'api_key' ? 'api_keys' : 'webhooks'
    const { data, error } = await supabase.from(table)
      .update(updates).eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ record: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — revoke key or delete webhook
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const { id, type } = await request.json()
    const table = type === 'api_key' ? 'api_keys' : 'webhooks'
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
