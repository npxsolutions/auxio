import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { requireActiveOrg } from '@/app/lib/org/context'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Service role for reading/writing org billing columns — bypasses RLS.
const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

const PRICE_IDS: Record<string, string> = {
  starter:    process.env.STRIPE_PRICE_STARTER    || '',
  growth:     process.env.STRIPE_PRICE_GROWTH     || '',
  scale:      process.env.STRIPE_PRICE_SCALE      || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
}

export async function POST(request: Request) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await request.json()
    const priceId = PRICE_IDS[plan]
    if (!priceId) return NextResponse.json({ error: `No price ID configured for plan: ${plan}` }, { status: 400 })

    const admin = getAdmin()

    // Resolve the org's Stripe customer — creating one if this is the first checkout.
    const { data: org } = await admin
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', ctx.id)
      .single()

    let customerId = org?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: ctx.user.email ?? undefined,
        metadata: {
          organization_id: ctx.id,
          supabase_user_id: ctx.user.id, // transition-period compat
        },
      })
      customerId = customer.id
      await admin
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', ctx.id)
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://palvento-lkqv.vercel.app'

    // Referred-friend discount: if user has a pending referral, apply the coupon.
    // NOTE: referrals stays user-scoped (Stage A.1 follow-up).
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined
    try {
      const { data: pendingRef } = await admin
        .from('referrals')
        .select('id, status, discount_applied')
        .eq('referred_user_id', ctx.user.id)
        .in('status', ['pending', 'signed_up'])
        .maybeSingle()
      if (pendingRef && !pendingRef.discount_applied) {
        const couponId = process.env.STRIPE_COUPON_REFERRED_FRIEND || 'REFERRED_FRIEND_10'
        discounts = [{ coupon: couponId }]
        await admin.from('referrals').update({ discount_applied: couponId }).eq('id', pendingRef.id)
      }
    } catch (err) {
      console.error('[api/stripe/checkout:POST] referral discount lookup failed', err)
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?success=true`,
      cancel_url:  `${origin}/billing?cancelled=true`,
      metadata: {
        organization_id: ctx.id,
        supabase_user_id: ctx.user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          organization_id: ctx.id,
          supabase_user_id: ctx.user.id,
          plan,
        },
      },
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
