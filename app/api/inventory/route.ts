/**
 * Inventory API. Org-scoped (Stage A.1).
 *
 * Uses service role (`getAdmin`) so RLS doesn't apply — explicit
 * organization_id filter is mandatory on every query.
 */
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET() {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getAdmin()
    .from('inventory')
    .select('*')
    .eq('organization_id', ctx.id)
    .order('title', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inventory: data })
}

export async function POST(request: Request) {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const items = Array.isArray(body) ? body : [body]

  const rows = items.map((item: any) => ({
    organization_id:   ctx.id,
    user_id:           ctx.user.id,
    sku:               item.sku,
    title:             item.title,
    stock_qty:         item.stock_qty ?? 0,
    lead_time_days:    item.lead_time_days ?? 14,
    safety_stock_days: item.safety_stock_days ?? 14,
    channel:           item.channel || null,
    cost_price:        item.cost_price ?? null,
    updated_at:        new Date().toISOString(),
  }))

  const { data, error } = await getAdmin()
    .from('inventory')
    .upsert(rows, { onConflict: 'user_id,sku' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inserted: data?.length })
}

export async function PATCH(request: Request) {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await getAdmin()
    .from('inventory')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', ctx.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
