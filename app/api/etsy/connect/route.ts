import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Etsy OAuth 2.0 with PKCE (no client secret required)
// Developer program: https://www.etsy.com/developers

const SCOPES = [
  'listings_r',
  'listings_w',
  'listings_d',
  'transactions_r',
  'inventory_r',
  'inventory_w',
].join('%20')

function base64url(buffer: ArrayBuffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function GET() {
  // Generate PKCE code_verifier
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32))
  const codeVerifier = base64url(verifierBytes.buffer)

  // SHA-256 hash → code_challenge
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const codeChallenge = base64url(hashBuffer)

  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    response_type:         'code',
    redirect_uri:          process.env.ETSY_REDIRECT_URI!,
    scope:                 SCOPES.replace(/%20/g, ' '),
    client_id:             process.env.ETSY_CLIENT_ID!,
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `https://www.etsy.com/oauth/connect?${params.toString()}`

  const cookieStore = await cookies()
  const response = NextResponse.redirect(authUrl)
  response.cookies.set('etsy_code_verifier', codeVerifier, { httpOnly: true, maxAge: 600, sameSite: 'lax', secure: true, path: '/' })
  response.cookies.set('etsy_oauth_state', state, { httpOnly: true, maxAge: 600, sameSite: 'lax', secure: true, path: '/' })
  return response
}
