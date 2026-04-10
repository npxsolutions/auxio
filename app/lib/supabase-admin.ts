import { createClient } from '@supabase/supabase-js'

// Service-role client — NEVER import this in client components.
// The service role bypasses RLS so this must only run server-side.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Returns true if the given email is in the ADMIN_EMAILS env var
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
  return admins.includes(email.toLowerCase())
}
