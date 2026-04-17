// [middleware] — capture ?ref=CODE into an httpOnly cookie for 30d attribution.
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')
  const res = NextResponse.next()
  if (ref && /^[A-Z0-9]{4,24}$/i.test(ref)) {
    const existing = request.cookies.get('palvento_ref')?.value
    if (!existing) {
      res.cookies.set('palvento_ref', ref, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30d
        path: '/',
      })
    }
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook).*)'],
}
