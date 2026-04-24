/**
 * TikTok Shop webhook endpoint.
 *
 * Receives push notifications for order events (ORDER_STATUS_CHANGE, etc.)
 * per https://partner.tiktokshop.com/docv2/page/6507c1a645b1dc02dfa3b195
 *
 * Auth: TikTok signs each payload with HMAC-SHA256 using the app secret.
 * Header: Authorization = SHA256 base64 of (secret + payload).
 *
 * Gated on TikTok Partner approval.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
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
  const computed = createHmac('sha256', secret).update(rawBody).digest('base64')
  // Constant-time compare
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
    type: number              // 1 = ORDER_STATUS_CHANGE, etc.
    shop_id?: string
    data?: Record<string, unknown>
    tts_notification_id?: string
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const admin = getAdmin()

  // Find the org for this shop_id (identifies which tenant)
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
  // `tiktok_events` table and per-event handlers (order → transactions,
  // product → listings sync).
  console.log(`[tiktok/webhook] type=${event.type} shop=${shopId} org=${channel.organization_id}`)

  return NextResponse.json({ ok: true })
}
