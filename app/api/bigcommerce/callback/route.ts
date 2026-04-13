import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// BigCommerce OAuth callback
// Token endpoint: https://login.bigcommerce.com/oauth2/token

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code       = searchParams.get('code')
  const state      = searchParams.get('state')
  const context    = searchParams.get('context')  // e.g. "stores/abc123"
  const scope      = searchParams.get('scope')
  const error      = searchParams.get('error')

  if (error || !code || !context) {
    return NextResponse.redirect(new URL(`/channels?error=bigcommerce_${error || 'missing_params'}`, request.url))
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('bigcommerce_oauth_state')?.value
  if (storedState !== state) {
    return NextResponse.redirect(new URL('/channels?error=bigcommerce_state_mismatch', request.url))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  try {
    const tokenRes = await fetch('https://login.bigcommerce.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id:     process.env.BIGCOMMERCE_CLIENT_ID!,
        client_secret: process.env.BIGCOMMERCE_CLIENT_SECRET!,
        grant_type:    'authorization_code',
        redirect_uri:  process.env.BIGCOMMERCE_REDIRECT_URI!,
        code,
        scope:         scope || '',
        context,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[bigcommerce/callback] token failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/channels?error=bigcommerce_token_failed', request.url))
    }

    const json = await tokenRes.json()
    const { access_token, context: storeContext, user: bcUser } = json

    // context is like "stores/abc123" — extract store hash
    const storeHash = storeContext?.replace('stores/', '') || ''
    const shopName  = bcUser?.email || `BigCommerce ${storeHash}`

    // Register webhooks — BigCommerce signs events with the app's client_secret,
    // so no per-hook secret is needed beyond what we already have in env.
    const appBase = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ''
    const registrations: Array<{ scope: string; destination: string; id?: number }> = []
    if (appBase && storeHash) {
      const scopes: Array<{ scope: string; path: string }> = [
        { scope: 'store/order/created',            path: '/api/webhooks/bigcommerce/orders' },
        { scope: 'store/order/updated',            path: '/api/webhooks/bigcommerce/orders' },
        { scope: 'store/product/created',          path: '/api/webhooks/bigcommerce/products' },
        { scope: 'store/product/updated',          path: '/api/webhooks/bigcommerce/products' },
        { scope: 'store/product/deleted',          path: '/api/webhooks/bigcommerce/products' },
        { scope: 'store/product/inventory/updated',path: '/api/webhooks/bigcommerce/products' },
      ]
      for (const { scope, path } of scopes) {
        try {
          const destination = `${appBase.replace(/\/$/, '')}${path}`
          const hookRes = await fetch(
            `https://api.bigcommerce.com/stores/${storeHash}/v3/hooks`,
            {
              method: 'POST',
              headers: {
                'X-Auth-Token': access_token,
                'X-Auth-Client': process.env.BIGCOMMERCE_CLIENT_ID!,
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({ scope, destination, is_active: true }),
            },
          )
          if (!hookRes.ok) {
            console.error('[bigcommerce/callback] webhook register failed:', scope, await hookRes.text())
          } else {
            const hj = await hookRes.json().catch(() => ({}))
            registrations.push({ scope, destination, id: hj?.data?.id })
          }
        } catch (e) {
          console.error('[bigcommerce/callback] webhook register error:', scope, e)
        }
      }
    } else if (!appBase) {
      console.warn('[bigcommerce/callback] APP_URL not set — skipping webhook registration')
    }

    await supabase.from('channels').upsert({
      user_id:      user.id,
      type:         'bigcommerce',
      active:       true,
      access_token,
      shop_name:    shopName,
      shop_domain:  storeHash,
      connected_at: new Date().toISOString(),
      metadata: {
        store_hash: storeHash,
        webhooks: registrations,
      },
    }, { onConflict: 'user_id,type' })

    const response = NextResponse.redirect(new URL('/channels?connected=bigcommerce', request.url))
    response.cookies.delete('bigcommerce_oauth_state')
    return response
  } catch (err: any) {
    console.error('[bigcommerce/callback]', err)
    return NextResponse.redirect(new URL('/channels?error=bigcommerce_unexpected', request.url))
  }
}
