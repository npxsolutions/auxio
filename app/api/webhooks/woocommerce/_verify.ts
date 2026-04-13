import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verifies a WooCommerce webhook signature.
 * WooCommerce signs the raw request body with the per-webhook `secret`
 * using HMAC-SHA256 and sends the base64 digest in `X-WC-Webhook-Signature`.
 *
 * The secret is assigned per webhook at registration time — we store each
 * secret on `channels.metadata.webhooks[]` keyed by topic, but for simplicity
 * every registration shares a single secret (WOOCOMMERCE_WEBHOOK_SECRET env
 * or the per-channel metadata.webhook_secret).
 */
export function verifyWooHmac(rawBody: string, signature: string | null, secret: string): boolean {
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
