import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Amazon SP-API OAuth callback
// Amazon sends: spapi_oauth_code, selling_partner_id, state
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code             = searchParams.get('spapi_oauth_code')
  const sellingPartnerId = searchParams.get('selling_partner_id')
  const state            = searchParams.get('state')
  const error            = searchParams.get('error')

  if (error || !code) {
    console.error('Amazon callback error:', error)
    return NextResponse.redirect(new URL('/channels?error=amazon_auth_failed', request.url))
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('amazon_oauth_state')?.value

  // Allow if CSRF matches or user is already logged in
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()

  if (storedState !== state && !user) {
    return NextResponse.redirect(new URL('/channels?error=amazon_state_mismatch', request.url))
  }
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Exchange OAuth code for LWA tokens
    const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.AMAZON_REDIRECT_URI!,
        client_id:     process.env.AMAZON_CLIENT_ID!,
        client_secret: process.env.AMAZON_CLIENT_SECRET!,
      }),
    })

    if (!tokenRes.ok) {
      console.error('Amazon token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/channels?error=amazon_token_failed', request.url))
    }

    const { access_token, refresh_token } = await tokenRes.json()
    console.log(`Amazon SP-API connected — seller: ${sellingPartnerId}`)

    const { error: upsertErr } = await supabase.from('channels').upsert({
      user_id:          user.id,
      type:             'amazon',
      active:           true,
      access_token,
      ads_access_token: refresh_token, // store refresh token here
      shop_name:        `Amazon (${sellingPartnerId || 'Seller Central'})`,
      shop_domain:      sellingPartnerId || '',
      connected_at:     new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    if (upsertErr) {
      console.error('Amazon channel upsert error:', upsertErr)
      return NextResponse.redirect(new URL('/channels?error=amazon_save_failed', request.url))
    }

    const response = NextResponse.redirect(new URL('/channels?connected=amazon', request.url))
    response.cookies.delete('amazon_oauth_state')
    return response

  } catch (err: any) {
    console.error('Amazon OAuth callback error:', err)
    return NextResponse.redirect(new URL('/channels?error=unexpected', request.url))
  }
}
