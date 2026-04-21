# Service Level Agreement — Template

**NOT LEGAL ADVICE.** Draft SLA attached as an addendum or exhibit to the Enterprise MSA. Starter / Growth / Scale plans use best-efforts availability per the Documentation; this SLA applies to Enterprise plans only unless explicitly referenced in an Order Form.

---

## SERVICE LEVEL AGREEMENT

This Service Level Agreement ("**SLA**") is an exhibit to the Master Service Agreement ("**MSA**") between NPX Solutions Limited ("**Palvento**") and Customer.

### 1. Definitions

- "**Services**" — as defined in the MSA.
- "**Monthly Uptime Percentage**" — (Total Minutes in Month − Unavailable Minutes) / Total Minutes in Month × 100.
- "**Unavailable Minutes**" — consecutive full minutes during which Customer is unable to access the Services due to a material failure of the Palvento-controlled infrastructure.
- "**Excluded Downtime**" — time during which the Services are unavailable due to the Exclusions in §5.
- "**Service Credit**" — the credit owed by Palvento when the Service Level is not met, calculated per §4.

### 2. Service Level commitment

Palvento will use commercially reasonable efforts to ensure the Services achieve a Monthly Uptime Percentage of **99.95%** each calendar month ("**Service Level**").

### 3. Response times

**Support-response targets** (measured from Customer's ticket submission to a substantive first response from Palvento, not an auto-acknowledgement):

| Severity | Definition | First-response target | Update cadence |
|---|---|---|---|
| **P1 — Critical** | Services fully unavailable or core functionality (listing push, order sync) broken for all Customer users | 1 hour, 24×7 | Every 2 hours until resolved |
| **P2 — Major** | Significant functionality impaired; workaround exists | 4 hours, business hours | Daily until resolved |
| **P3 — Minor** | Non-critical bug or question | 1 business day | On change of status |
| **P4 — Feature request** | Enhancement suggestion | 3 business days | On decision |

Business hours: 09:00–18:00 London time, Monday–Friday, excluding UK bank holidays.

### 4. Service Credits

If Palvento fails to meet the Service Level in a calendar month, Customer is entitled to a Service Credit calculated against the monthly fee for the affected Order Form:

| Monthly Uptime Percentage | Service Credit (% of monthly fee) |
|---|---|
| < 99.95% but ≥ 99.0% | 10% |
| < 99.0% but ≥ 95.0% | 25% |
| < 95.0% | 50% |

**Claim process.** Customer must request the Service Credit in writing within 30 days of the end of the affected month. Service Credits are applied against future invoices and are Customer's sole and exclusive remedy for any failure to meet the Service Level. Service Credits will not exceed, in aggregate, 50% of the monthly fee for any given month.

### 5. Exclusions

The Service Level does not apply, and Excluded Downtime is not counted as Unavailable Minutes, for:

(a) **Scheduled maintenance.** Announced with at least 48 hours' notice via email and the status page at `status.palvento.com`.
(b) **Emergency maintenance.** Where security, data integrity, or the interests of all customers require immediate action. Palvento will provide notice as soon as reasonably practicable.
(c) **Third-party platform failures.** Outages or degradation of marketplace APIs (Shopify, Amazon, eBay, TikTok Shop, Etsy, Walmart, Google Shopping, Facebook, etc.) or payment processors that cause feed-sync failures.
(d) **Third-party infrastructure failures outside Palvento's control** — e.g. an Amazon Web Services region-wide outage, a Supabase cluster failure, or a Vercel-level incident that Palvento is unable to work around.
(e) **Customer misconfiguration.** Downtime caused by Customer's actions, including invalid API credentials, exceeded quotas, or misapplied feed rules.
(f) **Force majeure.** Events beyond Palvento's reasonable control (as defined in the MSA).
(g) **Network issues outside Palvento's control.** Issues with Customer's internet connectivity, ISP, or corporate proxy.
(h) **Beta features.** Features explicitly marked as Beta in the Documentation are excluded from the Service Level.

### 6. Measurement

Palvento measures uptime via an external monitoring service (Uptime Robot or equivalent) probing the primary API endpoint every 60 seconds from at least two geographic regions. Uptime reports are available to Customer on request.

### 7. Notification

Palvento maintains a public status page at `status.palvento.com` (or successor URL) and will publish incident notifications there. For P1 incidents affecting Customer, Palvento will also notify the primary contact on the Order Form by email within 30 minutes of incident declaration.

### 8. Support channels

- **Email:** `support@palvento.com` (all severities)
- **Enterprise Slack / Teams:** available on Order Forms ≥ $2,000/mo
- **Emergency hotline:** available on Order Forms ≥ $10,000/mo or on request, 24×7

### 9. Review

This SLA may be updated at renewal. Mid-term, Palvento may improve (but not reduce) the Service Level or Service Credits without prior notice.

---

*Template version 1.0 — 2026-04-21. Founder-drafted + Claude-assisted. Counsel review pending. Status-page URL and support-channel details to be replaced with live URLs when the pages ship.*
