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

// GET — list all listings with cost data
export async function GET() {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('channel_listings')
      .select('id, title, sku, price, cost_price, category, status')
      .order('title', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ listings: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH — update cost_price for one or many listings
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const body = await request.json()

    // Single update: { id, cost_price }
    if (body.id) {
      const { data, error } = await supabase
        .from('channel_listings')
        .update({ cost_price: body.cost_price, updated_at: new Date().toISOString() })
        .eq('id', body.id)
        .select('id, cost_price')
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ listing: data })
    }

    // Bulk update: { updates: [{ id, cost_price }, ...] }
    if (Array.isArray(body.updates)) {
      const results = await Promise.allSettled(
        body.updates.map(({ id, cost_price }: { id: string; cost_price: number }) =>
          supabase
            .from('channel_listings')
            .update({ cost_price, updated_at: new Date().toISOString() })
            .eq('id', id)
        )
      )
      const failed = results.filter(r => r.status === 'rejected').length
      return NextResponse.json({ updated: results.length - failed, failed })
    }

    // Apply default COGS % to all listings without a cost_price
    if (body.apply_default_pct) {
      const pct = body.apply_default_pct / 100
      const { data: listings } = await supabase
        .from('channel_listings')
        .select('id, price')
        .is('cost_price', null)

      if (listings && listings.length > 0) {
        const updates = listings.map(l => ({
          id: l.id,
          cost_price: parseFloat((l.price * pct).toFixed(2)),
        }))
        await Promise.all(
          updates.map(u =>
            supabase.from('channel_listings').update({ cost_price: u.cost_price }).eq('id', u.id)
          )
        )
        return NextResponse.json({ applied: updates.length })
      }
      return NextResponse.json({ applied: 0 })
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
