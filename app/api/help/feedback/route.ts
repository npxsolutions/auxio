import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// UI-only stub for help article feedback. Accepts { slug, helpful: boolean }.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    // TODO: persist to help_feedback table + forward to analytics.
    console.log('[help/feedback]', body)
  } catch {}
  return NextResponse.json({ ok: true })
}
