import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    client_id:     process.env.AMAZON_ADS_CLIENT_ID!,
    scope:         'advertising::campaign_management',
    response_type: 'code',
    redirect_uri:  process.env.AMAZON_ADS_REDIRECT_URI!,
    state,
  })

  const authUrl = `https://www.amazon.co.uk/ap/oa?${params.toString()}`

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('amazon_oauth_state', state, { httpOnly: true, maxAge: 600, sameSite: 'lax' })
  return response
}
