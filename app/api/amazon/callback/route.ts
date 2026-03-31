import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/onboarding?error=amazon_auth_failed', request.url))
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('amazon_oauth_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/onboarding?error=amazon_state_mismatch', request.url))
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.AMAZON_ADS_REDIRECT_URI!,
        client_id:     process.env.AMAZON_ADS_CLIENT_ID!,
        client_secret: process.env.AMAZON_ADS_CLIENT_SECRET!,
      }),
    })

    if (!tokenRes.ok) {
      console.error('Amazon token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/onboarding?error=amazon_token_failed', request.url))
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
      user_id:       user.id,
      type:          'amazon',
      active:        true,
      access_token,
      refresh_token,
      shop_name:     'Amazon Ads',
      connected_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    await supabase.auth.updateUser({ data: { onboarding_complete: true } })

    const response = NextResponse.redirect(new URL('/onboarding?step=3', request.url))
    response.cookies.delete('amazon_oauth_state')
    return response

  } catch (err: any) {
    console.error('Amazon OAuth callback error:', err)
    return NextResponse.redirect(new URL('/onboarding?error=unexpected', request.url))
  }
}
