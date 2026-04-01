import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Verify eBay notification signature
// eBay signs with: Base64(HMAC-SHA256(endpoint_url + notification_payload, client_secret))
function verifyEbaySignature(request: Request, rawBody: string): boolean {
  const signatureHeader = request.headers.get('x-ebay-signature')
  if (!signatureHeader) return false

  try {
    const endpointUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://auxio-lkqv.vercel.app'}/api/ebay/notifications/account-deletion`
    const hash = createHmac('sha256', process.env.EBAY_CLIENT_SECRET!)
      .update(endpointUrl + rawBody)
      .digest('base64')
    return hash === signatureHeader
  } catch {
    return false
  }
}

// GET — eBay sends a challenge code to verify endpoint ownership
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const challengeCode = searchParams.get('challenge_code')

  if (!challengeCode) {
    return NextResponse.json({ error: 'Missing challenge_code' }, { status: 400 })
  }

  // eBay expects: SHA256(challengeCode + verificationToken + endpointUrl)
  const endpointUrl = 'https://auxio-lkqv.vercel.app/api/ebay/notifications/account-deletion'
  const verificationToken = process.env.EBAY_VERIFICATION_TOKEN

  if (!verificationToken) {
    console.error('EBAY_VERIFICATION_TOKEN is not set')
    return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })
  }

  const { createHash } = await import('crypto')
  const hash = createHash('sha256')
    .update(challengeCode + verificationToken + endpointUrl)
    .digest('hex')

  console.log(`eBay challenge — code: ${challengeCode}, token_length: ${verificationToken.length}, endpoint: ${endpointUrl}, hash: ${hash}`)

  return NextResponse.json({ challengeResponse: hash })
}

// POST — eBay notifies us of account deletion/closure
export async function POST(request: Request) {
  const rawBody = await request.text()

  try {
    const payload = JSON.parse(rawBody)
    const userId = payload?.notification?.data?.userId

    console.log(`eBay account deletion — userId: ${userId}`)

    if (userId) {
      const supabase = getSupabase()

      // Find the channel for this eBay user
      const { data: channel } = await supabase
        .from('channels')
        .select('id, user_id')
        .eq('type', 'ebay')
        .eq('shop_domain', userId)
        .single()

      if (channel) {
        // Delete eBay transactions
        await supabase
          .from('transactions')
          .delete()
          .eq('user_id', channel.user_id)
          .eq('channel', 'ebay')

        // Delete the channel
        await supabase
          .from('channels')
          .delete()
          .eq('id', channel.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('eBay account deletion error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
