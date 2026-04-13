import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verifies a BigCommerce webhook signature.
 * BigCommerce sends an `X-BC-Webhook-HMAC-SHA256` header containing the
 * base64 HMAC-SHA256 digest of the raw request body, signed with the
 * webhook's `client_secret` (same as the BigCommerce app client secret,
 * stored in BIGCOMMERCE_CLIENT_SECRET).
 */
export function verifyBigCommerceHmac(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(signature)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
