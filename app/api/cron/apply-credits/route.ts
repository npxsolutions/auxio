// [api/cron/apply-credits] — daily sweep: apply unapplied credits to Stripe customer balances.
//
// TODO Stage C.4: move stripe_customer_id + credits from `users`/`user_credits`
// to `organizations`/org_credits. Today service-role bypasses RLS so user-scoped
// reads still work; billing rewrite will restructure.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(request: Request) {
  // Vercel cron auth — accept either the internal cron header or CRON_SECRET.
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null
  if (expected && authHeader !== expected && !request.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = getSupabase()
  const stripe = getStripe()

  const { data: credits, error } = await db
    .from('user_credits')
    .select('id, user_id, amount_cents, source, source_ref')
    .eq('applied', false)
    .limit(500)

  if (error) {
    console.error('[api/cron/apply-credits:GET] select failed', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let applied = 0
  let skipped = 0
  const failures: Array<{ id: string; err: string }> = []

  for (const c of (credits || [])) {
    try {
      // Credits belong to the user's personal org (billing unit).
      const { data: org } = await db
        .from('organizations')
        .select('stripe_customer_id')
        .eq('owner_user_id', c.user_id)
        .like('slug', 'u-%')
        .maybeSingle()
      const customerId = org?.stripe_customer_id
      if (!customerId) { skipped++; continue }

      await stripe.customers.createBalanceTransaction(customerId, {
        amount: -Math.abs(c.amount_cents), // negative = credit
        currency: 'usd',
        description: `Palvento credit (${c.source})`,
        metadata: { credit_id: c.id, source: c.source, source_ref: c.source_ref || '' },
      })

      await db.from('user_credits').update({ applied: true }).eq('id', c.id).eq('applied', false)

      if (c.source === 'referral' && c.source_ref) {
        await db.from('referrals').update({ status: 'credited' }).eq('id', c.source_ref).eq('status', 'paid')
      }
      applied++
    } catch (err: any) {
      console.error('[api/cron/apply-credits:GET] apply failed for', c.id, err)
      failures.push({ id: c.id, err: err.message || String(err) })
    }
  }

  return NextResponse.json({ applied, skipped, failures, total: credits?.length || 0 })
}
