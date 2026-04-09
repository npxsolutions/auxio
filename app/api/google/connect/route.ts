import { NextResponse } from 'next/server'

// Google Merchant Center — Content API for Shopping OAuth 2.0
// Developer program: https://merchants.google.com / https://console.cloud.google.com
// Docs: https://developers.google.com/shopping-content/guides/quickstart

const SCOPES = [
  'https://www.googleapis.com/auth/content',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export async function GET() {
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope:         SCOPES,
    access_type:   'offline',
    prompt:        'consent',           // force refresh_token on every connect
    state,
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true, maxAge: 600, sameSite: 'lax', secure: true, path: '/',
  })
  return response
}
