import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Meta Facebook/Instagram Commerce OAuth callback
// Token endpoint: https://graph.facebook.com/oauth/access_token

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL(`/channels?error=facebook_${error || 'no_code'}`, request.url))
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('facebook_oauth_state')?.value
  if (storedState !== state) {
    return NextResponse.redirect(new URL('/channels?error=facebook_state_mismatch', request.url))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  try {
    const tokenRes = await fetch('https://graph.facebook.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        redirect_uri:  process.env.FACEBOOK_REDIRECT_URI!,
        code,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[facebook/callback] token failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/channels?error=facebook_token_failed', request.url))
    }

    const { access_token } = await tokenRes.json()

    // Fetch page/business name
    let shopName = 'Facebook Shop'
    try {
      const meRes = await fetch(`https://graph.facebook.com/me?fields=name&access_token=${access_token}`)
      if (meRes.ok) {
        const me = await meRes.json()
        shopName = me.name || shopName
      }
    } catch { /* non-fatal */ }

    await supabase.from('channels').upsert({
      user_id:      user.id,
      type:         'facebook_shop',
      active:       true,
      access_token,
      shop_name:    shopName,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    const response = NextResponse.redirect(new URL('/channels?connected=facebook_shop', request.url))
    response.cookies.delete('facebook_oauth_state')
    return response
  } catch (err: any) {
    console.error('[facebook/callback]', err)
    return NextResponse.redirect(new URL('/channels?error=facebook_unexpected', request.url))
  }
}
