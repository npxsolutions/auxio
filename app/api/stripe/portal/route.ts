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
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: org } = await getAdmin()
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', ctx.id)
      .single()

    if (!org?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found for this organization. Subscribe to a plan first.' },
        { status: 400 },
      )
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://palvento-lkqv.vercel.app'

    const session = await getStripe().billingPortal.sessions.create({
      customer: org.stripe_customer_id as string,
      return_url: `${origin}/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
