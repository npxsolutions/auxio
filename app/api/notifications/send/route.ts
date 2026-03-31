import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, data: payload } = await request.json()

    // Check user has email alerts enabled
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('email_alerts')
      .eq('id', user.id)
      .single()

    if (!userData?.email_alerts) {
      return NextResponse.json({ skipped: true, reason: 'Email alerts disabled' })
    }

    const email = user.email!
    let subject = ''
    let html = ''

    if (type === 'critical_alert') {
      subject = `⚠️ Auxio Alert: ${payload.title}`
      html = criticalAlertEmail(payload)
    } else if (type === 'welcome') {
      subject = 'Welcome to Auxio — your AI profit engine is ready'
      html = welcomeEmail({ email })
    } else {
      return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 })
    }

    const result = await resend.emails.send({
      from: 'Auxio <alerts@auxio.app>',
      to: email,
      subject,
      html,
    })

    return NextResponse.json({ sent: true, id: result.data?.id })
  } catch (error: any) {
    console.error('Notification send error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function criticalAlertEmail({ title, description, profit_impact }: { title: string; description: string; profit_impact?: number }) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;border:1px solid #e8e8e5;">
        <tr><td style="padding:32px 40px;">
          <div style="font-size:22px;font-weight:700;color:#191919;letter-spacing:-0.02em;margin-bottom:8px;">⚠️ ${title}</div>
          <div style="font-size:14px;color:#787774;line-height:1.6;margin-bottom:24px;">${description}</div>
          ${profit_impact ? `<div style="background:#e8f5f3;border-radius:8px;padding:16px;margin-bottom:24px;"><div style="font-size:12px;color:#0f7b6c;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Potential impact</div><div style="font-size:24px;font-weight:700;color:#0f7b6c;">+£${profit_impact.toFixed(2)}</div></div>` : ''}
          <a href="https://auxio.app/agent" style="display:inline-block;background:#191919;color:white;text-decoration:none;border-radius:8px;padding:12px 24px;font-size:13px;font-weight:600;">Review in Auxio →</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #f1f1ef;background:#fafafa;">
          <div style="font-size:12px;color:#9b9b98;">You're receiving this because critical alerts are enabled in your Auxio settings. <a href="https://auxio.app/settings" style="color:#787774;">Manage preferences</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function welcomeEmail({ email }: { email: string }) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;border:1px solid #e8e8e5;">
        <tr><td style="padding:32px 40px;">
          <div style="font-size:22px;font-weight:700;color:#191919;letter-spacing:-0.02em;margin-bottom:8px;">Welcome to Auxio</div>
          <div style="font-size:14px;color:#787774;line-height:1.6;margin-bottom:24px;">Your AI profit engine is ready. Connect your first selling channel and Auxio will start monitoring your margins, spotting wasted ad spend, and surfacing actions that move your profit.</div>
          <a href="https://auxio.app/onboarding" style="display:inline-block;background:#191919;color:white;text-decoration:none;border-radius:8px;padding:12px 24px;font-size:13px;font-weight:600;">Connect your first channel →</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #f1f1ef;background:#fafafa;">
          <div style="font-size:12px;color:#9b9b98;">Sent to ${email} · <a href="https://auxio.app/settings" style="color:#787774;">Manage preferences</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
