# Data Processing Agreement — Template

> **Template only.** This document is provided as a starting point. Replace
> party names, jurisdictions, and effective dates, and have it reviewed and
> signed by counsel before executing. Nothing in this template constitutes
> legal advice.

**Effective date:** `____________`

## 1. Parties

This Data Processing Agreement ("DPA") is entered into between:

- **Controller:** `[Customer legal name]`, of `[Customer address]` ("Customer"), and
- **Processor:** NPX Solutions Ltd, operator of Fulcra, of `[Registered address, United Kingdom]` ("Fulcra").

Each a "Party" and together the "Parties". This DPA supplements and is
incorporated into the Fulcra Terms of Service agreed between the Parties (the
"Principal Agreement"). In the event of conflict, the terms of this DPA prevail
in respect of the processing of Personal Data.

## 2. Definitions

Capitalised terms not defined herein have the meaning given in Regulation (EU)
2016/679 ("GDPR") and, where applicable, the UK GDPR and the Data Protection
Act 2018. "Personal Data", "Data Subject", "Processing", "Controller", and
"Processor" have the meanings given in Art. 4 GDPR.

## 3. Subject matter and duration

Fulcra processes Personal Data on behalf of the Customer solely to provide the
Fulcra service (multi-channel commerce management) in accordance with the
Principal Agreement. This DPA is effective for as long as Fulcra processes
Personal Data on behalf of the Customer.

## 4. Nature and purpose of processing

| Item                  | Detail                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nature of processing  | Collection, storage, structuring, retrieval, transmission to marketplaces, and erasure of catalogue, listing, order, and account data.                                |
| Purpose of processing | Operation of the Fulcra service — publishing listings, synchronising inventory, processing orders, generating analytics, and transactional communications.           |
| Categories of Data Subjects | Customer's employees and authorised users; end-customers of the Customer (order recipients).                                                                     |
| Categories of Personal Data | Names, business email addresses, authentication credentials, order shipping and billing addresses, phone numbers, marketplace account identifiers, transaction metadata. |
| Special-category data | None processed in the ordinary course. Customer must not upload special-category data to Fulcra.                                                                      |

## 5. Roles

The Customer is the Controller of the Personal Data. Fulcra acts as Processor
on the Customer's documented instructions, which are the Principal Agreement,
this DPA, and any written instructions the Customer gives that are reasonable
and compatible with the service.

## 6. Obligations of Fulcra

Fulcra shall:

- Process Personal Data only on documented instructions from the Customer, except where required by law.
- Ensure persons authorised to process Personal Data are bound by confidentiality.
- Implement and maintain the technical and organisational measures described in Annex A.
- Assist the Customer in fulfilling Data-Subject-rights requests (Art. 12–22 GDPR).
- Assist the Customer in meeting obligations under Art. 32–36 GDPR.
- Notify the Customer of a Personal Data breach without undue delay, and no later than 72 hours after becoming aware.
- On termination, delete or return all Personal Data at the Customer's choice, save where retention is required by law.
- Make available all information necessary to demonstrate compliance with Art. 28 GDPR and allow for, and contribute to, audits.

## 7. Sub-processors

The Customer provides general authorisation for Fulcra to engage
sub-processors. The current list is maintained at
`https://fulcra.com/security` and in `docs/legal/sub-processors.md`. Fulcra
shall:

- Impose on each sub-processor, in writing, data-protection obligations
  substantially equivalent to those in this DPA.
- Give the Customer at least 30 days' notice of any intended addition or
  replacement of a sub-processor. The Customer may object on reasonable
  data-protection grounds, in which case the Parties shall work in good faith
  to resolve the objection or, failing that, the Customer may terminate the
  Principal Agreement without penalty.

## 8. International transfers

Where Personal Data is transferred outside the UK / EEA, Fulcra relies on the
European Commission's Standard Contractual Clauses (Module 2 or 3 as
applicable) and the UK International Data Transfer Addendum, which are hereby
incorporated by reference. Fulcra performs a transfer-impact assessment for
each sub-processor and maintains supplementary measures (encryption in transit
and at rest, pseudonymisation where proportionate).

## 9. Security measures

Fulcra maintains the measures described in Annex A, including but not limited
to: encryption in transit (TLS 1.3) and at rest (AES-256), row-level access
authorisation, least-privilege administrative access, documented backup and
recovery with testing, vulnerability management, and an incident-response
procedure. Measures are reviewed periodically and updated to reflect the state
of the art.

## 10. Data-Subject requests

Fulcra makes available in-product tooling that enables the Customer to
fulfil Data-Subject access, portability, and erasure requests on its own
timeline. Where the Customer cannot fulfil a request without Fulcra's
assistance, Fulcra will respond within a commercially reasonable period and
without undue delay.

## 11. Audits

Fulcra provides, on request and under NDA, its most recent third-party
attestations (e.g. SOC 2 Type II once issued) and a completed SIG-lite. On
reasonable notice and no more than once per year, the Customer may request a
targeted audit. The Parties will agree scope, timing, and reasonable costs in
advance.

## 12. Term and termination

This DPA terminates automatically on termination of the Principal Agreement.
On termination, Fulcra shall delete all Personal Data within 30 days, save
where retention is required by law (see `data-retention.md`). A certificate of
destruction is available on request.

## 13. Liability, governing law, and venue

Liability under this DPA is governed by the liability terms of the Principal
Agreement. This DPA is governed by the laws of England and Wales, and the
Parties submit to the exclusive jurisdiction of the courts of England and
Wales, unless mandatory local law provides otherwise.

---

## Annex A — Technical and organisational measures

_(Summary — full detail maintained at https://fulcra.com/security.)_

- Encryption in transit: TLS 1.3; HSTS preload.
- Encryption at rest: AES-256 on managed Postgres and build artefacts.
- Access control: row-level security on all tables; least-privilege engineering access brokered through managed roles; MFA enforced.
- Network: no direct production shell access; all egress over TLS.
- Vulnerability management: automated dependency scanning; quarterly manual review; security-advisor monitoring.
- Monitoring: centralised error telemetry, audit logging, and anomaly alerting.
- Incident response: 24-hour triage, 72-hour regulator notification where required.
- Personnel: background checks where lawful; confidentiality obligations; annual security training.

---

## Annex B — Signature

| For the Customer            | For Fulcra (NPX Solutions Ltd)   |
| --------------------------- | -------------------------------- |
| Name: `____________________`| Name: `____________________`     |
| Title: `___________________`| Title: `___________________`     |
| Date: `____________________`| Date: `____________________`     |
| Signature:                  | Signature:                       |
