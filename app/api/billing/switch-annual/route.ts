// [api/billing/switch-annual] — migrate a monthly subscriber to the annual
// price for their current plan. Idempotent: if the user is already on an
// annual interval we no-op.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

const ANNUAL_PRICE: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER_ANNUAL,
  growth:  process.env.STRIPE_PRICE_GROWTH_ANNUAL,
  scale:   process.env.STRIPE_PRICE_SCALE_ANNUAL,
}

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: row } = await supabase
    .from('users')
    .select('plan, billing_interval, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!row?.stripe_customer_id)      return NextResponse.json({ error: 'no stripe customer on file' }, { status: 400 })
  if (row.billing_interval === 'year') return NextResponse.json({ ok: true, already: true })

  const plan = (row.plan || '').toLowerCase()
  const priceId = ANNUAL_PRICE[plan]
  if (!priceId) return NextResponse.json({ error: `No annual price configured for plan: ${plan}` }, { status: 400 })

  const stripe = getStripe()

  try {
    // Create the new annual subscription first, then cancel the old one.
    // Proration is handled implicitly — old sub is cancelled; user keeps the
    // unused time as a customer balance which applies to the next invoice.
    const newSub = await stripe.subscriptions.create({
      customer: row.stripe_customer_id,
      items: [{ price: priceId, quantity: 1 }],
      metadata: { supabase_user_id: user.id, plan, switched_from: row.stripe_subscription_id || '' },
    }, {
      idempotencyKey: `annual-switch-${user.id}-${plan}`,
    })

    if (row.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(row.stripe_subscription_id, { invoice_now: false, prorate: true })
      } catch (cancelErr: any) {
        // Not fatal — log and continue. The new sub is already created.
        console.error('[api/billing/switch-annual:POST] cancel old failed', cancelErr.message)
      }
    }

    await supabase.from('users').upsert({
      id: user.id,
      billing_interval: 'year',
      stripe_subscription_id: newSub.id,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, subscription_id: newSub.id })
  } catch (err: any) {
    console.error('[api/billing/switch-annual:POST] failed', err)
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 })
  }
}
