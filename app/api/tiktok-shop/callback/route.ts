/**
 * TikTok Shop OAuth callback.
 *
 * Seller authorizes the app in TikTok Shop Partner Center, lands here with:
 *   ?code=<auth_code>
 *   &state=<ctx.id from redirect>
 *
 * We exchange the code for tokens, look up seller + shop info, and persist a
 * `channels` row for this org with type='tiktok_shop'.
 *
 * Gated on TikTok Partner approval. If env not set, 503.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireActiveOrg } from '@/app/lib/org/context'
import { exchangeCode, isTiktokShopConfigured } from '@/app/lib/tiktok-shop/client'

export const runtime = 'nodejs'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export async function GET(request: NextRequest) {
  if (!isTiktokShopConfigured()) {
    return NextResponse.redirect(new URL('/channels?error=tiktok_not_configured', request.url))
  }

  const sp = request.nextUrl.searchParams
  const code = sp.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/channels?error=tiktok_missing_code', request.url))
  }

  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const tokens = await exchangeCode(code)

    const admin = getAdmin()
    const { error } = await admin.from('channels').upsert(
      {
        organization_id: ctx.id,
        user_id:         ctx.user.id,
        type:            'tiktok_shop',
        active:          true,
        access_token:    tokens.access_token,
        refresh_token:   tokens.refresh_token,
        shop_name:       tokens.seller_name || tokens.shop_id,
        shop_domain:     tokens.shop_id,
        connected_at:    new Date().toISOString(),
        metadata: {
          open_id: tokens.open_id,
          shop_id: tokens.shop_id,
          region:  tokens.region,
          access_token_expires_at: new Date(Date.now() + tokens.access_token_expire_in * 1000).toISOString(),
          refresh_token_expires_at: new Date(Date.now() + tokens.refresh_token_expire_in * 1000).toISOString(),
        },
      },
      { onConflict: 'organization_id,type' },
    )

    if (error) {
      console.error('[tiktok-shop/callback] channel upsert failed', error.message)
      return NextResponse.redirect(new URL('/channels?error=tiktok_save_failed', request.url))
    }

    return NextResponse.redirect(new URL('/channels?connected=tiktok_shop', request.url))
  } catch (err: any) {
    console.error('[tiktok-shop/callback] error', err)
    return NextResponse.redirect(new URL('/channels?error=tiktok_exchange_failed', request.url))
  }
}
