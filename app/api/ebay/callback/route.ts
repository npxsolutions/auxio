import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { EBAY_DEFAULT_SCOPES } from '../../../lib/ebay/auth'

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
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.EBAY_REDIRECT_URI!,
      }),
    })

    if (!tokenRes.ok) {
      console.error('eBay token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/channels?error=ebay_token_failed', request.url))
    }

    const { access_token, refresh_token, expires_in } = await tokenRes.json()
    const ebayExpiresAt = Date.now() + Math.max(60, Number(expires_in ?? 7200) - 30) * 1000

    // Fetch eBay user identity. The Identity API sits on apiz.ebay.com and
    // requires the `commerce.identity.readonly` scope on the OAuth token.
    // We try identity first; if it 401s (missing scope) or the shape is
    // unexpected, fall back to the Trading API GetUser call which works with
    // the same user token via the IAF header.
    let shopName = 'eBay Store'
    let shopDomain = ''
    try {
      const identityRes = await fetch('https://apiz.ebay.com/commerce/identity/v1/user/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json',
        },
      })
      if (identityRes.ok) {
        const identity = await identityRes.json()
        shopName   = identity.username || identity.individualAccount?.firstName || shopName
        shopDomain = identity.userId || identity.username || ''
      } else {
        console.warn('[ebay:callback] identity API failed:', identityRes.status, await identityRes.text().catch(() => ''))
      }
    } catch (err) {
      console.warn('[ebay:callback] identity API exception:', err)
    }

    // Fallback: Trading API GetUser — works with the user OAuth token via IAF.
    if (!shopDomain) {
      try {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<GetUserRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <DetailLevel>ReturnAll</DetailLevel>
</GetUserRequest>`
        const tradingRes = await fetch('https://api.ebay.com/ws/api.dll', {
          method: 'POST',
          headers: {
            'Content-Type':                   'text/xml',
            'X-EBAY-API-CALL-NAME':           'GetUser',
            'X-EBAY-API-SITEID':              '3',
            'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
            'X-EBAY-API-IAF-TOKEN':           access_token,
          },
          body: xml,
        })
        if (tradingRes.ok) {
          const body = await tradingRes.text()
          const userIdMatch = body.match(/<UserID>([^<]+)<\/UserID>/)
          if (userIdMatch?.[1]) {
            shopDomain = userIdMatch[1]
            shopName = userIdMatch[1]
          }
        }
      } catch (err) {
        console.warn('[ebay:callback] Trading GetUser fallback failed:', err)
      }
    }

    // Absolute last resort — use a deterministic user-scoped key so the unique
    // lookup in webhooks still succeeds.
    if (!shopDomain) shopDomain = `ebay:${user.id}`

    console.log(`[ebay:callback] connected — user: ${shopName}, domain: ${shopDomain}`)

    const { error: upsertErr } = await supabase.from('channels').upsert({
      user_id:       user.id,
      type:          'ebay',
      active:        true,
      access_token,
      refresh_token,
      shop_name:     shopName,
      shop_domain:   shopDomain,
      connected_at:  new Date().toISOString(),
      metadata: {
        ebay_access_token: access_token,
        ebay_token_expires_at: ebayExpiresAt,
        // NOTE: deliberately not storing `ebay_scope`. eBay's refresh
        // endpoint returns a token with the originally granted scope when
        // `scope` is omitted from the refresh body. Storing the requested
        // scope set here caused `invalid_scope` on refresh when the user
        // had granted a subset of what we ask for.
      },
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
