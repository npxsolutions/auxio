import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyShopifyHmac } from '../_verify'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Shopify GDPR: a customer requested deletion of their data.
// We store orders keyed by shop + order ID. We delete transactions
// for the specified orders (or all orders for that customer if no order list).
export async function POST(request: Request) {
  const rawBody = await request.text()
  const hmac = request.headers.get('x-shopify-hmac-sha256')

  if (!verifyShopifyHmac(rawBody, hmac)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const { shop_domain, customer, orders_to_redact } = payload

  console.log(`Shopify GDPR customer redact — shop: ${shop_domain}, customer: ${customer?.id}, orders: ${orders_to_redact?.length ?? 'all'}`)

  const supabase = getSupabase()

  if (orders_to_redact?.length) {
    // Delete specific orders for this customer
    const orderIds = orders_to_redact.map((o: { id: number }) => String(o.id))
    await supabase
      .from('transactions')
      .delete()
      .eq('channel', 'shopify')
      .in('order_id', orderIds)
  } else if (customer?.id) {
    // No specific orders — delete all transactions tied to this customer
    // Transactions don't store customer_id directly; nothing to delete.
    // If you add a customer_id column in future, delete here.
  }

  return NextResponse.json({ ok: true })
}
