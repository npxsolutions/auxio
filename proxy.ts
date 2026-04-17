import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/agent', '/channels', '/inventory', '/settings', '/billing', '/onboarding', '/listings']
const AUTH_PATHS      = ['/login', '/signup']

// Paths that skip the onboarding check (users can access without a connected channel)
const ONBOARDING_EXEMPT = ['/onboarding', '/billing', '/api']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Referral attribution: capture ?ref=CODE into httpOnly cookie for 30d
  const ref = request.nextUrl.searchParams.get('ref')
  if (ref && /^[A-Z0-9]{4,24}$/i.test(ref)) {
    const existing = request.cookies.get('palvento_ref')?.value
    if (!existing) {
      supabaseResponse.cookies.set('palvento_ref', ref, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isAuthPage  = AUTH_PATHS.includes(pathname)
  const isOnboardingExempt = ONBOARDING_EXEMPT.some(p => pathname === p || pathname.startsWith(p + '/'))

  // 1. Unauthenticated user on a protected page → login
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Authenticated user on login/signup → dashboard
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 3. Authenticated user hasn't completed onboarding → /onboarding
  if (user && isProtected && !isOnboardingExempt) {
    if (!user.user_metadata?.onboarding_complete) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/agent/:path*',
    '/channels/:path*',
    '/inventory/:path*',
    '/settings/:path*',
    '/billing/:path*',
    '/onboarding/:path*',
    '/listings/:path*',
    '/login',
    '/signup',
  ],
}
