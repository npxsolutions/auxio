/**
 * TikTok Shop webhook endpoint.
 *
 * Receives push notifications for order events (ORDER_STATUS_CHANGE, etc.)
 * per https://partner.tiktokshop.com/docv2/page/tts-webhooks-overview
 *
 * Signature verification (SHA-256 plain, NOT HMAC — different from our API
 * request signing, which IS HMAC):
 *   header `Authorization` = sha256_hex(app_secret + raw_request_body)
 *
 * TikTok requires 200 OK within 5s or the event is retried for up to 72h.
 * Dedupe on `tts_notification_id` — at-least-once delivery.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { isTiktokShopConfigured } from '@/app/lib/tiktok-shop/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

function verifyTikTokSignature(rawBody: string, headerSig: string | null): boolean {
  if (!headerSig) return false
  const secret = process.env.TIKTOK_SHOP_APP_SECRET
  if (!secret) return false

  // sha256_hex(app_secret + raw_body) — plain SHA-256, not HMAC.
  const computed = createHash('sha256').update(secret + rawBody).digest('hex')

  if (computed.length !== headerSig.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ headerSig.charCodeAt(i)
  return diff === 0
}

export async function POST(request: NextRequest) {
  if (!isTiktokShopConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  const rawBody = await request.text()
  const sig = request.headers.get('authorization')
  if (!verifyTikTokSignature(rawBody, sig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: {
    type: number              // 1 = ORDER_STATUS_CHANGE, 5 = PRODUCT_STATUS_CHANGE, 8 = SELLER_DEAUTHORIZE, ...
    shop_id?: string
    timestamp?: number        // unix seconds
    data?: Record<string, unknown>
    tts_notification_id?: string
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const admin = getAdmin()

  const shopId = event.shop_id
  if (!shopId) return NextResponse.json({ ok: true, skipped: 'no shop_id' })

  const { data: channel } = await admin
    .from('channels')
    .select('organization_id, user_id')
    .eq('type', 'tiktok_shop')
    .eq('shop_domain', shopId)
    .maybeSingle()

  if (!channel) {
    // 200 so TikTok doesn't retry for unknown shop
    return NextResponse.json({ ok: true, skipped: 'unknown_shop' })
  }

  // For MVP: just log the event. A follow-up will add an org-scoped
  // `tiktok_events` table (dedupe on tts_notification_id) and per-event
  // handlers (order → transactions, product → listings sync,
  // deauth → channels.active = false).
  console.log(
    `[tiktok/webhook] type=${event.type} shop=${shopId} org=${channel.organization_id} notif=${event.tts_notification_id ?? 'n/a'}`,
  )

  return NextResponse.json({ ok: true })
}
