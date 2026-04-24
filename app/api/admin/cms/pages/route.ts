/**
 * Admin CMS — page CRUD.
 *
 * GET    /api/admin/cms/pages                → list all pages (any status)
 * POST   /api/admin/cms/pages { slug, title } → create a new draft page
 *
 * Owner-only. Service-role client so we can write drafts (public RLS only
 * exposes published).
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
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isOwner(user.email, user.id)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user }
}

export async function GET() {
  const g = await gate()
  if ('error' in g) return g.error

  const { data, error } = await getAdmin()
    .from('marketing_pages')
    .select('id, slug, title, description, status, published_at, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withCounts = await Promise.all(
    (data ?? []).map(async (p) => {
      const { count } = await getAdmin()
        .from('marketing_sections')
        .select('id', { count: 'exact', head: true })
        .eq('page_id', p.id)
      return { ...p, section_count: count ?? 0 }
    }),
  )

  return NextResponse.json({ pages: withCounts })
}

export async function POST(request: NextRequest) {
  const g = await gate()
  if ('error' in g) return g.error

  const { slug, title, description } = await request.json()
  if (!slug?.trim() || !title?.trim()) {
    return NextResponse.json({ error: 'slug and title required' }, { status: 400 })
  }

  const { data, error } = await getAdmin()
    .from('marketing_pages')
    .insert({
      slug: slug.trim(),
      title: title.trim(),
      description: description?.trim() || null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    if ((error as any).code === '23505') {
      return NextResponse.json({ error: 'A page with that slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ page: data })
}
