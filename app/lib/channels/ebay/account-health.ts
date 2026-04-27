/**
 * eBay seller-standards ingestion adapter.
 *
 * Calls eBay's Analytics API getSellerStandardsProfile and maps the response
 * into our generic marketplace_account_health shape.
 *
 * Auth note: this endpoint requires the `sell.analytics.readonly` OAuth scope.
 * Existing pre-2026-04 OAuth grants do NOT include it, so the first call after
 * deploy will return 403 for those sellers. We catch that, write status =
 * 'needs_reauth', and let the retention trigger surface a reconnect prompt.
 *
 * Docs: https://developer.ebay.com/api-docs/sell/analytics/resources/seller_standards_profile/methods/getSellerStandardsProfile
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { ebayHeaders, getEbayAccessToken } from '../../ebay/auth'
import { syncFetch } from '../../sync/http'

const ENDPOINT = 'https://api.ebay.com/sell/analytics/v1/seller_standards_profile'

type ApiProfile = {
  cycle?: 'CURRENT' | 'PROJECTED'
  defaultProgram?: boolean
  evaluationDate?: string
  evaluationReason?: string
  metrics?: Array<{ name?: string; value?: number; type?: string; level?: string }>
  program?: string
  standardsLevel?: 'TOP_RATED' | 'ABOVE_STANDARD' | 'BELOW_STANDARD'
}

type ApiResponse = {
  standardsProfiles?: ApiProfile[]
}

export async function fetchEbayAccountHealth(
  admin: SupabaseClient,
  organizationId: string,
): Promise<{
  status: string
  score: number | null
  defects_count: number | null
  raw: Record<string, unknown>
}> {
  const { data: channel } = await admin
    .from('channels')
    .select('user_id, access_token, refresh_token, metadata')
    .eq('organization_id', organizationId)
    .eq('type', 'ebay')
    .eq('active', true)
    .maybeSingle()

  if (!channel?.user_id) {
    return { status: 'not_connected', score: null, defects_count: null, raw: {} }
  }

  const tokenResult = await getEbayAccessToken(
    {
      user_id:       channel.user_id as string,
      access_token:  (channel.access_token as string | null) ?? null,
      refresh_token: (channel.refresh_token as string | null) ?? null,
      metadata:      (channel.metadata as Record<string, unknown> | null) ?? {},
    },
    admin,
  )
  if (!tokenResult) {
    return { status: 'needs_reauth', score: null, defects_count: null, raw: { reason: 'token_refresh_failed' } }
  }

  let res: Response
  try {
    res = await syncFetch(ENDPOINT, {
      method: 'GET',
      headers: ebayHeaders({ accessToken: tokenResult.accessToken }),
      label: 'ebay.analytics.seller_standards',
    })
  } catch (err) {
    return { status: 'unknown', score: null, defects_count: null, raw: { error: (err as Error).message } }
  }

  if (res.status === 401 || res.status === 403) {
    // Most likely missing sell.analytics.readonly scope on the OAuth grant.
    // Surface this as a reconnect prompt rather than swallowing the error.
    return { status: 'needs_reauth', score: null, defects_count: null, raw: { http: res.status } }
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { status: 'unknown', score: null, defects_count: null, raw: { http: res.status, body: body.slice(0, 500) } }
  }

  const json = (await res.json()) as ApiResponse

  const current =
    json.standardsProfiles?.find((p) => p.cycle === 'CURRENT' && p.defaultProgram) ??
    json.standardsProfiles?.find((p) => p.cycle === 'CURRENT') ??
    json.standardsProfiles?.[0]

  const status = mapStandardsLevel(current?.standardsLevel)
  const defectsMetric = current?.metrics?.find((m) => m?.name === 'TRANSACTION_DEFECT_RATE')
  const defectsValue = typeof defectsMetric?.value === 'number' ? defectsMetric.value : null

  return {
    status,
    // eBay doesn't publish a single 0–100 score. Derive one from the defect
    // rate so dashboards have a sortable number, but keep raw for fidelity.
    score: defectsValue !== null ? Math.max(0, Math.round(100 - defectsValue * 100)) : null,
    defects_count: null,
    raw: (current ?? {}) as Record<string, unknown>,
  }
}

function mapStandardsLevel(level: ApiProfile['standardsLevel']): string {
  switch (level) {
    case 'TOP_RATED':       return 'top_rated'
    case 'ABOVE_STANDARD':  return 'above_standard'
    case 'BELOW_STANDARD':  return 'below_standard'
    default:                return 'unknown'
  }
}
