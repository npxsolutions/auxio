import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/onboarding?error=ebay_auth_failed', request.url))
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('ebay_oauth_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/onboarding?error=ebay_state_mismatch', request.url))
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
      return NextResponse.redirect(new URL('/onboarding?error=ebay_token_failed', request.url))
    }

    const { access_token, refresh_token } = await tokenRes.json()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    await supabase.from('channels').upsert({
      user_id:      user.id,
      type:         'ebay',
      active:       true,
      access_token,
      refresh_token,
      shop_name:    'eBay Store',
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    await supabase.auth.updateUser({ data: { onboarding_complete: true } })

    const response = NextResponse.redirect(new URL('/onboarding?step=3', request.url))
    response.cookies.delete('ebay_oauth_state')
    return response

  } catch (err: any) {
    console.error('eBay OAuth callback error:', err)
    return NextResponse.redirect(new URL('/onboarding?error=unexpected', request.url))
  }
}
