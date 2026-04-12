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

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const poId = request.nextUrl.searchParams.get('id')

    if (poId) {
      const [poRes, itemsRes] = await Promise.all([
        supabase.from('purchase_orders').select('*, suppliers(name, email, lead_time_days)')
          .eq('id', poId).eq('user_id', user.id).single(),
        supabase.from('purchase_order_items').select('*')
          .eq('po_id', poId).eq('user_id', user.id).order('id'),
      ])
      if (poRes.error) return NextResponse.json({ error: poRes.error.message }, { status: 500 })
      return NextResponse.json({ po: poRes.data, items: itemsRes.data || [] })
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ purchase_orders: data || [] })
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
    const { items, ...poData } = body

    // Generate PO number
    const { count } = await supabase.from('purchase_orders')
      .select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const poNumber = `PO-${String((count || 0) + 1).padStart(4, '0')}`

    // Calculate totals
    const subtotal = (items || []).reduce((s: number, i: any) =>
      s + (Number(i.quantity_ordered || 0) * Number(i.unit_cost || 0)), 0)
    const total_cost = subtotal + Number(poData.shipping_cost || 0)

    const { data: po, error } = await supabase
      .from('purchase_orders')
      .insert({ user_id: user.id, po_number: poNumber, subtotal, total_cost, ...poData })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (items?.length) {
      const inserts = items.map((i: any) => ({
        po_id: po.id,
        user_id: user.id,
        sku: i.sku,
        description: i.description,
        quantity_ordered: Number(i.quantity_ordered || 1),
        quantity_received: 0,
        unit_cost: Number(i.unit_cost || 0),
        line_total: Number(i.quantity_ordered || 1) * Number(i.unit_cost || 0),
      }))
      await supabase.from('purchase_order_items').insert(inserts)
    }

    return NextResponse.json({ po })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, items, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Recalculate totals if items provided
    if (items) {
      const subtotal = items.reduce((s: number, i: any) =>
        s + (Number(i.quantity_ordered || 0) * Number(i.unit_cost || 0)), 0)
      updates.subtotal = subtotal
      updates.total_cost = subtotal + Number(updates.shipping_cost || 0)
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', user.id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ po: data })
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
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
