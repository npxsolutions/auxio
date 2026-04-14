import { NextResponse } from 'next/server'
import { sendLifecycleEmail } from '../../../lib/email/send-lifecycle'

export const runtime = 'nodejs'

// Fire-and-forget welcome dispatch. Called from app/auth/callback/route.ts
// after a successful session exchange.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { userId, email, firstName } = body as { userId?: string; email?: string; firstName?: string | null }
    if (!userId || !email) {
      return NextResponse.json({ error: 'missing userId/email' }, { status: 400 })
    }
    const sent = await sendLifecycleEmail('welcome', { id: userId, email, firstName: firstName ?? null })
    return NextResponse.json({ sent })
  } catch (err: any) {
    console.error('[email-lifecycle/welcome] error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
