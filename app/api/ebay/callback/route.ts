import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code) {
    console.error('eBay callback error:', error)
    return NextResponse.redirect(new URL('/channels?error=ebay_auth_failed', request.url))
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('ebay_oauth_state')?.value

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()

  // Allow if CSRF matches or user is already logged in
  if (storedState !== state && !user) {
    return NextResponse.redirect(new URL('/channels?error=ebay_state_mismatch', request.url))
  }
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const credentials = Buffer.from(
      `${process.env.EBAY_CLIENT_ID!}:${process.env.EBAY_CLIENT_SECRET!}`
    ).toString('base64')

    const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: process.env.EBAY_REDIRECT_URI!,
      }),
    })

    if (!tokenRes.ok) {
      console.error('eBay token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/channels?error=ebay_token_failed', request.url))
    }

    const { access_token, refresh_token } = await tokenRes.json()

    // Fetch eBay user identity to get username and userId for shop_domain
    let shopName = 'eBay Store'
    let shopDomain = ''
    try {
      const identityRes = await fetch('https://apiz.ebay.com/commerce/identity/v1/user/', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (identityRes.ok) {
        const identity = await identityRes.json()
        shopName   = identity.username  || shopName
        shopDomain = identity.userId    || ''
      }
    } catch {
      // non-fatal — proceed without identity
    }
    console.log(`eBay connected — user: ${shopName}`)

    const { error: upsertErr } = await supabase.from('channels').upsert({
      user_id:       user.id,
      type:          'ebay',
      active:        true,
      access_token,
      refresh_token,
      shop_name:     shopName,
      shop_domain:   shopDomain,
      connected_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    if (upsertErr) {
      console.error('eBay channel upsert error:', upsertErr)
      return NextResponse.redirect(new URL('/channels?error=ebay_save_failed', request.url))
    }

    const response = NextResponse.redirect(new URL('/channels?connected=ebay', request.url))
    response.cookies.delete('ebay_oauth_state')
    return response

  } catch (err: any) {
    console.error('eBay OAuth callback error:', err)
    return NextResponse.redirect(new URL('/channels?error=unexpected', request.url))
  }
}
