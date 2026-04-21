# SSO / SAML / SCIM — implementation scope

*Drafted 2026-04-21. Not a build ticket — a scope doc. Build when the first Enterprise prospect's requirement sheet locks it in. Per the 10-item audit, this is correctly deferred until real enterprise demand lands.*

## Why this doc exists

`app/enterprise/page.tsx` advertises **SSO / SAML + SCIM provisioning** as part of the Enterprise tier. `app/security/page.tsx` marks SOC 2 Type II as *in progress* with Q3 2026 target. When the first enterprise prospect hands over their security questionnaire, our answer needs to match what we shipped on the pages. This scope locks what "ship SSO" actually means for Palvento so we're not arguing requirements during a sales cycle.

## Feature scope

**In scope for V1:**
1. SAML 2.0 SP-initiated SSO (Service Provider initiated — user hits Palvento login, we redirect to IdP)
2. Okta, Azure AD (Entra ID), and Google Workspace as tested IdPs — generic SAML 2.0 as a fallback for any other IdP
3. Just-in-time (JIT) user provisioning — when a new user signs in via SAML, create the `users` row with attributes from the IdP assertion
4. SCIM 2.0 provisioning — user create / update / deactivate from the IdP
5. Per-tenant IdP configuration stored against the customer org
6. Admin UI in `/admin/enterprise/[id]` to upload the IdP metadata XML and test the connection
7. Customer-side UI — one button "Sign in with SSO" on the login page, discovered by email domain

**Out of scope for V1:**
- IdP-initiated SSO (user starts from the IdP dashboard — deferrable, most enterprises accept SP-only)
- Multi-IdP per tenant (some customers need two IdPs — can add later)
- OIDC as an alternative to SAML (most enterprise IdPs still prefer SAML; OIDC is Series-B work)
- OpenID Federation / custom audiences
- Just-in-time role assignment (V1 assumes all SSO users land in the default role; role mapping later)

## Technical approach

**Auth provider:** Use **Supabase Auth SSO** (GA as of 2024). Reasons:
- We already use Supabase for auth on the standard flow (`app/lib/supabase-server.ts`, `app/lib/supabase-client.ts`)
- Supabase SSO supports SAML 2.0 out of the box with the `supabase.auth.signInWithSSO()` primitive
- SCIM 2.0 provisioning is on Supabase's roadmap but not GA — for SCIM V1 we may need an intermediate bridge using a third-party (WorkOS) or a lightweight internal implementation that reads SCIM endpoints and syncs to Supabase's user table

**Alternative auth provider if Supabase SSO doesn't satisfy a prospect's IdP:** WorkOS. 2-week rewrite, higher ongoing cost, full SAML + SCIM + OIDC + directory sync + audit log. Only invoke if a prospect's requirements exceed Supabase's SSO feature set.

**Data model changes:**
```sql
-- New tables (migration to be drafted):
create table sso_configurations (
  id uuid primary key default gen_random_uuid(),
  enterprise_org_id uuid references enterprise_orgs(id) not null,
  idp_type text check (idp_type in ('okta','azure','google','generic_saml')) not null,
  idp_metadata_url text,
  idp_metadata_xml text,
  entity_id text not null,
  scim_endpoint text,
  scim_bearer_token_hash text,
  default_role text not null default 'member',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing `users` table additions:
alter table users add column if not exists
  sso_provider text,
  sso_external_id text,
  last_sso_login_at timestamptz;
```

**Routes to add:**
- `POST /api/admin/enterprise/[id]/sso/configure` — upload IdP metadata, validate, store
- `POST /api/admin/enterprise/[id]/sso/test` — validate a test assertion end-to-end
- `GET /api/auth/sso/start?email=...` — discover IdP by email domain, redirect to IdP
- `POST /api/auth/sso/callback` — Supabase handles most of this; we wrap for audit + JIT
- `POST /api/scim/v2/Users` (+ PATCH, DELETE) — if SCIM V1 is in scope; behind bearer auth

**Security questionnaire reference answers** (for the first enterprise sales cycle):
- Protocol: SAML 2.0 (OIDC roadmap)
- Bindings: HTTP-POST, HTTP-Redirect
- Signing: required on AuthnRequest and Response
- Encryption: optional on Response (supported)
- NameID format: EmailAddress (primary), Persistent (supported)
- Attribute mapping: configurable per IdP
- Session timeout: 8 hours (configurable per tenant, 15 min – 24 hr)
- Logout: SP-initiated logout supported; IdP-initiated in V2
- Metadata URL: Palvento SP metadata at `palvento.com/.well-known/saml/metadata.xml`

## Build estimate

| Phase | Scope | Time |
|---|---|---|
| 1. Supabase SSO evaluation | Configure a test IdP (Okta dev account) and validate sign-in E2E via Supabase-hosted SSO | 2 days |
| 2. Data model + admin UI | Migration + `/admin/enterprise/[id]` SSO panel (upload metadata, test) | 3 days |
| 3. Customer-side discovery | Login-page "Sign in with SSO", email-domain discovery, JIT row creation | 2 days |
| 4. SCIM 2.0 endpoints | Users create/update/delete from IdP, token-authenticated | 4 days |
| 5. E2E test suite | Playwright flows for Okta, Azure, Google Workspace | 2 days |
| 6. Documentation | Security-questionnaire references + customer-facing setup guide | 1 day |
| **Total** | | **~14 engineer days** |

If SCIM slips to V1.1, total drops to ~10 days.

## Trigger conditions — when to start this build

Start the build only when:

1. An enterprise prospect signs a pilot Order Form that conditionally activates on SSO availability, **OR**
2. A written RFP from a $5k+/mo prospect lists SSO as a hard requirement, **OR**
3. Palvento hits $500k ARR — above that, every prospect at the $2k+ band asks for SSO anyway.

Until one of those trips, we keep SSO as "In progress — Q3 2026 target" on `/security` and answer truthfully in RFPs. Overbuilding SSO 12 months before demand wastes runway that should be spent on the founding-partner cohort.

## Related docs

- `app/enterprise/page.tsx` — SSO/SAML advertised on the Enterprise tier
- `app/security/page.tsx` — SOC 2 Type II Q3 2026 target (the audit's umbrella date)
- `docs/legal/msa-template.md` — Enterprise MSA that references the DPA and SLA
- `docs/legal/sla-template.md` — Enterprise SLA (99.95% uptime)
