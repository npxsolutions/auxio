import { createClient } from '@supabase/supabase-js'

// Service-role client — NEVER import this in client components.
// Using a lazy getter so the key is only read at request time (not build time).
export function getSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY env var is not set')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Returns true if the given email is in the ADMIN_EMAILS env var
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
  return admins.includes(email.toLowerCase())
}
