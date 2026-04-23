// [api/billing/switch-annual] — migrate a monthly subscriber to the annual
// price for their current plan. Idempotent: if the org is already on an
// annual interval we no-op.

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { requireActiveOrg } from '@/app/lib/org/context'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

const ANNUAL_PRICE: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER_ANNUAL,
  growth:  process.env.STRIPE_PRICE_GROWTH_ANNUAL,
  scale:   process.env.STRIPE_PRICE_SCALE_ANNUAL,
}

export async function POST() {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = getAdmin()
  const { data: org } = await admin
    .from('organizations')
    .select('plan, billing_interval, stripe_customer_id, stripe_subscription_id')
    .eq('id', ctx.id)
    .maybeSingle()

  if (!org?.stripe_customer_id)      return NextResponse.json({ error: 'no stripe customer on file' }, { status: 400 })
  if (org.billing_interval === 'year') return NextResponse.json({ ok: true, already: true })

  const plan = (org.plan || '').toLowerCase()
  const priceId = ANNUAL_PRICE[plan]
  if (!priceId) return NextResponse.json({ error: `No annual price configured for plan: ${plan}` }, { status: 400 })

  const stripe = getStripe()

  try {
    const newSub = await stripe.subscriptions.create({
      customer: org.stripe_customer_id as string,
      items: [{ price: priceId, quantity: 1 }],
      metadata: {
        organization_id: ctx.id,
        supabase_user_id: ctx.user.id,
        plan,
        switched_from: (org.stripe_subscription_id as string) || '',
      },
    }, {
      idempotencyKey: `annual-switch-${ctx.id}-${plan}`,
    })

    if (org.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(org.stripe_subscription_id as string, { invoice_now: false, prorate: true })
      } catch (cancelErr: any) {
        console.error('[api/billing/switch-annual:POST] cancel old failed', cancelErr.message)
      }
    }

    await admin.from('organizations').update({
      billing_interval: 'year',
      stripe_subscription_id: newSub.id,
      updated_at: new Date().toISOString(),
    }).eq('id', ctx.id)

    return NextResponse.json({ ok: true, subscription_id: newSub.id })
  } catch (err: any) {
    console.error('[api/billing/switch-annual:POST] failed', err)
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 })
  }
}
