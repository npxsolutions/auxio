import { NextResponse } from 'next/server'

const SCOPES = 'read_orders,read_products,read_inventory,read_analytics'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shop = searchParams.get('shop')

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 })
  }

  const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '')

  if (!cleanShop.endsWith('.myshopify.com')) {
    return NextResponse.json({ error: 'Invalid shop domain — must end in .myshopify.com' }, { status: 400 })
  }

  const clientId    = process.env.SHOPIFY_CLIENT_ID!
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI!
  const nonce       = crypto.randomUUID()

  const authUrl = `https://${cleanShop}/admin/oauth/authorize?` + new URLSearchParams({
    client_id:    clientId,
    scope:        SCOPES,
    redirect_uri: redirectUri,
    state:        nonce,
  })

  const response = NextResponse.redirect(authUrl)
  // Store nonce in cookie for CSRF validation in callback
  response.cookies.set('shopify_oauth_nonce', nonce, { httpOnly: true, maxAge: 300, sameSite: 'lax' })
  return response
}
