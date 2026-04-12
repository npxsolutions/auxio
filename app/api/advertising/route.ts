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
      .from('ad_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const campaigns = (data || []).map(c => ({
      ...c,
      roas:     c.spend > 0 ? Math.round((c.revenue / c.spend) * 100) / 100 : 0,
      ctr:      c.impressions > 0 ? Math.round((c.clicks / c.impressions) * 10000) / 100 : 0,
      cvr:      c.clicks > 0 ? Math.round((c.ad_orders / c.clicks) * 10000) / 100 : 0,
      over_acos: c.acos !== null && c.target_acos !== null && c.acos > c.target_acos,
    }))

    const totalSpend   = campaigns.reduce((s, c) => s + Number(c.spend  || 0), 0)
    const totalRevenue = campaigns.reduce((s, c) => s + Number(c.revenue || 0), 0)
    const totalOrders  = campaigns.reduce((s, c) => s + Number(c.ad_orders || 0), 0)

    return NextResponse.json({
      campaigns,
      summary: {
        totalSpend:   Math.round(totalSpend   * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        blendedAcos:  totalRevenue > 0 ? Math.round((totalSpend / totalRevenue) * 10000) / 100 : 0,
        blendedRoas:  totalSpend   > 0 ? Math.round((totalRevenue / totalSpend) * 100)   / 100 : 0,
      },
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
      .from('ad_campaigns')
      .insert({ user_id: user.id, ...body })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ campaign: data })
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

    if (updates.spend !== undefined && updates.revenue !== undefined) {
      updates.acos = updates.revenue > 0
        ? Math.round((updates.spend / updates.revenue) * 10000) / 100
        : null
    }

    const { data, error } = await supabase
      .from('ad_campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', user.id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ campaign: data })
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
    const { error } = await supabase.from('ad_campaigns').delete().eq('id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
