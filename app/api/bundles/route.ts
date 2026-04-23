/**
 * Bundles API. Org-scoped (Stage A.1).
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

export async function GET() {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()

    const [bundlesRes, itemsRes] = await Promise.all([
      supabase.from('bundles').select('*').order('created_at', { ascending: false }),
      supabase.from('bundle_items').select('*'),
    ])

    const bundles = (bundlesRes.data || []).map(b => ({
      ...b,
      items: (itemsRes.data || []).filter(i => i.bundle_id === b.id),
      total_cost: (itemsRes.data || [])
        .filter(i => i.bundle_id === b.id)
        .reduce((s, i) => s + Number(i.quantity || 1) * Number(i.unit_cost || 0), 0),
    }))

    return NextResponse.json({ bundles })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()

    const { items, ...bundleData } = await request.json()

    const { data: bundle, error } = await supabase
      .from('bundles')
      .insert({ organization_id: ctx.id, user_id: ctx.user.id, ...bundleData })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (items?.length) {
      await supabase.from('bundle_items').insert(
        items.map((i: any) => ({
          ...i,
          bundle_id: bundle.id,
          organization_id: ctx.id,
          user_id: ctx.user.id,
        }))
      )
    }

    return NextResponse.json({ bundle })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()

    const { id, items, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('bundles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (items) {
      await supabase.from('bundle_items').delete().eq('bundle_id', id)
      if (items.length) {
        await supabase.from('bundle_items').insert(
          items.map((i: any) => ({
            ...i,
            bundle_id: id,
            organization_id: ctx.id,
            user_id: ctx.user.id,
          }))
        )
      }
    }

    return NextResponse.json({ bundle: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()

    const { id } = await request.json()
    const { error } = await supabase.from('bundles').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
