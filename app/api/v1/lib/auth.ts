import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Validate Bearer token and return the authenticated user.
// Returns { user, error } — if error is set, return the error response immediately.
export async function requireApiAuth(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Missing Authorization header. Use: Authorization: Bearer <token>' },
        { status: 401 }
      ),
    }
  }

  // Use a per-request client so the JWT is scoped to this request
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
    }
  }

  return { user, error: null, supabase }
}
