import { Resend } from 'resend'
import { getSupabaseAdmin } from '../supabase-admin'
import {
  LIFECYCLE_TEMPLATES,
  type LifecycleTemplate,
  type LifecycleUser,
  type LifecycleContext,
} from './lifecycle'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

/**
 * Send a lifecycle email once per (user, template). Safe to call repeatedly —
 * relies on the unique(user_id, template) constraint on public.email_sends.
 *
 * Returns true if a message was sent, false if already sent or on error.
 */
export async function sendLifecycleEmail(
  template: LifecycleTemplate,
  user: LifecycleUser,
  ctx: LifecycleContext = {}
): Promise<boolean> {
  if (!user?.email || !user?.id) return false

  const admin = getSupabaseAdmin()

  // Reserve the send first (acts as our idempotency lock).
  const { error: insertErr } = await admin
    .from('email_sends')
    .insert({ user_id: user.id, template })

  if (insertErr) {
    // Duplicate key means we've already sent this template — benign.
    if (insertErr.code === '23505') return false
    console.error('[lifecycle] failed to record send:', insertErr.message)
    return false
  }

  try {
    const rendered = LIFECYCLE_TEMPLATES[template](user, ctx)
    const resend = getResend()
    await resend.emails.send({
      from: 'Meridia <hello@auxio.app>',
      to: user.email,
      replyTo: 'hello@auxio.app',
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    })
    return true
  } catch (err: any) {
    console.error(`[lifecycle] send failed for ${template} → ${user.email}:`, err.message)
    // Roll back the reservation so we can retry tomorrow.
    await admin
      .from('email_sends')
      .delete()
      .eq('user_id', user.id)
      .eq('template', template)
    return false
  }
}
