import { NextResponse } from 'next/server'

// Meta (Facebook + Instagram) Commerce OAuth 2.0
// Developer program: https://developers.facebook.com
// Docs: https://developers.facebook.com/docs/marketing-api/catalog

const SCOPES = [
  'catalog_management',
  'commerce_account_read_settings',
  'commerce_account_manage_orders',
  'commerce_account_read_orders',
  'business_management',
  'public_profile',
].join(',')

export async function GET() {
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    client_id:     process.env.FACEBOOK_APP_ID!,
    redirect_uri:  process.env.FACEBOOK_REDIRECT_URI!,
    scope:         SCOPES,
    response_type: 'code',
    state,
  })

  const authUrl = `https://www.facebook.com/dialog/oauth?${params.toString()}`

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('facebook_oauth_state', state, {
    httpOnly: true, maxAge: 600, sameSite: 'lax', secure: true, path: '/',
  })
  return response
}
