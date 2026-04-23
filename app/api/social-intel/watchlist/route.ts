import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })
}

const ALLOWED_PLATFORMS = new Set(['tiktok', 'instagram', 'youtube', 'facebook_ads'])

export async function GET() {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('si_watchlist')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[social-intel:watchlist:GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ watchlist: data ?? [] })
}

export async function POST(request: Request) {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await getSupabase()

  let body: {
    keyword?: string
    platforms?: string[]
    frequency_minutes?: number
    max_items?: number
    active?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const keyword = body.keyword?.trim()
  if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const platforms = (body.platforms?.length ? body.platforms : ['tiktok', 'instagram', 'youtube'])
    .filter(p => ALLOWED_PLATFORMS.has(p))
  if (!platforms.length) {
    return NextResponse.json({ error: 'at least one valid platform required' }, { status: 400 })
  }

  const frequency_minutes = Math.max(15, Math.min(60 * 24 * 30, Number(body.frequency_minutes) || 1440))
  const max_items         = Math.max(1, Math.min(500, Number(body.max_items) || 50))
  const active            = body.active ?? true

  const { data, error } = await supabase
    .from('si_watchlist')
    .upsert(
      {
        organization_id: ctx.id,
        user_id: ctx.user.id,
        keyword,
        platforms,
        frequency_minutes,
        max_items,
        active,
      },
      { onConflict: 'user_id,keyword' },
    )
    .select('*')
    .single()

  if (error) {
    console.error('[social-intel:watchlist:POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ watch: data })
}

export async function DELETE(request: Request) {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await getSupabase()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('si_watchlist')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[social-intel:watchlist:DELETE]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
