import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// TikTok Shop OAuth callback
// Token endpoint: https://auth.tiktok-shops.com/api/v2/token/get/

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(new URL('/channels?error=tiktok_no_code', request.url))
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('tiktok_oauth_state')?.value

  if (storedState !== state) {
    return NextResponse.redirect(new URL('/channels?error=tiktok_state_mismatch', request.url))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  try {
    const params = new URLSearchParams({
      app_key:    process.env.TIKTOK_APP_KEY!,
      app_secret: process.env.TIKTOK_APP_SECRET!,
      auth_code:  code,
      grant_type: 'authorized_code',
    })

    const tokenRes = await fetch(`https://auth.tiktok-shops.com/api/v2/token/get?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!tokenRes.ok) {
      console.error('[tiktok/callback] token failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/channels?error=tiktok_token_failed', request.url))
    }

    const json = await tokenRes.json()
    const { access_token, refresh_token, seller_name, seller_base_region } = json.data || {}

    if (!access_token) {
      return NextResponse.redirect(new URL('/channels?error=tiktok_no_token', request.url))
    }

    await supabase.from('channels').upsert({
      user_id:       user.id,
      type:          'tiktok_shop',
      active:        true,
      access_token,
      refresh_token: refresh_token || null,
      shop_name:     seller_name || 'TikTok Shop',
      shop_domain:   seller_base_region || '',
      connected_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    const response = NextResponse.redirect(new URL('/channels?connected=tiktok_shop', request.url))
    response.cookies.delete('tiktok_oauth_state')
    return response
  } catch (err: any) {
    console.error('[tiktok/callback]', err)
    return NextResponse.redirect(new URL('/channels?error=tiktok_unexpected', request.url))
  }
}
