import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST /api/channels/test
// Body: { type: 'ebay' | 'amazon' | 'shopify' | 'etsy' | ... }
// Tests stored credentials by making a lightweight API call to the channel.

const CHANNEL_TESTS: Record<string, (token: string, domain: string) => Promise<{ ok: boolean; detail?: string }>> = {

  ebay: async (token) => {
    const res = await fetch('https://api.ebay.com/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_GB&limit=1', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` }
  },

  amazon: async (token) => {
    // SP-API: list orders with minimal scope
    const res = await fetch('https://sellingpartnerapi-eu.amazon.com/orders/v0/orders?MarketplaceIds=A1F83G8C2ARO7P&CreatedAfter=2020-01-01', {
      headers: { Authorization: `Bearer ${token}`, 'x-amz-access-token': token },
    })
    return { ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` }
  },

  shopify: async (token, domain) => {
    const res = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': token },
    })
    return { ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` }
  },

  etsy: async (token) => {
    const clientId = process.env.ETSY_CLIENT_ID!
    const res = await fetch('https://openapi.etsy.com/v3/application/users/me', {
      headers: { 'x-api-key': clientId, Authorization: `Bearer ${token}` },
    })
    return { ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` }
  },

  tiktok_shop: async (token) => {
    const appKey = process.env.TIKTOK_APP_KEY!
    const ts = Math.floor(Date.now() / 1000)
    const res = await fetch(`https://open-api.tiktokglobalshop.com/api/shop/get_authorized_shop?app_key=${appKey}&timestamp=${ts}&access_token=${token}`)
    return { ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` }
  },

  facebook_shop: async (token) => {
    const res = await fetch(`https://graph.facebook.com/me?access_token=${token}`)
    return { ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` }
  },

  google: async (token) => {
    const res = await fetch('https://shoppingcontent.googleapis.com/content/v2.1/accounts/authinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` }
  },

  woocommerce: async (token, domain) => {
    // token is base64(key:secret)
    const res = await fetch(`${domain}/wp-json/wc/v3/system_status`, {
      headers: { Authorization: `Basic ${token}` },
    })
    return { ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` }
  },

  walmart: async (token) => {
    // token is base64(clientId:clientSecret) — exchange for bearer
    const authRes = await fetch('https://marketplace.walmartapis.com/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: `Basic ${token}`,
        'WM_SVC.NAME': 'Walmart Marketplace',
        'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    })
    return { ok: authRes.ok, detail: authRes.ok ? undefined : `HTTP ${authRes.status}` }
  },

  onbuy: async (token) => {
    // token is base64(consumerKey:secretKey)
    const decoded  = Buffer.from(token, 'base64').toString()
    const [consumerKey, secretKey] = decoded.split(':')
    const ts = Math.floor(Date.now() / 1000)
    const { createHmac } = await import('crypto')
    const hmacToken = createHmac('sha256', secretKey).update(String(ts)).digest('hex')
    const res = await fetch('https://api.onbuy.com/v2/categories?site_id=2000', {
      headers: {
        Authorization: JSON.stringify({ consumer_key: consumerKey, timestamp: ts, token: hmacToken }),
        'Content-Type': 'application/json',
      },
    })
    return { ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` }
  },

  bigcommerce: async (token, storeHash) => {
    const res = await fetch(`https://api.bigcommerce.com/stores/${storeHash}/v2/store`, {
      headers: {
        'X-Auth-Token': token,
        Accept: 'application/json',
      },
    })
    return { ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` }
  },
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await request.json()
  if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 })

  // Load stored credentials
  const { data: channel } = await supabase
    .from('channels')
    .select('access_token, shop_domain')
    .eq('user_id', user.id)
    .eq('type', type)
    .eq('active', true)
    .single()

  if (!channel?.access_token) {
    return NextResponse.json({ ok: false, detail: 'Channel not connected' })
  }

  const tester = CHANNEL_TESTS[type]
  if (!tester) {
    return NextResponse.json({ ok: true, detail: 'No test available for this channel' })
  }

  try {
    const result = await tester(channel.access_token, channel.shop_domain || '')

    // Update last_synced_at on success
    if (result.ok) {
      await supabase
        .from('channels')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('type', type)
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error(`[channels/test] ${type}:`, err.message)
    return NextResponse.json({ ok: false, detail: err.message })
  }
}
