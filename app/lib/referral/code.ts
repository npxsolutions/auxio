// [lib/referral/code] — deterministic slug generation + upsert helpers.
import { createClient as createAdminClient } from '@supabase/supabase-js'

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
}

/** Deterministic 8-char slug from user_id (no external hash lib). */
export function slugFromUserId(userId: string): string {
  let h = 0x811c9dc5 // FNV-1a
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  let out = ''
  for (let i = 0; i < 8; i++) {
    out += ALPHA[h % ALPHA.length]
    h = Math.floor(h / ALPHA.length) || (h ^ 0x9e3779b1) >>> 0
  }
  return out
}

/** Get or create a referral code for a user. Idempotent. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const admin = getAdmin()
  const { data: existing, error: selErr } = await admin
    .from('referral_codes')
    .select('code')
    .eq('user_id', userId)
    .maybeSingle()
  if (selErr) console.error('[lib/referral/code:getOrCreateReferralCode] select failed', selErr)
  if (existing?.code) return existing.code

  // Try deterministic slug; on collision append a short suffix.
  const base = slugFromUserId(userId)
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = attempt === 0 ? base : `${base}${ALPHA[Math.floor(Math.random() * ALPHA.length)]}${ALPHA[Math.floor(Math.random() * ALPHA.length)]}`
    const { error: insErr } = await admin.from('referral_codes').insert({ user_id: userId, code })
    if (!insErr) return code
    // 23505 collision or unique on user_id: re-select and return.
    if ((insErr as any).code === '23505') {
      const { data: row } = await admin.from('referral_codes').select('code').eq('user_id', userId).maybeSingle()
      if (row?.code) return row.code
      // code collision — try again with suffix
      continue
    }
    console.error('[lib/referral/code:getOrCreateReferralCode] insert failed', insErr)
    break
  }
  throw new Error('[lib/referral/code] failed to create referral code')
}

/** Look up the referrer user_id for a given code. */
export async function referrerUserIdForCode(code: string): Promise<string | null> {
  const admin = getAdmin()
  const { data, error } = await admin
    .from('referral_codes')
    .select('user_id')
    .eq('code', code)
    .maybeSingle()
  if (error) {
    console.error('[lib/referral/code:referrerUserIdForCode] select failed', error)
    return null
  }
  return data?.user_id ?? null
}
