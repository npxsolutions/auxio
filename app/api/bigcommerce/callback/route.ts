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

    await supabase.from('channels').upsert({
      user_id:      user.id,
      type:         'bigcommerce',
      active:       true,
      access_token,
      shop_name:    shopName,
      shop_domain:  storeHash,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    const response = NextResponse.redirect(new URL('/channels?connected=bigcommerce', request.url))
    response.cookies.delete('bigcommerce_oauth_state')
    return response
  } catch (err: any) {
    console.error('[bigcommerce/callback]', err)
    return NextResponse.redirect(new URL('/channels?error=bigcommerce_unexpected', request.url))
  }
}
