import { NextResponse } from 'next/server'

// TikTok Shop Partner API — OAuth 2.0
// Developer program: https://partner.tiktokshop.com
// Docs: https://partner.tiktokshop.com/docv2/page/6502e2c5df2a950be4b200fb

export async function GET() {
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    app_key:       process.env.TIKTOK_APP_KEY!,
    state,
  })

  // TikTok Shop OAuth authorization endpoint
  const authUrl = `https://auth.tiktok-shops.com/oauth/authorize?${params.toString()}`

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('tiktok_oauth_state', state, {
    httpOnly: true, maxAge: 600, sameSite: 'lax', secure: true, path: '/',
  })
  return response
}
