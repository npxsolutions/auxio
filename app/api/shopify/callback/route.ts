import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const shop  = searchParams.get('shop')
  const state = searchParams.get('state')

  if (!code || !shop) {
    return NextResponse.redirect(new URL('/onboarding?error=missing_params', request.url))
  }

  // CSRF: validate nonce
  const cookieStore = await cookies()
  const nonce = cookieStore.get('shopify_oauth_nonce')?.value
  if (!nonce || nonce !== state) {
    return NextResponse.redirect(new URL('/onboarding?error=invalid_state', request.url))
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/onboarding?error=token_exchange_failed', request.url))
    }

    const { access_token } = await tokenRes.json()

    // Get shop details
    const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': access_token },
    })
    const shopData = shopRes.ok ? await shopRes.json() : { shop: { name: shop } }

    // Store in Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    await supabase.from('channels').upsert({
      user_id:      user.id,
      type:         'shopify',
      active:       true,
      access_token,
      shop_name:    shopData.shop?.name || shop,
      shop_domain:  shop,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    // Mark onboarding complete
    await supabase.auth.updateUser({ data: { onboarding_complete: true } })

    // Kick off initial sync in the background
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://auxio-lkqv.vercel.app'}/api/shopify/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    }).catch(() => {}) // fire-and-forget

    const response = NextResponse.redirect(new URL('/onboarding?step=3', request.url))
    response.cookies.delete('shopify_oauth_nonce')
    return response

  } catch (error: any) {
    console.error('Shopify OAuth callback error:', error)
    return NextResponse.redirect(new URL('/onboarding?error=unexpected', request.url))
  }
}
