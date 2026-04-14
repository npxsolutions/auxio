// [api/billing/lifetime-checkout] — start a one-time Stripe Checkout for the
// Lifetime Scale offer. Successful completion is observed in the webhook,
// which sets users.plan='lifetime_scale' and billing_interval='lifetime'.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const priceId = process.env.STRIPE_PRICE_LIFETIME_SCALE
  if (!priceId) return NextResponse.json({ error: 'lifetime price not configured' }, { status: 400 })

  const { data: row } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  const stripe = getStripe()

  let customerId = row?.stripe_customer_id as string | undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('users').upsert({ id: user.id, stripe_customer_id: customerId })
  }

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://auxio-lkqv.vercel.app'

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?lifetime=success`,
      cancel_url:  `${origin}/billing?lifetime=cancelled`,
      metadata: { supabase_user_id: user.id, offer: 'lifetime_scale' },
    })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[api/billing/lifetime-checkout:POST] failed', err)
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 })
  }
}
