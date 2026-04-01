import { NextResponse } from 'next/server'

// Amazon SP-API OAuth — redirects seller to Amazon login to authorise access
export async function GET(request: Request) {
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    application_id: process.env.AMAZON_APP_ID!,
    state,
    version:        'beta', // use 'live' once approved for production
  })

  // Use global Seller Central endpoint (works for all marketplaces)
  const authUrl = `https://sellercentral.amazon.com/apps/authorize/consent?${params.toString()}`

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('amazon_oauth_state', state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: 'lax',
    secure: true,
    path: '/',
  })
  return response
}
