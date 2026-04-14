# Fulcra Sub-processors

_Last updated: 2026-04-13._

This list is the authoritative record of third parties that process Personal
Data on behalf of Fulcra customers. Material changes are mirrored to
<https://fulcra.com/security> and — for enterprise plans — announced by email
at least 30 days before going live.

| Processor                           | Purpose                                          | Data processed                                        | Region             | DPA                                                                  |
| ----------------------------------- | ------------------------------------------------ | ----------------------------------------------------- | ------------------ | -------------------------------------------------------------------- |
| Vercel Inc.                         | Application hosting, logs, CDN                   | Request metadata, application logs                    | US · EU regions    | <https://vercel.com/legal/dpa>                                       |
| Supabase Inc.                       | Postgres database, authentication, storage      | All customer-owned records; auth credentials (hashed) | eu-west-1 (IE)     | <https://supabase.com/privacy>                                       |
| Stripe, Inc.                        | Billing, subscription, payment tokens            | Billing name, billing address, card token (tokenised) | US · EU            | <https://stripe.com/legal/dpa>                                       |
| Resend, Inc.                        | Transactional email delivery                     | Recipient email, subject, rendered email body         | US                 | <https://resend.com/legal/dpa>                                       |
| Functional Software, Inc. (Sentry)  | Application error telemetry                      | Stack traces, error context (PII scrubbed at SDK)     | US                 | <https://sentry.io/legal/dpa/>                                       |
| PostHog Ltd (EU cloud)              | Product analytics                                | Pseudonymous usage events; IP truncated               | Frankfurt, DE      | <https://posthog.com/dpa>                                            |
| Upstash, Inc.                       | Rate-limit counters, durable queues              | Opaque keys, counters — no customer content           | EU regions         | <https://upstash.com/trust>                                          |
| Apify Technologies s.r.o.           | Competitive-intelligence scraping jobs           | Job inputs (URLs / keywords) submitted by user        | US / EU            | <https://apify.com/privacy-policy>                                   |
| Anthropic PBC                       | AI content generation (opt-in per account)       | Prompt text (listing titles, descriptions)            | US                 | <https://www.anthropic.com/legal/dpa>                                |

### Marketplace integrations (at the user's direction)

When a customer connects a sales channel, that marketplace becomes an
independent controller of the data transferred to it. Fulcra acts only on the
user's instruction to publish to the channel.

- eBay · <https://www.ebay.com/help/policies/member-behavior-policies/user-privacy-notice?id=4260>
- Shopify · <https://www.shopify.com/legal/dpa>
- Amazon SP-API · <https://developer-docs.amazon.com/sp-api/docs/policies>
- Etsy · <https://www.etsy.com/legal/privacy/>
- Walmart Marketplace · <https://corporate.walmart.com/privacy-security>

### Infrastructure we do **not** use

- No customer data is sent to consumer-grade analytics (Google Analytics, Facebook Pixel, TikTok Pixel).
- No AI training on customer data by any sub-processor. Anthropic calls are opt-in and made under a zero-retention configuration.

---

**Questions / objections:** <security@fulcra.com>.
