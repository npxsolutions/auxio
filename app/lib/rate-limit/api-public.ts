import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// Per-API-key sliding-window rate limits for the public /api/v1/* surface.
//  - Burst window: 60 requests / 60 seconds
//  - Hourly ceiling: 1000 requests / hour
// Both must pass for the request to proceed. The 429 response includes a
// Retry-After header (seconds) derived from the tighter of the two windows.

const BURST_LIMIT   = 60    // requests
const BURST_WINDOW  = '60 s'
const HOURLY_LIMIT  = 1000
const HOURLY_WINDOW = '1 h'

let _redis: Redis | null = null
const getRedis = (): Redis | null => {
  if (_redis) return _redis
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}

let _burstLimiter:  Ratelimit | null = null
let _hourlyLimiter: Ratelimit | null = null

const getBurstLimiter = (): Ratelimit | null => {
  if (_burstLimiter) return _burstLimiter
  const redis = getRedis()
  if (!redis) return null
  _burstLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(BURST_LIMIT, BURST_WINDOW),
    prefix:  'rl:api-public:burst',
    analytics: false,
  })
  return _burstLimiter
}

const getHourlyLimiter = (): Ratelimit | null => {
  if (_hourlyLimiter) return _hourlyLimiter
  const redis = getRedis()
  if (!redis) return null
  _hourlyLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(HOURLY_LIMIT, HOURLY_WINDOW),
    prefix:  'rl:api-public:hourly',
    analytics: false,
  })
  return _hourlyLimiter
}

/**
 * Derive a stable scope-key for rate limiting an authenticated v1 request.
 * Prefers the raw Bearer token (API key). Truncated/hashed so we don't leak
 * the key into Redis key space beyond necessity.
 */
function scopeKeyFromAuthHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return null
  // Simple deterministic short-hash (FNV-1a) — adequate as a Redis partition key.
  let h = 0x811c9dc5
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return `k_${h.toString(16)}`
}

export interface RateLimitVerdict {
  ok: boolean
  response?: NextResponse
}

/**
 * Check both the burst and hourly rate-limit windows. Returns a 429 response
 * when either is exceeded. Fails open (ok:true) if Upstash credentials are
 * absent — keeps local dev frictionless.
 */
export async function checkApiRateLimit(request: Request): Promise<RateLimitVerdict> {
  const authHeader = request.headers.get('authorization')
  const scope = scopeKeyFromAuthHeader(authHeader)
  if (!scope) return { ok: true } // requireApiAuth will 401 before us

  const burst  = getBurstLimiter()
  const hourly = getHourlyLimiter()
  if (!burst || !hourly) return { ok: true } // fail open — no Redis configured

  try {
    const [b, h] = await Promise.all([
      burst.limit(scope),
      hourly.limit(scope),
    ])

    if (!b.success || !h.success) {
      const resetMs = Math.max(
        (b.success ? 0 : (b.reset ?? Date.now() + 1000) - Date.now()),
        (h.success ? 0 : (h.reset ?? Date.now() + 1000) - Date.now()),
      )
      const retryAfterSec = Math.max(1, Math.ceil(resetMs / 1000))
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          detail: !b.success
            ? `Burst limit: ${BURST_LIMIT} requests per minute`
            : `Hourly limit: ${HOURLY_LIMIT} requests per hour`,
          retry_after_seconds: retryAfterSec,
        },
        { status: 429 },
      )
      response.headers.set('Retry-After', String(retryAfterSec))
      response.headers.set('X-RateLimit-Limit-Burst',  String(BURST_LIMIT))
      response.headers.set('X-RateLimit-Limit-Hourly', String(HOURLY_LIMIT))
      return { ok: false, response }
    }

    return { ok: true }
  } catch (err) {
    console.error('[rate-limit/api-public:checkApiRateLimit] limiter error', err)
    return { ok: true } // fail open on transient Redis issues
  }
}

/**
 * Convenience wrapper. Usage inside a v1 route handler:
 *
 *   export async function GET(req: NextRequest) {
 *     const rl = await checkApiRateLimit(req)
 *     if (!rl.ok) return rl.response!
 *     // ...rest of handler
 *   }
 */
