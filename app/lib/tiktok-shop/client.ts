/**
 * TikTok Shop API client.
 *
 * Gated on: TikTok Shop Partner approval + app credentials provisioned.
 * Approval typically 2–6 weeks. Until approved, calls throw NOT_CONFIGURED.
 *
 * Auth model:
 *   - Seller authorizes the app → TikTok redirects with ?code&state
 *   - Exchange code → { access_token, refresh_token, open_id, shop_id,
 *                       region, access_token_expire_in, refresh_token_expire_in }
 *   - Every subsequent API call: sign request with (app_key + secret + timestamp),
 *     include access_token, sign query params with HMAC-SHA256
 *
 * Docs:
 *   https://partner.tiktokshop.com/docv2/page/64f199707b54f02d6461a96e
 */

import { createHmac } from 'crypto'

const HOSTS = {
  US: 'https://open-api.tiktokglobalshop.com',
  UK: 'https://open-api.tiktokglobalshop.com',
  EU: 'https://open-api.tiktokglobalshop.com',
  SG: 'https://open-api.tiktokglobalshop.com',
} as const

export type TiktokRegion = keyof typeof HOSTS

export function isTiktokShopConfigured(): boolean {
  return !!(process.env.TIKTOK_SHOP_APP_KEY && process.env.TIKTOK_SHOP_APP_SECRET)
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeCode(code: string): Promise<{
  access_token: string
  access_token_expire_in: number // seconds
  refresh_token: string
  refresh_token_expire_in: number
  open_id: string
  seller_name: string
  shop_id: string
  region: string
}> {
  if (!isTiktokShopConfigured()) {
    throw new Error('TIKTOK_SHOP_NOT_CONFIGURED — set TIKTOK_SHOP_APP_KEY + TIKTOK_SHOP_APP_SECRET')
  }

  const url = new URL('https://auth.tiktok-shops.com/api/v2/token/get')
  url.searchParams.set('app_key', process.env.TIKTOK_SHOP_APP_KEY!)
  url.searchParams.set('app_secret', process.env.TIKTOK_SHOP_APP_SECRET!)
  url.searchParams.set('auth_code', code)
  url.searchParams.set('grant_type', 'authorized_code')

  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TikTok code exchange failed ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = await res.json() as { code: number; message: string; data: any }
  if (json.code !== 0) throw new Error(`TikTok API error: ${json.message}`)
  return json.data
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  access_token_expire_in: number
  refresh_token: string
  refresh_token_expire_in: number
}> {
  if (!isTiktokShopConfigured()) {
    throw new Error('TIKTOK_SHOP_NOT_CONFIGURED')
  }

  const url = new URL('https://auth.tiktok-shops.com/api/v2/token/refresh')
  url.searchParams.set('app_key', process.env.TIKTOK_SHOP_APP_KEY!)
  url.searchParams.set('app_secret', process.env.TIKTOK_SHOP_APP_SECRET!)
  url.searchParams.set('refresh_token', refreshToken)
  url.searchParams.set('grant_type', 'refresh_token')

  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TikTok refresh failed ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = await res.json() as { code: number; message: string; data: any }
  if (json.code !== 0) throw new Error(`TikTok API error: ${json.message}`)
  return json.data
}

/**
 * Sign an API request for TikTok Shop. Their signing spec:
 *   sign = HMAC_SHA256( secret,
 *                       secret + path + sorted_query_string_concat + body + secret )
 *
 * Callers should add `sign` + `timestamp` to their query then fire the request.
 */
export function signRequest(opts: {
  path: string                         // e.g. '/product/202309/products/search'
  query: Record<string, string | number>
  body?: string
}): { sign: string; timestamp: string; queryWithSign: string } {
  const secret = process.env.TIKTOK_SHOP_APP_SECRET!
  const timestamp = String(Math.floor(Date.now() / 1000))

  const query: Record<string, string> = {
    ...Object.fromEntries(Object.entries(opts.query).map(([k, v]) => [k, String(v)])),
    app_key: process.env.TIKTOK_SHOP_APP_KEY!,
    timestamp,
  }

  // TikTok spec: exclude 'sign' and 'access_token' from signature,
  // concatenate sorted keys as key+value pairs, no separators.
  const sortedKeys = Object.keys(query)
    .filter((k) => k !== 'sign' && k !== 'access_token')
    .sort()
  const joined = sortedKeys.map((k) => `${k}${query[k]}`).join('')

  const canonicalString = `${secret}${opts.path}${joined}${opts.body ?? ''}${secret}`
  const sign = createHmac('sha256', secret).update(canonicalString).digest('hex')

  const qs = new URLSearchParams({ ...query, sign })
  return { sign, timestamp, queryWithSign: qs.toString() }
}

export async function tiktokCall<T = unknown>(opts: {
  region: TiktokRegion
  path: string
  method?: 'GET' | 'POST'
  query?: Record<string, string | number>
  body?: unknown
  accessToken: string
}): Promise<T> {
  if (!isTiktokShopConfigured()) throw new Error('TIKTOK_SHOP_NOT_CONFIGURED')

  const host = HOSTS[opts.region]
  const bodyStr = opts.body ? JSON.stringify(opts.body) : ''
  const { queryWithSign } = signRequest({
    path: opts.path,
    query: opts.query ?? {},
    body: bodyStr,
  })

  const url = `${host}${opts.path}?${queryWithSign}&access_token=${encodeURIComponent(opts.accessToken)}`
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: bodyStr || undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TikTok ${opts.method ?? 'GET'} ${opts.path} ${res.status}: ${text.slice(0, 300)}`)
  }

  const json = await res.json() as { code: number; message: string; data: T }
  if (json.code !== 0) throw new Error(`TikTok API error (${json.code}): ${json.message}`)
  return json.data
}

// ─── High-level helpers ───────────────────────────────────────────────────────

export async function listOrders(opts: {
  accessToken: string
  region: TiktokRegion
  shopId: string
  createTimeFrom: number // unix seconds
  pageSize?: number
}) {
  return tiktokCall({
    region: opts.region,
    path: '/order/202309/orders/search',
    method: 'POST',
    accessToken: opts.accessToken,
    query: { shop_id: opts.shopId, page_size: opts.pageSize ?? 50 },
    body: { create_time_ge: opts.createTimeFrom },
  })
}

export async function getProduct(opts: {
  accessToken: string
  region: TiktokRegion
  shopId: string
  productId: string
}) {
  return tiktokCall({
    region: opts.region,
    path: `/product/202309/products/${opts.productId}`,
    accessToken: opts.accessToken,
    query: { shop_id: opts.shopId },
  })
}
