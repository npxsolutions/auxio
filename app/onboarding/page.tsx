// [onboarding:page] — server-driven 5-step onboarding machine.
// Current step is DERIVED from Supabase truth, not localStorage.
// Transitions:
//   step 1 -> 2 when channels.count > 0
//   step 2 -> 3 when listings.count > 0
//   step 3 -> 4 when cost_price set on >= 1 listing
//   step 4 -> 5 when repricing_rules.count > 0
//   step 5 -> done when any workspace_members row exists
// See node_modules/next/dist/docs/01-app/01-getting-started/* for server-component rules.

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import OnboardingClient, { type DerivedState, type StepId } from './OnboardingClient'

export const dynamic = 'force-dynamic'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

async function deriveState(): Promise<{ userId: string; state: DerivedState; step: StepId } | null> {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [channelsRes, listingsRes, costRes, rulesRes, teamRes] = await Promise.all([
      supabase.from('channels').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('active', true),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('cost_price', 'is', null),
      supabase.from('repricing_rules').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      // workspace_members is workspace-scoped; we read count where user_id = current user
      supabase.from('workspace_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    const channels  = channelsRes.count ?? 0
    const listings  = listingsRes.count ?? 0
    const costs     = costRes.count ?? 0
    const rules     = rulesRes.count ?? 0
    const team      = teamRes.count ?? 0

    const state: DerivedState = {
      channelsCount: channels,
      listingsCount: listings,
      costsSetCount: costs,
      rulesCount:    rules,
      teamCount:     team,
    }

    let step: StepId = 1
    if (channels > 0) step = 2
    if (listings > 0) step = 3
    if (costs > 0)    step = 4
    if (rules > 0)    step = 5
    if (team > 0)     step = 6 // done

    return { userId: user.id, state, step }
  } catch (err: any) {
    console.error('[onboarding:page] deriveState failed:', err?.message || err)
    return null
  }
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const derived = await deriveState()
  if (!derived) redirect('/login')

  const params = await searchParams
  const requested = params.step ? Math.max(1, Math.min(5, parseInt(params.step, 10) || 0)) as StepId : null

  // If onboarding is already complete AND no explicit step is requested, go to dashboard.
  if (derived.step >= 6 && !requested) redirect('/dashboard')

  // If they explicitly asked for a step they've completed, allow revisit.
  // Otherwise jump to the derived current step.
  const activeStep: StepId = (requested && requested <= derived.step ? requested : Math.min(derived.step, 5)) as StepId

  return <OnboardingClient initialStep={activeStep} state={derived.state} />
}
