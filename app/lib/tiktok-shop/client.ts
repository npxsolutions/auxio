/**
 * TikTok Shop API client.
 *
 * Gated on: TikTok Shop Partner approval + app credentials provisioned.
 * Approval typically 2–6 weeks. Until approved, calls throw NOT_CONFIGURED.
 *
 * Auth model:
 *   1. Seller authorizes the app → TikTok redirects with ?code&state
 *   2. exchangeCode(code) → { access_token, refresh_token, open_id, seller_name,
 *                             seller_base_region, access_token_expire_in, ... }
 *   3. getAuthorizedShops(accessToken) → shops[], each with { id, cipher, region }
 *      — shop_cipher is REQUIRED on almost every 202309+ API call.
 *   4. Every subsequent call: sign with (app_key + app_secret + timestamp),
 *      pass access_token via `x-tts-access-token` header (NOT query param).
 *
 * See docs/integrations/tiktok/shop-partner.md for full reference.
 */

import { createHmac } from 'crypto'

const API_HOST  = 'https://open-api.tiktokglobalshop.com'
const AUTH_HOST = 'https://auth.tiktok-shops.com'

export type TiktokRegion = 'US' | 'GB' | 'DE' | 'FR' | 'IT' | 'ES' | 'IE'
                         | 'SG' | 'MY' | 'PH' | 'TH' | 'VN' | 'ID'
                         | 'MX' | 'BR' | 'JP'

export function isTiktokShopConfigured(): boolean {
  return !!(process.env.TIKTOK_SHOP_APP_KEY && process.env.TIKTOK_SHOP_APP_SECRET)
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

export type TiktokTokens = {
  access_token: string
  access_token_expire_in: number   // absolute epoch seconds (misleading name)
  refresh_token: string
  refresh_token_expire_in: number  // absolute epoch seconds
  open_id: string
  seller_name?: string
  seller_base_region?: string      // ISO-2
  user_type?: number               // 0 = merchant
  granted_scopes?: string[]
  // Back-compat fields some API versions still echo:
  shop_id?: string
  region?: string
}

export async function exchangeCode(code: string): Promise<TiktokTokens> {
  if (!isTiktokShopConfigured()) {
    throw new Error('TIKTOK_SHOP_NOT_CONFIGURED — set TIKTOK_SHOP_APP_KEY + TIKTOK_SHOP_APP_SECRET')
  }

  const url = new URL(`${AUTH_HOST}/api/v2/token/get`)
  url.searchParams.set('app_key', process.env.TIKTOK_SHOP_APP_KEY!)
  url.searchParams.set('app_secret', process.env.TIKTOK_SHOP_APP_SECRET!)
  url.searchParams.set('auth_code', code)
  url.searchParams.set('grant_type', 'authorized_code')

  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TikTok code exchange failed ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = await res.json() as { code: number; message: string; data: TiktokTokens }
  if (json.code !== 0) throw new Error(`TikTok API error: ${json.message}`)
  return json.data
}

export async function refreshAccessToken(refreshToken: string): Promise<TiktokTokens> {
  if (!isTiktokShopConfigured()) throw new Error('TIKTOK_SHOP_NOT_CONFIGURED')

  const url = new URL(`${AUTH_HOST}/api/v2/token/refresh`)
  url.searchParams.set('app_key', process.env.TIKTOK_SHOP_APP_KEY!)
  url.searchParams.set('app_secret', process.env.TIKTOK_SHOP_APP_SECRET!)
  url.searchParams.set('refresh_token', refreshToken)
  url.searchParams.set('grant_type', 'refresh_token')

  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TikTok refresh failed ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = await res.json() as { code: number; message: string; data: TiktokTokens }
  if (json.code !== 0) throw new Error(`TikTok API error: ${json.message}`)
  return json.data
}

// ─── Request signing ──────────────────────────────────────────────────────────

/**
 * Sign an API request for TikTok Shop.
 *
 *   canonical = app_secret + path + sorted_query_kv_concat + body + app_secret
 *   sign = HMAC_SHA256(app_secret, canonical) as lowercase hex
 *
 * Rules:
 *   - Exclude `sign` AND `access_token` from the signed query
 *   - Sort keys ASCII-ascending, concat as {k}{v}{k}{v}… with no separators
 *   - Body is included only for Content-Type: application/json with non-empty body
 *   - Sign raw (unencoded) values; encode only when sending
 */
export function signRequest(opts: {
  path: string
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

  const sortedKeys = Object.keys(query)
    .filter((k) => k !== 'sign' && k !== 'access_token')
    .sort()
  const joined = sortedKeys.map((k) => `${k}${query[k]}`).join('')

  const canonicalString = `${secret}${opts.path}${joined}${opts.body ?? ''}${secret}`
  const sign = createHmac('sha256', secret).update(canonicalString).digest('hex')

  const qs = new URLSearchParams({ ...query, sign })
  return { sign, timestamp, queryWithSign: qs.toString() }
}

// ─── Core API call ────────────────────────────────────────────────────────────

export async function tiktokCall<T = unknown>(opts: {
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  query?: Record<string, string | number>
  body?: unknown
  accessToken: string
}): Promise<T> {
  if (!isTiktokShopConfigured()) throw new Error('TIKTOK_SHOP_NOT_CONFIGURED')

  const bodyStr = opts.body ? JSON.stringify(opts.body) : ''
  const { queryWithSign } = signRequest({
    path: opts.path,
    query: opts.query ?? {},
    body: bodyStr,
  })

  const url = `${API_HOST}${opts.path}?${queryWithSign}`
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type':       'application/json',
      'x-tts-access-token': opts.accessToken,
      'User-Agent':         'Palvento/1.0 (+https://palvento.com)',
    },
    body: bodyStr || undefined,
  })

  const text = await res.text()
  let json: { code: number; message: string; data: T; request_id?: string }
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`TikTok ${opts.method ?? 'GET'} ${opts.path} ${res.status}: non-JSON response: ${text.slice(0, 200)}`)
  }

  if (!res.ok || json.code !== 0) {
    throw new Error(
      `TikTok ${opts.method ?? 'GET'} ${opts.path} ${res.status} code=${json.code} msg=${json.message} req=${json.request_id ?? 'n/a'}`,
    )
  }
  return json.data
}

// ─── Shop discovery (call immediately after exchangeCode) ─────────────────────

export type TiktokShop = {
  id: string                                       // shop_id
  name: string
  region: string                                   // ISO-2
  seller_type: 'CROSS_BORDER' | 'LOCAL' | string
  cipher: string                                   // REQUIRED on 202309+ API calls
}

export async function getAuthorizedShops(accessToken: string): Promise<TiktokShop[]> {
  const data = await tiktokCall<{ shops: TiktokShop[] }>({
    path: '/authorization/202309/shops',
    accessToken,
  })
  return data.shops
}

// ─── High-level helpers ───────────────────────────────────────────────────────

export async function listOrders(opts: {
  accessToken: string
  shopCipher: string
  createTimeFrom: number // unix seconds
  pageSize?: number
}) {
  return tiktokCall<{
    next_page_token?: string
    total_count?: number
    orders: Array<Record<string, unknown>>
  }>({
    path: '/order/202309/orders/search',
    method: 'POST',
    accessToken: opts.accessToken,
    query: { shop_cipher: opts.shopCipher, page_size: opts.pageSize ?? 50 },
    body: { create_time_ge: opts.createTimeFrom, sort_field: 'create_time', sort_order: 'DESC' },
  })
}

export async function getProduct(opts: {
  accessToken: string
  shopCipher: string
  productId: string
}) {
  return tiktokCall<Record<string, unknown>>({
    path: `/product/202309/products/${opts.productId}`,
    accessToken: opts.accessToken,
    query: { shop_cipher: opts.shopCipher },
  })
}
