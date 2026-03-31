import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/agent', '/channels', '/inventory', '/settings', '/billing', '/onboarding']
const AUTH_PATHS      = ['/login', '/signup']

// Paths that skip the onboarding check (users can access without a connected channel)
const ONBOARDING_EXEMPT = ['/onboarding', '/billing', '/api']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
    '/login',
    '/signup',
  ],
}
