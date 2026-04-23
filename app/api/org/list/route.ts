/**
 * GET /api/org/list — returns the caller's orgs + the currently active one
 * along with its billing state. Powers the org switcher, plan badge, trial
 * banner, annual upsell, and lifetime offer on the sidebar / top of app.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getActiveOrg, listUserOrgs } from '@/app/lib/org/context'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export async function GET() {
  try {
    const [active, orgs] = await Promise.all([getActiveOrg(), listUserOrgs()])

    let billing: {
      plan: string | null
      subscription_status: string | null
      billing_interval: string | null
      trial_ends_at: string | null
      lifetime_purchased_at: string | null
      stripe_customer_id: string | null
    } | null = null

    if (active) {
      const { data } = await getAdmin()
        .from('organizations')
        .select('plan, subscription_status, billing_interval, trial_ends_at, lifetime_purchased_at, stripe_customer_id')
        .eq('id', active.id)
        .maybeSingle()
      billing = data ?? null
    }

    return NextResponse.json({
      orgs,
      activeOrgId: active?.id ?? null,
      billing,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
