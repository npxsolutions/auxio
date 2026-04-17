# Security Policy

Palvento is operated by NPX Solutions (UK). We take the security of our platform
and the data our customers entrust to us seriously. If you believe you have
found a vulnerability, we want to hear from you.

## Reporting a vulnerability

Email **security@fulcra.com**.

- PGP key available on request.
- Please include reproduction steps, affected URL / endpoint, and any proof-of-concept payload.
- Do **not** open a public GitHub issue for security problems.

### Response SLA

| Stage                        | Target                          |
| ---------------------------- | ------------------------------- |
| Acknowledgement              | 2 business days                 |
| Triage + severity assignment | 5 business days                 |
| Fix timeline provided        | 10 business days                |
| Public disclosure            | Coordinated — typically 90 days |

## Scope

### In scope

- `fulcra.com` and `*.fulcra.com`
- The Palvento web application and dashboard
- Our public API endpoints under `fulcra.com/api/*`
- Authentication and authorisation flows (Supabase-backed)

### Out of scope

- Denial-of-service, distributed denial-of-service, or any volumetric load testing
- Social-engineering attacks against Palvento staff, customers, or vendors
- Physical attacks against offices or hardware
- Findings that require physical access to an unlocked device or a rooted / jailbroken device
- Vulnerabilities in third-party services we depend on (Vercel, Supabase, Stripe, Resend, Sentry, PostHog, Upstash, Apify). Report those directly to the vendor.
- Reports from automated scanners without demonstrated impact
- Missing security headers that do not lead to exploitation
- Self-XSS and clickjacking on pages that contain no sensitive state-changing actions
- Rate-limiting issues on non-authenticated, non-destructive endpoints
- Email spoofing against addresses without SPF / DMARC (we operate SPF + DKIM + DMARC on fulcra.com)

## Safe harbour

We will not pursue civil or criminal action against researchers who:

1. Act in good faith and avoid privacy violations, data destruction, and service disruption.
2. Give us reasonable time to remediate before disclosing publicly (we coordinate on a case-by-case basis, defaulting to 90 days).
3. Do not exploit a finding beyond what is necessary to demonstrate impact.
4. Do not attempt to access, modify, or exfiltrate another customer's data — use a test account you own.
5. Comply with all applicable laws.

If you are unsure whether a testing activity is in scope or safe, email us **before** you test it. We will reply.

## Rewards

Palvento does not currently operate a paid bug bounty. We do publish a
hall-of-fame (see below) and will provide a letter of acknowledgement on
request. We reserve the right to introduce a monetary programme in future and
will backfill rewards for high-severity, novel reports at our discretion.

## Hall of fame

Researchers who have made Palvento safer:

- _(None publicly listed yet — be the first to get credit here.)_

## Out-of-band questions

General security questions (DPA requests, penetration-test reports, SOC 2
evidence, questionnaires) — email **security@fulcra.com** or see our full
trust page at <https://fulcra.com/security>.

---

_Last updated: 2026-04-13._
