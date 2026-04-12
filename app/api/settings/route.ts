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

    const { data: settings } = await supabase
      .from('users')
      .select('plan, min_margin, max_acos, safety_stock_days, email_alerts, default_cogs_pct, ebay_fee_pct, shopify_fee_pct, default_shipping_cost, agent_mode')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ settings: { ...settings, email: user.email, id: user.id } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const allowed = ['min_margin', 'max_acos', 'safety_stock_days', 'email_alerts', 'default_cogs_pct', 'ebay_fee_pct', 'shopify_fee_pct', 'default_shipping_cost', 'agent_mode']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ settings: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
