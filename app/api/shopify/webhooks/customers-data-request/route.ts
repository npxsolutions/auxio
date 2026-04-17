import { NextResponse } from 'next/server'
import { verifyShopifyHmac } from '../_verify'

// Shopify GDPR: a customer requested to see what data you hold about them.
// Palvento stores order/transaction data but no personal PII beyond what
// Shopify provides. Acknowledge receipt — Shopify requires a 200 response.
export async function POST(request: Request) {
  const rawBody = await request.text()
  const hmac = request.headers.get('x-shopify-hmac-sha256')

  if (!verifyShopifyHmac(rawBody, hmac)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  console.log(`Shopify GDPR data request — shop: ${payload.shop_domain}, customer: ${payload.customer?.id}`)

  // No action required: we don't store personal customer data independently.
  // Orders are keyed by shop + order ID, not by customer identity.
  return NextResponse.json({ ok: true })
}
