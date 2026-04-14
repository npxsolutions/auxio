import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// WooCommerce REST API — Consumer Key / Secret connection
// Docs: https://woocommerce.github.io/woocommerce-rest-api-docs/
// Keys generated in: WooCommerce > Settings > Advanced > REST API

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { siteUrl?: string; consumerKey?: string; consumerSecret?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { siteUrl, consumerKey, consumerSecret } = body
  if (!siteUrl || !consumerKey || !consumerSecret) {
    return NextResponse.json({ error: 'siteUrl, consumerKey and consumerSecret are required' }, { status: 400 })
  }

  // Normalise URL
  const baseUrl = siteUrl.replace(/\/$/, '')

  // Validate credentials by fetching store info
  try {
    const testRes = await fetch(`${baseUrl}/wp-json/wc/v3/system_status`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
      },
    })

    if (!testRes.ok) {
      const errText = await testRes.text()
      console.error('[woocommerce/connect] validation failed:', errText)
      return NextResponse.json({ error: 'Invalid credentials or store URL. Check your Consumer Key and Secret.' }, { status: 400 })
    }

    const status = await testRes.json()
    const shopName = status.settings?.blog_name || new URL(baseUrl).hostname
    const basicAuth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

    // Register webhooks so we get real-time order/product events.
    // WooCommerce lets the caller supply its own `secret` per webhook.
    const appBase = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ''
    const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || crypto.randomUUID()
    const registrations: Array<{ topic: string; deliveryUrl: string }> = []

    if (appBase) {
      const topics: Array<{ topic: string; path: string }> = [
        { topic: 'order.created',   path: '/api/webhooks/woocommerce/orders' },
        { topic: 'order.updated',   path: '/api/webhooks/woocommerce/orders' },
        { topic: 'product.created', path: '/api/webhooks/woocommerce/products' },
        { topic: 'product.updated', path: '/api/webhooks/woocommerce/products' },
        { topic: 'product.deleted', path: '/api/webhooks/woocommerce/products' },
      ]
      for (const { topic, path } of topics) {
        try {
          const deliveryUrl = `${appBase.replace(/\/$/, '')}${path}`
          const hookRes = await fetch(`${baseUrl}/wp-json/wc/v3/webhooks`, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${basicAuth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: `Fulcra ${topic}`,
              topic,
              delivery_url: deliveryUrl,
              secret: webhookSecret,
            }),
          })
          if (!hookRes.ok) {
            console.error('[woocommerce/connect] webhook register failed:', topic, await hookRes.text())
          } else {
            registrations.push({ topic, deliveryUrl })
          }
        } catch (e) {
          console.error('[woocommerce/connect] webhook register error:', topic, e)
        }
      }
    } else {
      console.warn('[woocommerce/connect] APP_URL not set — skipping webhook registration')
    }

    await supabase.from('channels').upsert({
      user_id:      user.id,
      type:         'woocommerce',
      active:       true,
      // Store credentials encoded in access_token field (key:secret format)
      access_token: basicAuth,
      shop_name:    shopName,
      shop_domain:  baseUrl,
      connected_at: new Date().toISOString(),
      metadata: {
        webhook_secret: webhookSecret,
        webhooks: registrations,
      },
    }, { onConflict: 'user_id,type' })

    return NextResponse.json({ success: true, shopName, webhooks: registrations.length })
  } catch (err: any) {
    console.error('[woocommerce/connect]', err)
    return NextResponse.json({ error: `Could not reach store: ${err.message}` }, { status: 400 })
  }
}
