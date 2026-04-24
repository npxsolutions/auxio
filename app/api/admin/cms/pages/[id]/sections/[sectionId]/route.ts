/**
 * Admin CMS — single-section CRUD (props editor).
 *
 * PATCH  /api/admin/cms/pages/[id]/sections/[sectionId] { type?, props? }
 * DELETE /api/admin/cms/pages/[id]/sections/[sectionId]
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const g = await gate()
  if ('error' in g) return g.error
  const { id: pageId, sectionId } = await params

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (typeof body.type === 'string') updates.type = body.type
  if (body.props !== undefined) updates.props = body.props
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'no update fields' }, { status: 400 })
  }

  const { data, error } = await getAdmin()
    .from('marketing_sections')
    .update(updates)
    .eq('id', sectionId)
    .eq('page_id', pageId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ section: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const g = await gate()
  if ('error' in g) return g.error
  const { id: pageId, sectionId } = await params

  const { error } = await getAdmin()
    .from('marketing_sections')
    .delete()
    .eq('id', sectionId)
    .eq('page_id', pageId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
