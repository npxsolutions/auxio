// [api/referral/code] — return the caller's referral code (creates on first call).
import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase-server'
import { getOrCreateReferralCode } from '../../../lib/referral/code'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    const code = await getOrCreateReferralCode(user.id)
    return NextResponse.json({ code })
  } catch (err: any) {
    console.error('[api/referral/code:GET] failed', err)
    return NextResponse.json({ error: err.message || 'internal_error' }, { status: 500 })
  }
}
