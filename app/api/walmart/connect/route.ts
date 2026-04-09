import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Walmart Marketplace API — Client ID + Client Secret
// Developer program: https://developer.walmart.com
// Docs: https://developer.walmart.com/doc/us/mp/us-mp-auth/
// Sandbox: https://sandbox.walmartapis.com

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { clientId?: string; clientSecret?: string; sandbox?: boolean }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { clientId, clientSecret, sandbox = false } = body
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'clientId and clientSecret are required' }, { status: 400 })
  }

  const baseUrl = sandbox
    ? 'https://sandbox.walmartapis.com'
    : 'https://marketplace.walmartapis.com'

  try {
    // Validate by obtaining an access token
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes = await fetch(`${baseUrl}/v3/token`, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/x-www-form-urlencoded',
        'Accept':            'application/json',
        'Authorization':     `Basic ${credentials}`,
        'WM_SVC.NAME':       'Walmart Marketplace',
        'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('[walmart/connect] auth failed:', errText)
      return NextResponse.json({ error: 'Invalid credentials. Check your Client ID and Secret in Seller Center.' }, { status: 400 })
    }

    const { access_token, token_type, expires_in } = await tokenRes.json()

    // Store Client ID + Secret (encoded) for future token refresh
    await supabase.from('channels').upsert({
      user_id:      user.id,
      type:         'walmart',
      active:       true,
      access_token: Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      shop_name:    `Walmart ${sandbox ? 'Sandbox' : 'Marketplace'}`,
      shop_domain:  sandbox ? 'sandbox' : 'production',
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    return NextResponse.json({ success: true, sandbox })
  } catch (err: any) {
    console.error('[walmart/connect]', err)
    return NextResponse.json({ error: `Connection failed: ${err.message}` }, { status: 400 })
  }
}
