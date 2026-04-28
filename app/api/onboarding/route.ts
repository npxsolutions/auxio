/**
 * Onboarding API — progressive save of the 5-step onboarding wizard.
 *
 *   GET     — returns the authenticated user's current profile (for resume)
 *   PATCH   — upserts a partial profile (step save)
 *   POST    — marks the profile complete (sets onboarding_completed_at)
 *
 * Note: `user_profiles` is personal (per-user, not org-scoped). Stage C.0
 * tightened its RLS to `user_id = auth.uid()` only. Keep user_id scoping here.
 *
 * Every mutation is audit-logged via logAuditFromRequest for SOC 2 evidence.
 */

import { NextResponse } from 'next/server'
import { createClient } from '../../lib/supabase-server'
import { logAuditFromRequest } from '../../lib/audit'
import { requireActiveOrg } from '@/app/lib/org/context'
import type { UserProfile } from '../../lib/onboarding-constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PATCHABLE_FIELDS = new Set<keyof UserProfile>([
  'full_name', 'role',
  'business_name', 'country', 'business_type', 'company_number', 'tax_id',
  'shopify_url', 'gmv_band', 'current_channels',
  'primary_problem', 'free_text_context',
  'acquisition_source',
  'onboarding_step',
  'utm_source', 'utm_medium', 'utm_campaign', 'referrer',
  'is_founding_partner',
])

export async function GET() {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', ctx.user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    profile: data ?? { user_id: ctx.user.id, onboarding_step: 0 },
  })
}

export async function PATCH(request: Request) {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const body = await request.json().catch(() => ({}))
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { user_id: ctx.user.id }
  for (const [k, v] of Object.entries(body)) {
    if (PATCHABLE_FIELDS.has(k as keyof UserProfile)) patch[k] = v
  }

  const { data: before } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', ctx.user.id)
    .maybeSingle()

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(patch, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logAuditFromRequest(supabase, request, ctx.user as any, {
    action:     'user_profile.patch',
    resource:   'user_profiles',
    resourceId: ctx.user.id,
    before:     before ?? null,
    after:      data as unknown as Record<string, unknown>,
  })

  return NextResponse.json({ profile: data })
}

// Complete: marks onboarding_completed_at and bumps the step to 5.
export async function POST(request: Request) {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      onboarding_step: 5,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('user_id', ctx.user.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logAuditFromRequest(supabase, request, ctx.user as any, {
    action:     'user_profile.complete',
    resource:   'user_profiles',
    resourceId: ctx.user.id,
    before:     null,
    after:      data as unknown as Record<string, unknown>,
  })

  return NextResponse.json({ profile: data })
}
