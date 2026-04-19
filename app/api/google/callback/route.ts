import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Google Merchant Center OAuth callback
// Token endpoint: https://oauth2.googleapis.com/token

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL(`/channels?error=google_${error || 'no_code'}`, request.url))
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('google_oauth_state')?.value
  if (storedState !== state) {
    return NextResponse.redirect(new URL('/channels?error=google_state_mismatch', request.url))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
        grant_type:    'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      console.error('[google/callback] token failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/channels?error=google_token_failed', request.url))
    }

    const { access_token, refresh_token } = await tokenRes.json()

    // Fetch merchant ID and name from Content API
    let shopName   = 'Google Merchant Center'
    let merchantId = ''
    try {
      const merchantRes = await fetch('https://shoppingcontent.googleapis.com/content/v2.1/accounts/authinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (merchantRes.ok) {
        const data = await merchantRes.json()
        const acct = data.accountIdentifiers?.[0]
        if (acct?.merchantId) merchantId = String(acct.merchantId)
        if (merchantId) {
          const acctRes = await fetch(`https://shoppingcontent.googleapis.com/content/v2.1/${merchantId}/accounts/${merchantId}`, {
            headers: { Authorization: `Bearer ${access_token}` },
          })
          if (acctRes.ok) {
            const acctData = await acctRes.json()
            shopName = acctData.name || shopName
          }
        }
      }
    } catch { /* non-fatal */ }

    // Metadata fields are what app/lib/google/auth.ts and /api/sync/google/products read.
    // Column duplication (shop_domain, refresh_token) kept for UI + legacy compatibility.
    const tokenExpiresAt = Date.now() + 55 * 60 * 1000 // cache ~55min; auth helper refreshes when <60s left

    await supabase.from('channels').upsert({
      user_id:       user.id,
      type:          'google',
      active:        true,
      access_token,
      refresh_token: refresh_token || null,
      shop_name:     shopName,
      shop_domain:   merchantId,
      connected_at:  new Date().toISOString(),
      metadata: {
        merchant_id:             merchantId,
        google_refresh_token:    refresh_token || null,
        google_access_token:     access_token,
        google_token_expires_at: tokenExpiresAt,
      },
    }, { onConflict: 'user_id,type' })

    const response = NextResponse.redirect(new URL('/channels?connected=google', request.url))
    response.cookies.delete('google_oauth_state')
    return response
  } catch (err: any) {
    console.error('[google/callback]', err)
    return NextResponse.redirect(new URL('/channels?error=google_unexpected', request.url))
  }
}
