import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Etsy OAuth 2.0 PKCE callback
// Token endpoint: https://api.etsy.com/v3/public/oauth/token

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('error')

  if (!code) {
    const err = searchParams.get('error') || 'no_code'
    return NextResponse.redirect(new URL(`/channels?error=etsy_${err}`, request.url))
  }

  const cookieStore = await cookies()
  const storedState    = cookieStore.get('etsy_oauth_state')?.value
  const codeVerifier   = cookieStore.get('etsy_code_verifier')?.value
  const returnedState  = searchParams.get('state')

  if (storedState !== returnedState || !codeVerifier) {
    return NextResponse.redirect(new URL('/channels?error=etsy_state_mismatch', request.url))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  try {
    const tokenRes = await fetch('https://api.etsy.com/v3/public/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     process.env.ETSY_CLIENT_ID!,
        redirect_uri:  process.env.ETSY_REDIRECT_URI!,
        code,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[etsy/callback] token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/channels?error=etsy_token_failed', request.url))
    }

    const { access_token, refresh_token, expires_in } = await tokenRes.json()
    const etsyExpiresAt = Date.now() + Math.max(60, Number(expires_in ?? 3600) - 30) * 1000

    // Fetch shop info + numeric user id (required for future v3 calls).
    // The access token itself is prefixed with "<user_id>." but we also hit
    // /users/me as the canonical source for the numeric id.
    let shopName = 'Etsy Shop'
    let etsyUserId: string | null = null
    let etsyShopId: string | null = null
    try {
      const meRes = await fetch('https://openapi.etsy.com/v3/application/users/me', {
        headers: {
          'x-api-key':     process.env.ETSY_CLIENT_ID!,
          'Authorization': `Bearer ${access_token}`,
        },
      })
      if (meRes.ok) {
        const me = await meRes.json()
        if (me?.user_id) etsyUserId = String(me.user_id)
        // Get primary shop
        const shopRes = await fetch(`https://openapi.etsy.com/v3/application/users/${me.user_id}/shops`, {
          headers: {
            'x-api-key':     process.env.ETSY_CLIENT_ID!,
            'Authorization': `Bearer ${access_token}`,
          },
        })
        if (shopRes.ok) {
          const shopData = await shopRes.json()
          shopName   = shopData.shop_name || shopName
          if (shopData.shop_id) etsyShopId = String(shopData.shop_id)
        }
      }
    } catch { /* non-fatal */ }

    // Fallback: token's numeric prefix (<user_id>.<token>) is also the id.
    if (!etsyUserId && typeof access_token === 'string' && access_token.includes('.')) {
      const prefix = access_token.split('.')[0]
      if (/^\d+$/.test(prefix)) etsyUserId = prefix
    }

    await supabase.from('channels').upsert({
      user_id:      user.id,
      type:         'etsy',
      active:       true,
      access_token,
      refresh_token: refresh_token || null,
      shop_name:    shopName,
      shop_domain:  etsyShopId, // Etsy has no domain; store shop_id here for parity.
      connected_at: new Date().toISOString(),
      metadata: {
        etsy_user_id: etsyUserId,
        etsy_shop_id: etsyShopId,
        etsy_access_token: access_token,
        etsy_token_expires_at: etsyExpiresAt,
      },
    }, { onConflict: 'user_id,type' })

    const response = NextResponse.redirect(new URL('/channels?connected=etsy', request.url))
    response.cookies.delete('etsy_oauth_state')
    response.cookies.delete('etsy_code_verifier')
    return response
  } catch (err: any) {
    console.error('[etsy/callback]', err)
    return NextResponse.redirect(new URL('/channels?error=etsy_unexpected', request.url))
  }
}
