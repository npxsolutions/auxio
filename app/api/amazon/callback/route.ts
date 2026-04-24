import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'
import { createClient } from '@supabase/supabase-js'
import { isAmazonConfigured } from '@/app/lib/amazon/sp-api'

// Amazon SP-API OAuth callback
// Amazon sends: spapi_oauth_code, selling_partner_id, state
export async function GET(request: Request) {
  if (!isAmazonConfigured()) {
    return NextResponse.redirect(new URL('/channels?error=amazon_not_configured', request.url))
  }

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

  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (storedState !== state) {
    return NextResponse.redirect(new URL('/channels?error=amazon_state_mismatch', request.url))
  }

  try {
    // Exchange OAuth code for LWA refresh token
    const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.AMAZON_REDIRECT_URI!,
        client_id:     process.env.AMAZON_LWA_CLIENT_ID!,
        client_secret: process.env.AMAZON_LWA_CLIENT_SECRET!,
      }),
    })

    if (!tokenRes.ok) {
      console.error('Amazon token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/channels?error=amazon_token_failed', request.url))
    }

    const { access_token, refresh_token } = await tokenRes.json() as {
      access_token: string
      refresh_token: string
    }

    // Use service role — channels is org-scoped and we need to write org_id explicitly.
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { error: upsertErr } = await admin.from('channels').upsert({
      organization_id:  ctx.id,
      user_id:          ctx.user.id,
      type:             'amazon',
      active:           true,
      access_token,
      refresh_token,
      shop_name:        `Amazon (${sellingPartnerId || 'Seller Central'})`,
      shop_domain:      sellingPartnerId || '',
      metadata:         { selling_partner_id: sellingPartnerId, region: 'NA' },
      connected_at:     new Date().toISOString(),
    }, { onConflict: 'organization_id,type' })

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
