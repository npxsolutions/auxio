import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyShopifyHmac } from '../_verify'

// Must run on Node.js runtime (Edge has no crypto.createHmac).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Shopify GDPR: 48 hours after app uninstall, Shopify requests full data deletion.
// Delete all data associated with the shop: channels, transactions, listings.
export async function POST(request: Request) {
  const rawBody = await request.text()
  const hmac = request.headers.get('x-shopify-hmac-sha256')

  if (!verifyShopifyHmac(rawBody, hmac)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { shop_domain } = JSON.parse(rawBody)
  if (!shop_domain) return NextResponse.json({ ok: true })

  console.log(`Shopify GDPR shop redact — deleting all data for: ${shop_domain}`)

  const supabase = getSupabase()

  // Find the channel for this shop to get the organization_id
  const { data: channel } = await supabase
    .from('channels')
    .select('id, user_id, organization_id')
    .eq('shop_domain', shop_domain)
    .eq('type', 'shopify')
    .single()

  if (channel) {
    const orgId = channel.organization_id as string

    // Delete all Shopify transactions for this org (safer — only this org's data
    // even if the user owns multiple orgs)
    await supabase
      .from('transactions')
      .delete()
      .eq('organization_id', orgId)
      .eq('channel', 'shopify')

    // Delete the channel record itself
    await supabase
      .from('channels')
      .delete()
      .eq('id', channel.id)
  }

  return NextResponse.json({ ok: true })
}
