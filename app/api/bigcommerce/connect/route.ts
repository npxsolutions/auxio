import { NextResponse } from 'next/server'

// BigCommerce OAuth 2.0 App Authorization
// Developer program: https://developer.bigcommerce.com
// Docs: https://developer.bigcommerce.com/docs/integrations/apps/guide/auth

export async function GET() {
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    client_id:     process.env.BIGCOMMERCE_CLIENT_ID!,
    response_type: 'code',
    scope:         'store_v2_products store_v2_orders store_v2_information_read_only',
    redirect_uri:  process.env.BIGCOMMERCE_REDIRECT_URI!,
    context:       'stores/*',
  })

  // BigCommerce login/install endpoint
  const authUrl = `https://login.bigcommerce.com/oauth2/authorize?${params.toString()}&state=${state}`

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('bigcommerce_oauth_state', state, {
    httpOnly: true, maxAge: 600, sameSite: 'lax', secure: true, path: '/',
  })
  return response
}
