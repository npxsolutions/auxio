/**
 * Purchase orders API. Org-scoped (Stage A.1).
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

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const poId = request.nextUrl.searchParams.get('id')

    if (poId) {
      const [poRes, itemsRes] = await Promise.all([
        supabase.from('purchase_orders').select('*, suppliers(name, email, lead_time_days)')
          .eq('id', poId).single(),
        supabase.from('purchase_order_items').select('*')
          .eq('po_id', poId).order('id'),
      ])
      if (poRes.error) return NextResponse.json({ error: poRes.error.message }, { status: 500 })
      return NextResponse.json({ po: poRes.data, items: itemsRes.data || [] })
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name)')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ purchase_orders: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const body = await request.json()
    const { items, ...poData } = body

    // Generate PO number (RLS scopes to the caller's org).
    const { count } = await supabase.from('purchase_orders')
      .select('*', { count: 'exact', head: true })
    const poNumber = `PO-${String((count || 0) + 1).padStart(4, '0')}`

    // Calculate totals
    const subtotal = (items || []).reduce((s: number, i: any) =>
      s + (Number(i.quantity_ordered || 0) * Number(i.unit_cost || 0)), 0)
    const total_cost = subtotal + Number(poData.shipping_cost || 0)

    const { data: po, error } = await supabase
      .from('purchase_orders')
      .insert({
        organization_id: ctx.id,
        user_id: ctx.user.id,
        po_number: poNumber,
        subtotal,
        total_cost,
        ...poData,
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (items?.length) {
      const inserts = items.map((i: any) => ({
        po_id: po.id,
        organization_id: ctx.id,
        user_id: ctx.user.id,
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
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
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
      .eq('id', id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ po: data })
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
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
