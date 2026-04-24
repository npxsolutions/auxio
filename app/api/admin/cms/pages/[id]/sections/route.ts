/**
 * Admin CMS — sections for a page.
 *
 * POST   /api/admin/cms/pages/[id]/sections  { type, props? }       → append
 * PATCH  /api/admin/cms/pages/[id]/sections  { order: string[] }    → bulk reorder
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isOwner } from '@/app/admin/_lib/owner'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

async function gate() {
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user || !isOwner(user.email, user.id)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await gate()
  if ('error' in g) return g.error
  const { id: pageId } = await params

  const { type, props } = await request.json()
  if (!type?.trim()) return NextResponse.json({ error: 'type required' }, { status: 400 })

  const admin = getAdmin()

  // Next position = max(position) + 1
  const { data: last } = await admin
    .from('marketing_sections')
    .select('position')
    .eq('page_id', pageId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPos = ((last?.position as number | undefined) ?? 0) + 1

  const { data, error } = await admin
    .from('marketing_sections')
    .insert({ page_id: pageId, type, position: nextPos, props: props ?? {} })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ section: data })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await gate()
  if ('error' in g) return g.error
  const { id: pageId } = await params

  const { order } = await request.json() as { order: string[] }
  if (!Array.isArray(order)) return NextResponse.json({ error: 'order array required' }, { status: 400 })

  const admin = getAdmin()

  // UNIQUE(page_id, position) forces a two-pass update: first move everything
  // to negative offsets to clear the uniqueness check, then assign final positions.
  for (let i = 0; i < order.length; i++) {
    const { error } = await admin
      .from('marketing_sections')
      .update({ position: -(i + 1) })
      .eq('id', order[i])
      .eq('page_id', pageId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  for (let i = 0; i < order.length; i++) {
    const { error } = await admin
      .from('marketing_sections')
      .update({ position: i + 1 })
      .eq('id', order[i])
      .eq('page_id', pageId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, reordered: order.length })
}
