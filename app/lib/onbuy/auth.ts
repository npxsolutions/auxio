// OnBuy Marketplace auth helpers.
//
// OnBuy's documented token flow: POST https://api.onbuy.com/v2/auth/request-access
// with form fields { secret_key, consumer_key } → { access_token } valid ~24h.
// Every data request sends Authorization: <access_token> (no Bearer prefix).
//
// NOTE: app/api/onbuy/connect currently uses a per-request HMAC scheme. For sync
// we follow the request-access token flow spec. If a channel row was created by
// the older connect path, the stored base64(consumer_key:secret_key) is decoded
// here to mint a token.
//
// Token is cached on channels.metadata.onbuy_access_token + onbuy_token_expires_at.

import type { SupabaseClient } from '@supabase/supabase-js'
import { syncFetch } from '../sync/http'

const ONBUY_BASE = 'https://api.onbuy.com/v2'

export interface OnBuyChannelRow {
  user_id: string
  access_token: string | null // base64(consumer_key:secret_key)
  shop_domain: string | null  // site_id as string (e.g. '2000')
  metadata: Record<string, unknown> | null
}

export interface OnBuyTokenResult {
  accessToken: string
  siteId: string
  baseUrl: string
  expiresAt: number // epoch ms
}

function decodeCreds(channel: OnBuyChannelRow): { consumerKey: string; secretKey: string } {
  if (!channel.access_token) throw new Error('[onbuy:auth] channels.access_token missing (base64 consumer_key:secret_key)')
  const decoded = Buffer.from(channel.access_token, 'base64').toString('utf8')
  const idx = decoded.indexOf(':')
  if (idx < 0) throw new Error('[onbuy:auth] credentials not colon-delimited')
  return { consumerKey: decoded.slice(0, idx), secretKey: decoded.slice(idx + 1) }
}

export async function getOnBuyAccessToken(
  channel: OnBuyChannelRow,
  supabase: SupabaseClient,
): Promise<OnBuyTokenResult> {
  const metadata = (channel.metadata as Record<string, unknown> | null) ?? {}
  const siteId =
    (metadata.onbuy_site_id as string | number | undefined)?.toString() ??
    channel.shop_domain ??
    process.env.ONBUY_SITE_ID ??
    '2000'

  const cachedToken = metadata.onbuy_access_token as string | undefined
  const cachedExp   = Number(metadata.onbuy_token_expires_at as number | string | undefined)
  const now = Date.now()
  if (cachedToken && Number.isFinite(cachedExp) && cachedExp - now > 60_000) {
    return { accessToken: cachedToken, siteId, baseUrl: ONBUY_BASE, expiresAt: cachedExp }
  }

  const { consumerKey, secretKey } = decodeCreds(channel)
  const res = await syncFetch(`${ONBUY_BASE}/auth/request-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept':       'application/json',
    },
    body: new URLSearchParams({ secret_key: secretKey, consumer_key: consumerKey }).toString(),
    label: 'onbuy.token',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`[onbuy:auth] token HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  const token = json.access_token
  if (!token) throw new Error('[onbuy:auth] token response missing access_token')
  // OnBuy tokens documented as 24h; allow override via expires_in if present.
  const expiresInSec = Number(json.expires_in ?? 24 * 3600)
  const expiresAt = now + Math.max(300, expiresInSec - 300) * 1000

  await supabase
    .from('channels')
    .update({
      metadata: {
        ...metadata,
        onbuy_access_token: token,
        onbuy_token_expires_at: expiresAt,
        onbuy_site_id: siteId,
      },
    })
    .eq('user_id', channel.user_id)
    .eq('type', 'onbuy')

  return { accessToken: token, siteId, baseUrl: ONBUY_BASE, expiresAt }
}

export interface OnBuyHeadersInput {
  accessToken: string
}

export function onbuyHeaders({ accessToken }: OnBuyHeadersInput): Record<string, string> {
  return {
    'Authorization': accessToken, // OnBuy non-standard: no Bearer prefix
    'Accept':        'application/json',
  }
}

export { ONBUY_BASE }
