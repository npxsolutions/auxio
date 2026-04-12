import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Enrich with PO stats
    const { data: poStats } = await supabase
      .from('purchase_orders')
      .select('supplier_id, total_cost, status')
      .eq('user_id', user.id)

    const stats: Record<string, { totalSpend: number; openPos: number }> = {}
    for (const po of poStats || []) {
      if (!po.supplier_id) continue
      if (!stats[po.supplier_id]) stats[po.supplier_id] = { totalSpend: 0, openPos: 0 }
      stats[po.supplier_id].totalSpend += Number(po.total_cost || 0)
      if (!['received', 'cancelled'].includes(po.status)) stats[po.supplier_id].openPos++
    }

    return NextResponse.json({
      suppliers: (data || []).map(s => ({ ...s, ...( stats[s.id] || { totalSpend: 0, openPos: 0 }) }))
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { data, error } = await supabase
      .from('suppliers')
      .insert({ user_id: user.id, ...body })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ supplier: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('suppliers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', user.id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ supplier: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    const { error } = await supabase.from('suppliers').delete().eq('id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
