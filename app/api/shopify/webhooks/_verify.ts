import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verifies a Shopify webhook HMAC-SHA256 signature.
 *
 * Shopify signs the raw request body with your API secret key and base64-
 * encodes the result. Notes for callers:
 *   1. Read the body with `request.text()` — NEVER `request.json()` first.
 *      JSON.parse changes whitespace/key-order and breaks the signature.
 *   2. Call this from a Node.js runtime route (`export const runtime = 'nodejs'`).
 *      Edge runtime has no `node:crypto` HMAC support.
 *   3. The env var is `SHOPIFY_API_SECRET_KEY` for apps created through the
 *      Partners dashboard. For custom-app OAuth this aligns with the
 *      `SHOPIFY_CLIENT_SECRET` — we accept either to stay backward-compatible
 *      with older Vercel config.
 */
export function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) {
    console.warn('[shopify:hmac] missing x-shopify-hmac-sha256 header')
    return false
  }
  const secret =
    process.env.SHOPIFY_API_SECRET_KEY ??
    process.env.SHOPIFY_CLIENT_SECRET

  if (!secret) {
    console.error('[shopify:hmac] no secret env var set (need SHOPIFY_API_SECRET_KEY or SHOPIFY_CLIENT_SECRET)')
    return false
  }

  const computed = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')

  // Base64 strings must be same length for timingSafeEqual. If Shopify sends a
  // malformed header, bail out instead of throwing.
  const a = Buffer.from(computed, 'utf8')
  const b = Buffer.from(hmacHeader, 'utf8')
  if (a.length !== b.length) {
    console.warn(`[shopify:hmac] length mismatch — computed ${a.length}, header ${b.length}`)
    return false
  }

  const ok = timingSafeEqual(a, b)
  if (!ok) console.warn('[shopify:hmac] signature mismatch')
  return ok
}
