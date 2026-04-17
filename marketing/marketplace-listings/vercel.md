# Vercel Integrations Marketplace — Palvento brief

**Status:** Concept; submission Q3 2026.
**Submission contact:** developers@palvento.io
**Internal owner:** Platform team

## Integration name
Palvento Commerce Embed

## What it is
A Vercel integration that lets developers embed Palvento dashboards (orders, listings, profit, repricer history) into custom merchant portals built on Next.js, with auth and theming handled by environment variables provisioned at install time.

## Why it fits the Vercel marketplace
Most Palvento customers ship a custom merchant portal for their own resellers, brands, or franchisees. Today they wrap our API by hand. The integration short-circuits that with iframe-able, themed dashboard primitives and a typed React SDK published to npm.

## What gets installed
On install, the integration:

1. Provisions environment variables on the linked Vercel project:
   - `AUXIO_API_KEY` (scoped, read-only by default)
   - `AUXIO_PROJECT_ID`
   - `AUXIO_THEME` (light | dark | match)
2. Installs `@palvento/react` from npm via the project&rsquo;s package manager.
3. Adds an example route at `app/palvento/page.tsx` rendering the embedded orders dashboard.

## Permissions
Read-only by default. Write scopes (e.g. fulfil order) require explicit confirmation in the Vercel install flow and surface as additional environment variables.

## Categories
- Primary: **Commerce**
- Secondary: **Developer Tools · Analytics**

## Pricing on listing
Free for projects with an active Palvento subscription. No additional cost.

## Submission notes
- Confirm Vercel Marketplace OIDC token flow vs static env-var provisioning.
- Need a 60-second product video showing one-click install + first render.
- Sample app repo: `github.com/palvento/vercel-embed-example` (to be published).

## Open questions for Vercel partner team
- Can install-time env vars be flagged as encrypted by default?
- Is there a sandbox marketplace for partner self-test before publish?
