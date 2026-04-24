/**
 * Amazon Selling Partner API (SP-API) client.
 *
 * Gated on: SP-API developer profile approved + LWA client id/secret set.
 * Approval takes 2–4 weeks and requires a security audit. Until approved,
 * every call below returns a sentinel NOT_CONFIGURED rather than attempting
 * network I/O.
 *
 * Auth flow: LWA (Login-with-Amazon) refresh token → access token → calls
 * signed with SigV4 for certain regions. SP-API as of 2023 removed the MWS-era
 * AWS role assumption for most endpoints.
 *
 * References:
 *   https://developer-docs.amazon.com/sp-api/
 *   https://github.com/amzn/selling-partner-api-docs
 */

type LwaTokenBundle = {
  access_token: string
  token_type: string
  expires_in: number   // seconds
  issued_at: number    // ms epoch for cache math
}

const SP_API_HOSTS: Record<string, string> = {
  'NA': 'https://sellingpartnerapi-na.amazon.com',
  'EU': 'https://sellingpartnerapi-eu.amazon.com',
  'FE': 'https://sellingpartnerapi-fe.amazon.com', // Far East
}

const LWA_TOKEN_URL = 'https://api.amazon.com/auth/o2/token'

// Marketplace IDs — common ones; extend as needed.
export const AMAZON_MARKETPLACES = {
  US: 'ATVPDKIKX0DER',
  CA: 'A2EUQ1WTGCTBG2',
  MX: 'A1AM78C64UM0Y8',
  BR: 'A2Q3Y263D00KWC',
  UK: 'A1F83G8C2ARO7P',
  DE: 'A1PA6795UKMFR9',
  FR: 'A13V1IB3VIYZZH',
  ES: 'A1RKKUPIHCS9HS',
  IT: 'APJ6JRA9NG5V4',
  NL: 'A1805IZSGTT6HS',
  SE: 'A2NODRKZP88ZB9',
  PL: 'A1C3SOZRARQ6R3',
  JP: 'A1VC38T7YXB528',
  AU: 'A39IBJ37TRP1C6',
  SG: 'A19VAU5U5O7RUS',
  IN: 'A21TJRUUN4KGV',
} as const

export type AmazonRegion = keyof typeof SP_API_HOSTS

export function isAmazonConfigured(): boolean {
  return !!(process.env.AMAZON_LWA_CLIENT_ID && process.env.AMAZON_LWA_CLIENT_SECRET)
}

/**
 * Exchange an LWA refresh token for a short-lived access token.
 * Callers should cache the result for ~55 minutes (access_token TTL is 1h).
 */
export async function getAccessToken(refreshToken: string): Promise<LwaTokenBundle> {
  if (!isAmazonConfigured()) {
    throw new Error('AMAZON_NOT_CONFIGURED — set AMAZON_LWA_CLIENT_ID + AMAZON_LWA_CLIENT_SECRET')
  }

  const res = await fetch(LWA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.AMAZON_LWA_CLIENT_ID!,
      client_secret: process.env.AMAZON_LWA_CLIENT_SECRET!,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`LWA token exchange failed (${res.status}): ${body.slice(0, 200)}`)
  }

  const json = (await res.json()) as {
    access_token: string
    token_type: string
    expires_in: number
  }
  return { ...json, issued_at: Date.now() }
}

export type SpApiCallOpts = {
  region: AmazonRegion
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  query?: Record<string, string | number | undefined>
  body?: unknown
  accessToken: string
}

/**
 * Minimal SP-API call wrapper.
 *
 * Handles:
 *   - building the authenticated URL
 *   - x-amz-access-token header
 *   - JSON body encoding
 *   - 429/503 → throw SpApiRateLimitError so the caller can retry with backoff
 *
 * Does NOT handle SigV4 — SP-API as of 2024 no longer requires AWS credentials
 * for the OAuth flow, only the LWA token. Older endpoints that still need
 * SigV4 are out of scope for the MVP.
 */
export async function spApiCall<T = unknown>(opts: SpApiCallOpts): Promise<T> {
  const host = SP_API_HOSTS[opts.region]
  if (!host) throw new Error(`unknown region ${opts.region}`)

  const url = new URL(opts.path, host)
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined) continue
      url.searchParams.set(k, String(v))
    }
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? 'GET',
    headers: {
      'x-amz-access-token': opts.accessToken,
      'Content-Type': 'application/json',
      'User-Agent': 'Palvento/1.0 (language=nodejs)',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  if (res.status === 429 || res.status === 503) {
    throw new SpApiRateLimitError(`Amazon throttled ${res.status}`, res.headers.get('retry-after'))
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`SP-API ${opts.method ?? 'GET'} ${opts.path} failed ${res.status}: ${body.slice(0, 300)}`)
  }

  return (await res.json()) as T
}

export class SpApiRateLimitError extends Error {
  constructor(message: string, public retryAfter: string | null) {
    super(message)
    this.name = 'SpApiRateLimitError'
  }
}

// ─── High-level helpers ───────────────────────────────────────────────────────

export async function listRecentOrders(opts: {
  accessToken: string
  region: AmazonRegion
  marketplaceId: string
  createdAfter: string // ISO
}) {
  return spApiCall({
    region: opts.region,
    path: '/orders/v0/orders',
    accessToken: opts.accessToken,
    query: {
      MarketplaceIds: opts.marketplaceId,
      CreatedAfter: opts.createdAfter,
    },
  })
}

export async function getOrderItems(opts: {
  accessToken: string
  region: AmazonRegion
  orderId: string
}) {
  return spApiCall({
    region: opts.region,
    path: `/orders/v0/orders/${opts.orderId}/orderItems`,
    accessToken: opts.accessToken,
  })
}

export async function submitInventoryFeed(opts: {
  accessToken: string
  region: AmazonRegion
  marketplaceId: string
  xmlBody: string
}) {
  // SP-API's Feeds API — the modern replacement for legacy MWS feeds.
  // 3-step flow: createFeedDocument → upload XML to returned URL → createFeed.
  return spApiCall({
    region: opts.region,
    path: '/feeds/2021-06-30/documents',
    method: 'POST',
    accessToken: opts.accessToken,
    body: { contentType: 'text/xml; charset=UTF-8' },
  })
}
