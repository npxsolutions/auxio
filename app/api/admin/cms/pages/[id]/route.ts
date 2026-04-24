/**
 * Admin CMS — single-page CRUD.
 *
 * GET    /api/admin/cms/pages/[id]  → page + sections
 * PATCH  /api/admin/cms/pages/[id]  → update title/description/status/slug
 * DELETE /api/admin/cms/pages/[id]  → cascade-deletes sections
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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await gate()
  if ('error' in g) return g.error
  const { id } = await params

  const admin = getAdmin()
  const [pageRes, sectionsRes] = await Promise.all([
    admin.from('marketing_pages').select('*').eq('id', id).single(),
    admin.from('marketing_sections').select('*').eq('page_id', id).order('position'),
  ])

  if (pageRes.error) return NextResponse.json({ error: pageRes.error.message }, { status: 500 })
  return NextResponse.json({ page: pageRes.data, sections: sectionsRes.data ?? [] })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await gate()
  if ('error' in g) return g.error
  const { id } = await params

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string')       updates.title = body.title
  if (typeof body.description === 'string' || body.description === null) updates.description = body.description
  if (typeof body.slug === 'string')        updates.slug = body.slug
  if (typeof body.og_image_url === 'string' || body.og_image_url === null) updates.og_image_url = body.og_image_url
  if (body.status === 'draft' || body.status === 'published') {
    updates.status = body.status
    if (body.status === 'published') updates.published_at = new Date().toISOString()
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No update fields' }, { status: 400 })
  }

  const { data, error } = await getAdmin()
    .from('marketing_pages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if ((error as any).code === '23505') {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ page: data })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await gate()
  if ('error' in g) return g.error
  const { id } = await params

  const { error } = await getAdmin().from('marketing_pages').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
