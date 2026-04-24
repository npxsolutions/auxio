// eBay OAuth auth helpers.
//
// User access tokens expire in ~2h. We cache access_token + expiry on
// channels.metadata.ebay_access_token / ebay_token_expires_at and refresh
// via the stored refresh_token (valid ~18 months) when <60s remain.
//
// Original consent scope set is persisted on channels.metadata.ebay_scope at
// connect time — eBay requires the same (or subset) scope string at refresh.
// If missing, we fall back to the canonical read-write set used by /connect.
//
// See: https://developer.ebay.com/api-docs/static/oauth-refresh-token-request.html
//
// Concurrency note: there is no cross-invocation lock. Two concurrent crons
// calling getEbayAccessToken simultaneously could both perform a refresh —
// eBay accepts this (access tokens are not single-use). The last writer wins.
// Acceptable at current scale.

import type { SupabaseClient } from '@supabase/supabase-js'
import { syncFetch } from '../sync/http'

const EBAY_TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token'

export const EBAY_DEFAULT_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
  'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
].join(' ')

export interface EbayChannelRow {
  user_id: string
  access_token: string | null
  refresh_token: string | null
  metadata: Record<string, unknown> | null
}

export interface EbayTokenResult {
  accessToken: string
  expiresAt: number // epoch ms
}

export interface EbayHeadersInput {
  accessToken: string
  contentLanguage?: string
}

export function ebayHeaders({ accessToken, contentLanguage }: EbayHeadersInput): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (contentLanguage) h['Content-Language'] = contentLanguage
  return h
}

/**
 * Resolve a valid eBay user access token for the given channel row.
 * Returns null if refresh fails (refresh_token revoked / invalid). The caller
 * should skip the user with a warn log in that case.
 */
export async function getEbayAccessToken(
  channel: EbayChannelRow,
  supabase: SupabaseClient,
): Promise<EbayTokenResult | null> {
  const metadata = (channel.metadata as Record<string, unknown> | null) ?? {}
  const now = Date.now()

  const cachedToken = metadata.ebay_access_token as string | undefined
  const cachedExp = Number(metadata.ebay_token_expires_at as number | string | undefined)
  if (cachedToken && Number.isFinite(cachedExp) && cachedExp - now > 60_000) {
    return { accessToken: cachedToken, expiresAt: cachedExp }
  }

  const refreshToken = channel.refresh_token ?? null
  if (!refreshToken) {
    console.warn('[ebay-auth:refresh] no refresh_token on channel', channel.user_id)
    return null
  }

  const clientId = process.env.EBAY_CLIENT_ID
  const clientSecret = process.env.EBAY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('[ebay-auth:refresh] EBAY_CLIENT_ID / EBAY_CLIENT_SECRET env missing')
  }

  // eBay refresh spec: if you omit `scope`, the server returns a token with
  // the same scope originally granted. Passing a hardcoded default scope set
  // that's broader than what the user consented to fails with invalid_scope.
  //
  // Only send `scope` if we explicitly persisted one at connect time — that
  // means we know it matches the grant. Otherwise omit.
  const storedScope = metadata.ebay_scope as string | undefined
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const refreshBody: Record<string, string> = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }
  if (storedScope) refreshBody.scope = storedScope

  console.log(`[ebay-auth:refresh] refreshing token user=${channel.user_id} scope=${storedScope ? 'stored' : 'omitted'}`)
  let res: Response
  try {
    res = await syncFetch(EBAY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams(refreshBody).toString(),
      label: 'ebay.token.refresh',
    })
  } catch (err) {
    console.warn('[ebay-auth:refresh] network error', (err as Error).message)
    return null
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const msg = `HTTP ${res.status}: ${body.slice(0, 200)}`
    console.warn(`[ebay-auth:refresh] failed user=${channel.user_id} ${msg}`)
    await supabase
      .from('channels')
      .update({
        metadata: {
          ...metadata,
          ebay_auth_error: msg,
          ebay_auth_error_at: new Date().toISOString(),
        },
      })
      .eq('user_id', channel.user_id)
      .eq('type', 'ebay')
    return null
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  const token = json.access_token
  const expiresIn = Number(json.expires_in ?? 7200)
  if (!token) {
    console.warn('[ebay-auth:refresh] response missing access_token')
    return null
  }
  const expiresAt = now + Math.max(60, expiresIn - 30) * 1000

  const newMeta = { ...metadata }
  delete (newMeta as Record<string, unknown>).ebay_auth_error
  delete (newMeta as Record<string, unknown>).ebay_auth_error_at
  ;(newMeta as Record<string, unknown>).ebay_access_token = token
  ;(newMeta as Record<string, unknown>).ebay_token_expires_at = expiresAt
  // Intentionally do NOT write ebay_scope here — if it was missing, keep it
  // missing so subsequent refreshes also omit `scope` (which succeeds).
  // scope is only set at connect time where we know what the user granted.

  await supabase
    .from('channels')
    .update({ access_token: token, metadata: newMeta })
    .eq('user_id', channel.user_id)
    .eq('type', 'ebay')

  console.log(`[ebay-auth:refresh] ok user=${channel.user_id} expires_in=${expiresIn}s`)
  return { accessToken: token, expiresAt }
}
