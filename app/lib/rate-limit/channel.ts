import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Per-channel rate limit configuration. Keep generous headroom under the
// real API limits so bursts of internal cron activity don't trip 429s.
// Shopify REST: 2 calls/s per shop (standard plan); GraphQL cost bucket separate.
// eBay: varies per call, but most sell APIs bucket at ~1.5 rps for safety.
export type ChannelKey =
  | 'shopify'
  | 'ebay'
  | 'amazon'
  | 'etsy'
  | 'walmart'
  | 'facebook'
  | 'tiktok'
  | 'onbuf'
  | 'google'

const LIMITS: Record<ChannelKey, { capacity: number; windowSeconds: number }> = {
  shopify: { capacity: 2, windowSeconds: 1 },
  ebay:    { capacity: 3, windowSeconds: 2 }, // 1.5 rps
  amazon:  { capacity: 1, windowSeconds: 1 },
  etsy:    { capacity: 5, windowSeconds: 1 },
  walmart: { capacity: 2, windowSeconds: 1 },
  facebook:{ capacity: 2, windowSeconds: 1 },
  tiktok:  { capacity: 2, windowSeconds: 1 },
  onbuf:   { capacity: 1, windowSeconds: 1 },
  google:  { capacity: 5, windowSeconds: 1 },
}

let _redis: Redis | null = null
const getRedis = (): Redis | null => {
  if (_redis) return _redis
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}

const limiterCache = new Map<string, Ratelimit>()
const getLimiter = (channel: ChannelKey): Ratelimit | null => {
  const redis = getRedis()
  if (!redis) return null
  const cached = limiterCache.get(channel)
  if (cached) return cached
  const { capacity, windowSeconds } = LIMITS[channel]
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(capacity, `${windowSeconds} s`),
    prefix: `rl:channel:${channel}`,
    analytics: false,
  })
  limiterCache.set(channel, limiter)
  return limiter
}

/**
 * Reserve a slot on the per-channel per-scope bucket.
 * scopeKey is the shop domain (shopify) or userId (ebay, etc.).
 * Returns ok=false with retryAfterMs when the bucket is empty.
 */
export async function reserveChannelCall(
  channel: ChannelKey,
  scopeKey: string,
  cost: number = 1,
): Promise<{ ok: boolean; retryAfterMs?: number }> {
  const limiter = getLimiter(channel)
  if (!limiter) return { ok: true } // No Redis — fail open
  const key = `${channel}:${scopeKey}`
  // sliding-window limiter supports `rate` via repeated calls; for small cost we loop.
  let lastReset = 0
  for (let i = 0; i < Math.max(1, cost); i++) {
    const res = await limiter.limit(key)
    if (!res.success) {
      const retryAfterMs = Math.max(50, (res.reset ?? Date.now() + 1000) - Date.now())
      return { ok: false, retryAfterMs }
    }
    lastReset = res.reset ?? lastReset
  }
  return { ok: true }
}

export interface WithRateLimitOptions {
  maxRetries?: number
  baseDelayMs?: number
}

/**
 * Runs fn() under per-channel rate limiting. Retries on HTTP 429 / 5xx-style
 * errors with exponential backoff + jitter. fn must throw an Error with a
 * .status field on HTTP errors for retry logic to engage (or our http.ts
 * wrapper produces such errors automatically).
 */
export async function withRateLimit<T>(
  channel: ChannelKey,
  scopeKey: string,
  fn: () => Promise<T>,
  opts: WithRateLimitOptions = {},
): Promise<T> {
  const maxRetries = opts.maxRetries ?? 3
  const baseDelayMs = opts.baseDelayMs ?? 300
  let attempt = 0
  // Reservation retry loop (separate from error-retry loop below)
  while (true) {
    const reservation = await reserveChannelCall(channel, scopeKey)
    if (!reservation.ok) {
      const wait = reservation.retryAfterMs ?? 1000
      if (attempt >= maxRetries) throw new Error(`[rate-limit:${channel}] bucket exhausted for ${scopeKey}`)
      await new Promise(r => setTimeout(r, wait + Math.random() * 200))
      attempt++
      continue
    }
    try {
      return await fn()
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      const retryable = status === 429 || (status !== undefined && status >= 500 && status < 600)
      if (!retryable || attempt >= maxRetries) throw err
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 200
      await new Promise(r => setTimeout(r, delay))
      attempt++
    }
  }
}
