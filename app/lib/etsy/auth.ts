// Etsy v3 Open API auth helpers.
//
// Etsy's v3 requests need two headers when acting on behalf of a user:
//   - x-api-key:    "<keystring>:<shared_secret>"  (UTF-8)
//   - Authorization: Bearer <numeric_user_id>.<access_token>
//
// Access tokens expire in 1h; refresh tokens in 90d. We cache the access
// token + expiry on channels.metadata and refresh via POST
// https://api.etsy.com/v3/public/oauth/token when <60s remain.
//
// Important: Etsy ROTATES the refresh_token on every refresh — we persist the
// new one back to channels.refresh_token. Losing a rotated refresh_token will
// force the user to reconnect.
//
// Concurrency note: there is no cross-invocation lock. Two concurrent crons
// calling getEtsyAccessToken could race — one refresh will invalidate the
// other's returned refresh_token. Acceptable at current scale; the loser
// simply re-refreshes next cycle.
//
// See: https://developers.etsy.com/documentation/essentials/authentication
//
// Keep this file tiny and side-effect-free so it can be imported from both
// server routes and edge contexts. Env reads are lazy per-call.

import type { SupabaseClient } from '@supabase/supabase-js'
import { syncFetch } from '../sync/http'

const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token'

export function etsyApiKeyHeader(): string {
  const keystring = process.env.ETSY_KEYSTRING
  const shared = process.env.ETSY_SHARED_SECRET
  if (!keystring) throw new Error('[etsy:auth] ETSY_KEYSTRING not set')
  if (!shared)    throw new Error('[etsy:auth] ETSY_SHARED_SECRET not set')
  return `${keystring}:${shared}`
}

export function etsyBearer(userIdNumeric: string | number, accessToken: string): string {
  if (!userIdNumeric) throw new Error('[etsy:auth] missing numeric user id')
  if (!accessToken)   throw new Error('[etsy:auth] missing access token')
  return `${String(userIdNumeric)}.${accessToken}`
}

export interface EtsyHeadersInput {
  userId: string | number
  accessToken: string
}

export function etsyHeaders({ userId, accessToken }: EtsyHeadersInput): Record<string, string> {
  return {
    'x-api-key':     etsyApiKeyHeader(),
    'Authorization': `Bearer ${etsyBearer(userId, accessToken)}`,
    'Accept':        'application/json',
  }
}

export interface EtsyChannelRow {
  user_id: string
  access_token: string | null
  refresh_token: string | null
  metadata: Record<string, unknown> | null
}

export interface EtsyTokenResult {
  accessToken: string
  expiresAt: number // epoch ms
}

/**
 * Resolve a valid Etsy user access token for the given channel row.
 * Returns null if refresh fails (refresh_token revoked / invalid / rotated-away).
 * Persists the rotated refresh_token on every successful refresh.
 */
export async function getEtsyAccessToken(
  channel: EtsyChannelRow,
  supabase: SupabaseClient,
): Promise<EtsyTokenResult | null> {
  const metadata = (channel.metadata as Record<string, unknown> | null) ?? {}
  const now = Date.now()

  const cachedToken = (metadata.etsy_access_token as string | undefined) ?? channel.access_token ?? undefined
  const cachedExp = Number(metadata.etsy_token_expires_at as number | string | undefined)
  if (cachedToken && Number.isFinite(cachedExp) && cachedExp - now > 60_000) {
    return { accessToken: cachedToken, expiresAt: cachedExp }
  }

  const refreshToken = channel.refresh_token ?? null
  if (!refreshToken) {
    console.warn('[etsy-auth:refresh] no refresh_token on channel', channel.user_id)
    return null
  }

  const clientId = process.env.ETSY_CLIENT_ID ?? process.env.ETSY_KEYSTRING
  if (!clientId) {
    throw new Error('[etsy-auth:refresh] ETSY_CLIENT_ID / ETSY_KEYSTRING env missing')
  }

  console.log(`[etsy-auth:refresh] refreshing token user=${channel.user_id}`)
  let res: Response
  try {
    res = await syncFetch(ETSY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-key': clientId,
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken,
      }),
      label: 'etsy.token.refresh',
    })
  } catch (err) {
    console.warn('[etsy-auth:refresh] network error', (err as Error).message)
    return null
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const msg = `HTTP ${res.status}: ${body.slice(0, 200)}`
    console.warn(`[etsy-auth:refresh] failed user=${channel.user_id} ${msg}`)
    await supabase
      .from('channels')
      .update({
        metadata: {
          ...metadata,
          etsy_auth_error: msg,
          etsy_auth_error_at: new Date().toISOString(),
        },
      })
      .eq('user_id', channel.user_id)
      .eq('type', 'etsy')
    return null
  }

  const json = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
  }
  const token = json.access_token
  const newRefresh = json.refresh_token
  const expiresIn = Number(json.expires_in ?? 3600)
  if (!token || !newRefresh) {
    console.warn('[etsy-auth:refresh] response missing access_token or refresh_token')
    return null
  }
  const expiresAt = now + Math.max(60, expiresIn - 30) * 1000

  const newMeta = { ...metadata }
  delete (newMeta as Record<string, unknown>).etsy_auth_error
  delete (newMeta as Record<string, unknown>).etsy_auth_error_at
  ;(newMeta as Record<string, unknown>).etsy_access_token = token
  ;(newMeta as Record<string, unknown>).etsy_token_expires_at = expiresAt

  await supabase
    .from('channels')
    .update({
      access_token: token,
      refresh_token: newRefresh,
      metadata: newMeta,
    })
    .eq('user_id', channel.user_id)
    .eq('type', 'etsy')

  console.log(`[etsy-auth:refresh] ok user=${channel.user_id} expires_in=${expiresIn}s (refresh_token rotated)`)
  return { accessToken: token, expiresAt }
}
