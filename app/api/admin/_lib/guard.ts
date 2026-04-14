import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { isOwner } from '../../../admin/_lib/owner'
import { isAdminEmail } from '../../../lib/supabase-admin'

// Owner-allowlist guard for admin API route handlers.
// Returns either { user } on success or a NextResponse to short-circuit.
export async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const
  const ok = isOwner(user.email, user.id) || isAdminEmail(user.email)
  if (!ok) return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const
  return { user } as const
}
