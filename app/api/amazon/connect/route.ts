import { NextResponse } from 'next/server'

// Amazon SP-API OAuth — redirects seller to Amazon login to authorise access
export async function GET(request: Request) {
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    application_id: process.env.AMAZON_CLIENT_ID!,
    state,
    version:        'beta', // use 'live' once approved for production
  })

  // EU marketplace (amazon.co.uk / amazon.de etc)
  const authUrl = `https://sellercentral.amazon.co.uk/apps/authorize/consent?${params.toString()}`

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
