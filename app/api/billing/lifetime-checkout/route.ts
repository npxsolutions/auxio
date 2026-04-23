// [api/billing/lifetime-checkout] — start a one-time Stripe Checkout for the
// Lifetime Scale offer. Successful completion is observed in the webhook,
// which sets org.plan='lifetime_scale' and billing_interval='lifetime'.

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { requireActiveOrg } from '@/app/lib/org/context'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export async function POST(request: Request) {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const priceId = process.env.STRIPE_PRICE_LIFETIME_SCALE
  if (!priceId) return NextResponse.json({ error: 'lifetime price not configured' }, { status: 400 })

  const admin = getAdmin()
  const { data: org } = await admin
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', ctx.id)
    .maybeSingle()

  const stripe = getStripe()

  let customerId = org?.stripe_customer_id as string | undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.user.email ?? undefined,
      metadata: {
        organization_id: ctx.id,
        supabase_user_id: ctx.user.id,
      },
    })
    customerId = customer.id
    await admin
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', ctx.id)
  }

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://palvento-lkqv.vercel.app'

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?lifetime=success`,
      cancel_url:  `${origin}/billing?lifetime=cancelled`,
      metadata: {
        organization_id: ctx.id,
        supabase_user_id: ctx.user.id,
        offer: 'lifetime_scale',
      },
    })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[api/billing/lifetime-checkout:POST] failed', err)
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 })
  }
}
