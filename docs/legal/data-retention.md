# Data Retention Schedule

_Last updated: 2026-04-13._

Fulcra retains personal and operational data only as long as it is needed for
the purpose it was collected for, or as required by law. This schedule is
authoritative.

## Account and identity data

| Data                            | Retention                                                 | Basis                                      |
| ------------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| User profile (name, email)      | Life of account + 30 days post-deletion request           | Contract; GDPR Art. 17 SLA                 |
| Authentication credentials      | Life of account; hashed at rest (Supabase Auth / bcrypt)  | Contract; security                         |
| Admin audit log entries         | 2 years from event                                        | Legitimate interest (security, incident)   |
| API keys                        | Until revoked by user or account deletion                 | Contract                                   |

## Commerce and operational data

| Data                                  | Retention                                            | Basis                                     |
| ------------------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| Listings and product data             | Life of account + 30 days                            | Contract                                  |
| Listing version history               | 90 days rolling                                      | Legitimate interest (debug, rollback)     |
| Orders and transactions               | 7 years                                              | Legal (tax, accounting records)           |
| Metrics (`metrics_daily`)             | 36 months rolling                                    | Legitimate interest (trend analytics)     |
| Decisions log / agent action log      | 24 months rolling                                    | Legitimate interest (transparency)        |
| Sync jobs, sync failures, sync log    | 90 days rolling                                      | Legitimate interest (operational debug)   |
| AI insights                           | Life of account + 30 days                            | Contract                                  |

## Communications

| Data                         | Retention             | Basis                      |
| ---------------------------- | --------------------- | -------------------------- |
| Email sends (transactional)  | 12 months             | Legitimate interest (support, deliverability) |
| Marketing opt-ins / opt-outs | 6 years after opt-out | Legal (PECR / CAN-SPAM)    |
| Support correspondence       | 3 years               | Legitimate interest        |

## Billing

| Data                       | Retention | Basis                        |
| -------------------------- | --------- | ---------------------------- |
| Invoices and receipts      | 7 years   | Legal (UK tax: HMRC 6 years + year of issue) |
| Stripe payment tokens      | Handled by Stripe per their retention; Fulcra holds tokens only while subscription is active | Contract |

## OAuth channel credentials

| Data                                 | Retention                                          | Basis                          |
| ------------------------------------ | -------------------------------------------------- | ------------------------------ |
| eBay / Shopify / Amazon access tokens | Until channel is disconnected or account deleted, whichever first — then deleted within 24 hours | Contract |
| Refresh tokens                       | Same as above; encrypted at rest with env-scoped wrapping key | Contract |

## Analytics and telemetry

| Data                                 | Retention                        | Basis                           |
| ------------------------------------ | -------------------------------- | ------------------------------- |
| PostHog product-analytics events     | 13 months                        | Legitimate interest             |
| Sentry error telemetry (PII scrubbed)| 90 days                          | Legitimate interest (debug)     |
| Vercel logs                          | 30 days                          | Legitimate interest             |

## Backups

Supabase point-in-time recovery retains 7 days of WAL, so deleted data may
persist in backups for up to 7 days after hard-delete before being
overwritten. Backup contents are encrypted at rest and are not accessed in the
ordinary course of business.

## Anonymised and aggregated data

Aggregated statistics (no user-level identifiers) may be retained indefinitely
for product improvement and internal reporting. Individual-level
identifiability cannot be reconstructed from these aggregates.

---

**Questions:** <security@fulcra.com>.
