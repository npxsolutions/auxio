import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { referrerUserIdForCode } from '../../lib/referral/code'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Fire-and-forget welcome email (idempotent — unique(user_id, template)).
      const user = data?.user
      if (user?.id && user.email) {
        const base = origin
        fetch(`${base}/api/email-lifecycle/welcome`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email: user.email, firstName: (user.user_metadata as any)?.first_name || null }),
        }).catch(err => console.error('[auth/callback] welcome dispatch failed:', err))

        // Referral attribution — read cookie, insert signed_up row (idempotent).
        try {
          const ref = cookieStore.get('palvento_ref')?.value
          if (ref) {
            const referrerId = await referrerUserIdForCode(ref)
            if (referrerId && referrerId !== user.id) {
              const admin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_KEY!,
                { auth: { persistSession: false } }
              )
              await admin.from('referrals').upsert({
                referrer_user_id: referrerId,
                referred_user_id: user.id,
                referred_email: user.email ?? null,
                code: ref,
                signup_at: new Date().toISOString(),
                status: 'signed_up',
              }, { onConflict: 'referred_user_id' })
            }
            // Clear the cookie post-attribution.
            cookieStore.set('palvento_ref', '', { maxAge: 0, path: '/' })
          }
        } catch (err) {
          console.error('[auth/callback] referral attribution failed:', err)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
