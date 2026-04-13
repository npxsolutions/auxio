import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// OnBuy Marketplace API — API Key authentication
// Developer docs: https://developer.onbuy.com
// Keys: OnBuy Seller Control Panel > API Keys

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { consumerKey?: string; secretKey?: string; siteId?: number }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { consumerKey, secretKey, siteId = 2000 } = body  // siteId 2000 = OnBuy 
  if (!consumerKey || !secretKey) {
    return NextResponse.json({ error: 'consumerKey and secretKey are required' }, { status: 400 })
  }

  try {
    // OnBuy auth: HMAC-SHA256(secretKey, timestamp) — Consumer Key goes in Authorization header
    const timestamp = Math.floor(Date.now() / 1000)
    const { createHmac } = await import('crypto')
    const token = createHmac('sha256', secretKey)
      .update(String(timestamp))
      .digest('hex')

    const testRes = await fetch('https://api.onbuy.com/v2/categories?site_id=' + siteId, {
      headers: {
        'Authorization': JSON.stringify({ consumer_key: consumerKey, timestamp, token }),
        'Content-Type':  'application/json',
      },
    })

    if (!testRes.ok) {
      console.error('[onbuy/connect] validation failed:', await testRes.text())
      return NextResponse.json({ error: 'Invalid credentials. Check your Consumer Key and Secret Key in the OnBuy Seller Control Panel.' }, { status: 400 })
    }

    // Store consumer_key:secret_key encoded so we can re-generate tokens
    await supabase.from('channels').upsert({
      user_id:      user.id,
      type:         'onbuy',
      active:       true,
      access_token: Buffer.from(`${consumerKey}:${secretKey}`).toString('base64'),
      shop_name:    'OnBuy Store',
      shop_domain:  String(siteId),
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[onbuy/connect]', err)
    return NextResponse.json({ error: `Connection failed: ${err.message}` }, { status: 400 })
  }
}
