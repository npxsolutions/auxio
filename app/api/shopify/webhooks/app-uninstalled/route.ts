import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyShopifyHmac } from '../_verify'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: Request) {
  const rawBody = await request.text()
  const hmac = request.headers.get('x-shopify-hmac-sha256')

  if (!verifyShopifyHmac(rawBody, hmac)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { myshopify_domain } = JSON.parse(rawBody)
  if (!myshopify_domain) return NextResponse.json({ ok: true })

  // Deactivate the channel — keep historical data
  await getSupabase()
    .from('channels')
    .update({ active: false })
    .eq('shop_domain', myshopify_domain)
    .eq('type', 'shopify')

  console.log(`Shopify app uninstalled: ${myshopify_domain}`)
  return NextResponse.json({ ok: true })
}
