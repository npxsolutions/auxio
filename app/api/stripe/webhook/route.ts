import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Service-role client — webhooks run outside user session
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const PLAN_BY_PRICE: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER    || 'price_starter']:    'starter',
  [process.env.STRIPE_PRICE_GROWTH     || 'price_growth']:     'growth',
  [process.env.STRIPE_PRICE_SCALE      || 'price_scale']:      'scale',
  [process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise']: 'enterprise',
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId  = session.metadata?.supabase_user_id
        const plan    = session.metadata?.plan
        if (!userId) break

        await supabase.from('users').upsert({
          id: userId,
          plan,
          stripe_customer_id: session.customer as string,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id
        if (!userId) break

        const priceId = sub.items.data[0]?.price.id
        const plan    = PLAN_BY_PRICE[priceId] || 'growth'

        await supabase.from('users').upsert({
          id: userId,
          plan,
          subscription_status: sub.status,
          updated_at: new Date().toISOString(),
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id
        if (!userId) break

        await supabase.from('users').upsert({
          id: userId,
          plan: 'free',
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subRef = invoice.parent?.subscription_details?.subscription
        const sub = typeof subRef === 'string'
          ? await getStripe().subscriptions.retrieve(subRef)
          : subRef as Stripe.Subscription | null
        const userId = sub?.metadata?.supabase_user_id
        if (userId) {
          await supabase.from('users').upsert({
            id: userId,
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
