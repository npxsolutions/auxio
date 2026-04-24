/**
 * TikTok Shop OAuth callback.
 *
 * Seller authorizes in TikTok Shop Partner Center, lands here with:
 *   ?code=<auth_code>&state=<ctx.id>
 *
 * Flow:
 *   1. Exchange code → tokens
 *   2. Fetch authorized shops → shop_cipher (required on 202309+ API calls)
 *   3. Persist one channels row per shop (a cross-border seller may have multiple)
 *
 * Gated on TikTok Partner approval. If env not set, redirects with error.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireActiveOrg } from '@/app/lib/org/context'
import {
  exchangeCode,
  getAuthorizedShops,
  isTiktokShopConfigured,
} from '@/app/lib/tiktok-shop/client'

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
    const shops  = await getAuthorizedShops(tokens.access_token)

    if (shops.length === 0) {
      return NextResponse.redirect(new URL('/channels?error=tiktok_no_shops', request.url))
    }

    const admin = getAdmin()

    // `access_token_expire_in` / `refresh_token_expire_in` are ABSOLUTE epoch
    // seconds despite the misleading name — store as-is.
    const accessExpires  = new Date(tokens.access_token_expire_in  * 1000).toISOString()
    const refreshExpires = new Date(tokens.refresh_token_expire_in * 1000).toISOString()

    // TODO: cross-border sellers can have multiple shops on one token; our
    // current channels schema uniqueness is (organization_id, type), so we
    // persist the primary shop and stash the rest in metadata.shops[] for
    // later when we add per-shop rows (needs a unique (org_id,type,shop_domain)
    // constraint migration).
    const primary = shops[0]
    const { error } = await admin.from('channels').upsert(
      {
        organization_id: ctx.id,
        user_id:         ctx.user.id,
        type:            'tiktok_shop',
        active:          true,
        access_token:    tokens.access_token,
        refresh_token:   tokens.refresh_token,
        shop_name:       primary.name || tokens.seller_name || primary.id,
        shop_domain:     primary.id,
        connected_at:    new Date().toISOString(),
        metadata: {
          open_id:      tokens.open_id,
          shop_id:      primary.id,
          shop_cipher:  primary.cipher,
          region:       primary.region,
          seller_type:  primary.seller_type,
          seller_base_region: tokens.seller_base_region,
          granted_scopes:     tokens.granted_scopes,
          access_token_expires_at:  accessExpires,
          refresh_token_expires_at: refreshExpires,
          shops: shops.map(s => ({ id: s.id, cipher: s.cipher, region: s.region, name: s.name })),
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
