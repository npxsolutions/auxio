import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Test eBay token validity with a lightweight API call
async function testEbayToken(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.ebay.com/sell/inventory/v1/inventory_item?limit=1', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.status !== 401
  } catch {
    return false
  }
}

// Test Shopify token validity
async function testShopifyToken(shopDomain: string, accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    })
    return res.ok
  } catch {
    return false
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: channels } = await getAdmin()
      .from('channels')
      .select('id, type, access_token, shop_domain, last_synced_at')
      .eq('user_id', user.id)
      .eq('active', true)

    const results: Record<string, { valid: boolean; stale: boolean; lastSync: string | null }> = {}

    await Promise.all((channels || []).map(async (ch) => {
      let valid = true

      if (ch.type === 'ebay' && ch.access_token) {
        valid = await testEbayToken(ch.access_token)
      } else if (ch.type === 'shopify' && ch.shop_domain && ch.access_token) {
        valid = await testShopifyToken(ch.shop_domain, ch.access_token)
      }

      const lastSync   = ch.last_synced_at ? new Date(ch.last_synced_at) : null
      const stale      = !lastSync || Date.now() - lastSync.getTime() > 24 * 60 * 60 * 1000

      results[ch.type] = { valid, stale, lastSync: ch.last_synced_at }
    }))

    const issues = Object.entries(results)
      .filter(([, v]) => !v.valid || v.stale)
      .map(([type, v]) => ({
        type,
        issue: !v.valid ? 'token_expired' : 'stale_sync',
        message: !v.valid
          ? `${type} connection needs re-authorisation — token expired`
          : `${type} hasn't synced in over 24 hours`,
      }))

    return NextResponse.json({ health: results, issues })
  } catch (err: any) {
    console.error('[channels:health]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
