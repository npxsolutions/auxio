// Walmart Marketplace auth helpers.
//
// OAuth2 client-credentials against https://marketplace.walmartapis.com/v3/token.
// Access tokens live ~15 min; we cache them on channels.metadata so cron runs
// don't burn a token call on every invocation.
//
// The channels row stores base64(client_id:client_secret) in access_token
// (written by app/api/walmart/connect). We reuse that as the Basic credential.
//
// See: https://developer.walmart.com/doc/us/mp/us-mp-auth/

import type { SupabaseClient } from '@supabase/supabase-js'
import { syncFetch } from '../sync/http'

const PROD_BASE = 'https://marketplace.walmartapis.com'
const SANDBOX_BASE = 'https://sandbox.walmartapis.com'

export interface WalmartChannelRow {
  user_id: string
  access_token: string | null // base64(client_id:client_secret)
  shop_domain: string | null  // 'sandbox' | 'production'
  metadata: Record<string, unknown> | null
}

export interface WalmartTokenResult {
  accessToken: string
  baseUrl: string
  expiresAt: number // epoch ms
}

export function walmartBaseUrl(sandbox: boolean): string {
  return sandbox ? SANDBOX_BASE : PROD_BASE
}

export async function getWalmartAccessToken(
  channel: WalmartChannelRow,
  supabase: SupabaseClient,
): Promise<WalmartTokenResult> {
  const metadata = (channel.metadata as Record<string, unknown> | null) ?? {}
  const sandbox = channel.shop_domain === 'sandbox'
  const baseUrl = walmartBaseUrl(sandbox)

  const cachedToken = metadata.walmart_access_token as string | undefined
  const cachedExp   = Number(metadata.walmart_token_expires_at as number | string | undefined)
  const now = Date.now()
  if (cachedToken && Number.isFinite(cachedExp) && cachedExp - now > 60_000) {
    return { accessToken: cachedToken, baseUrl, expiresAt: cachedExp }
  }

  const credentials = channel.access_token
  if (!credentials) throw new Error('[walmart:auth] channels.access_token missing (client_id:client_secret base64)')

  const res = await syncFetch(`${baseUrl}/v3/token`, {
    method: 'POST',
    headers: {
      'Content-Type':          'application/x-www-form-urlencoded',
      'Accept':                'application/json',
      'Authorization':         `Basic ${credentials}`,
      'WM_SVC.NAME':           'Walmart Marketplace',
      'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    label: 'walmart.token',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`[walmart:auth] token HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  const token = json.access_token
  const expiresIn = Number(json.expires_in ?? 900)
  if (!token) throw new Error('[walmart:auth] token response missing access_token')
  const expiresAt = now + Math.max(60, expiresIn - 30) * 1000

  await supabase
    .from('channels')
    .update({
      metadata: { ...metadata, walmart_access_token: token, walmart_token_expires_at: expiresAt },
    })
    .eq('user_id', channel.user_id)
    .eq('type', 'walmart')

  return { accessToken: token, baseUrl, expiresAt }
}

export interface WalmartHeadersInput {
  accessToken: string
  correlationId?: string
}

export function walmartHeaders({ accessToken, correlationId }: WalmartHeadersInput): Record<string, string> {
  return {
    'WM_SEC.ACCESS_TOKEN':   accessToken,
    'WM_QOS.CORRELATION_ID': correlationId ?? crypto.randomUUID(),
    'WM_SVC.NAME':           'Walmart Marketplace',
    'Accept':                'application/json',
    'Content-Type':          'application/json',
  }
}
