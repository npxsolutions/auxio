import { NextResponse } from 'next/server'

const SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
].join(' ')

export async function GET() {
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    client_id:     process.env.EBAY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri:  process.env.EBAY_REDIRECT_URI!,
    scope:         SCOPES,
    state,
  })

  const authUrl = `https://auth.ebay.com/oauth2/authorize?${params.toString()}`
  console.log('EBAY_CLIENT_ID=', process.env.EBAY_CLIENT_ID?.slice(0, 30))
  console.log('EBAY_REDIRECT_URI=', JSON.stringify(process.env.EBAY_REDIRECT_URI))
  console.log('EBAY_REDIRECT_URI_LEN=', process.env.EBAY_REDIRECT_URI?.length)

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('ebay_oauth_state', state, { httpOnly: true, maxAge: 600, sameSite: 'lax', secure: true, path: '/' })
  return response
}
