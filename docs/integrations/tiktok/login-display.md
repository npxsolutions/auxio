# TikTok Login Kit + Display API — Palvento Reference

Consumer-facing TikTok for Developers APIs used to let Palvento sellers connect
their **personal** TikTok accounts (not TikTok Shop — that is a separate
integration). Covers Login Kit (OAuth 2.0) and the Display API (v2) used to
read profile data and video stats.

> Source of truth: <https://developers.tiktok.com/doc/>. Everything below was
> digested on 2026-04-24 from the pages linked inline. If a section says
> "unconfirmed" it means the public search excerpt did not expose the raw
> parameter table — double-check the live doc before shipping.

## Table of Contents

1. [API host + versioning](#1-api-host--versioning)
2. [Login Kit: OAuth authorization (web)](#2-login-kit-oauth-authorization-web)
3. [Login Kit: Token exchange](#3-login-kit-token-exchange)
4. [Login Kit: Refresh token lifecycle](#4-login-kit-refresh-token-lifecycle)
5. [Login Kit: Revoke token](#5-login-kit-revoke-token)
6. [Scopes](#6-scopes)
7. [Sandbox vs production](#7-sandbox-vs-production)
8. [Display API: Overview](#8-display-api-overview)
9. [Display API: /v2/user/info/](#9-display-api-v2userinfo)
10. [Display API: /v2/video/list/](#10-display-api-v2videolist)
11. [Display API: /v2/video/query/](#11-display-api-v2videoquery)
12. [Rate limits](#12-rate-limits)
13. [Error codes + response shape](#13-error-codes--response-shape)
14. [Integration gotchas for Palvento](#14-integration-gotchas-for-palvento)

---

## 1. API host + versioning

| Concern | Value |
| --- | --- |
| OAuth authorize host | `https://www.tiktok.com` |
| API host (token + data) | `https://open.tiktokapis.com` |
| Current API version | `v2` (v1 is deprecated; User Info v1 in particular is slated for removal) |
| Credential names | `client_key`, `client_secret` (NOT `client_id`) |

Source: <https://developers.tiktok.com/doc/tiktok-api-v2-introduction> and the
migration bulletin <https://developers.tiktok.com/bulletin/migration-guidance-oauth-v1>.

---

## 2. Login Kit: OAuth authorization (web)

Doc: <https://developers.tiktok.com/doc/login-kit-web>

```
GET https://www.tiktok.com/v2/auth/authorize/
  ?client_key=CLIENT_KEY
  &response_type=code
  &scope=user.info.basic,video.list
  &redirect_uri=https%3A%2F%2Fapp.palvento.com%2Fapi%2Ftiktok%2Foauth%2Fcallback
  &state=CSRF_TOKEN
```

| Param | Required | Notes |
| --- | --- | --- |
| `client_key` | yes | From developer portal |
| `response_type` | yes | Must be `code` |
| `scope` | yes | Comma-separated scope list (see [§6](#6-scopes)) |
| `redirect_uri` | yes | HTTPS only, absolute URL, pre-registered in the portal. Max **10** redirect URIs per app. Must URL-encode in the authorize URL |
| `state` | yes | CSRF protection, random opaque string; TikTok round-trips it to `redirect_uri`. Treat as required even though RFC 6749 marks it optional |
| `code_challenge` | **web: optional, desktop: required** | S256 only |
| `code_challenge_method` | as above | Must be `S256` when PKCE used |

### PKCE

- **Desktop Login Kit requires PKCE** with `code_challenge_method=S256` —
  <https://developers.tiktok.com/doc/login-kit-desktop>.
- Web Login Kit does not mandate PKCE but accepts it; Palvento should send it
  anyway because the OAuth callback runs in a Next.js route handler where we
  have the verifier in a secure httpOnly cookie.
- `code_verifier`: 43–128 chars, unreserved (`[A-Z] / [a-z] / [0-9] / - . _ ~`),
  freshly generated per authorize.
- `code_challenge = BASE64URL( SHA256(code_verifier) )` (the TikTok doc
  literally writes `SHA256(code_verifier)` but the canonical S256 encoding is
  base64url of the SHA-256 digest — verify on the live doc).

### Callback

```
https://app.palvento.com/api/tiktok/oauth/callback
  ?code=AUTH_CODE
  &scopes=user.info.basic,video.list
  &state=CSRF_TOKEN
```

- On user denial: `?error=access_denied&error_description=...&state=...`.
- Always compare `state` against the value stored in the session/cookie before
  doing anything else.

---

## 3. Login Kit: Token exchange

Doc: <https://developers.tiktok.com/doc/oauth-user-access-token-management>

```
POST https://open.tiktokapis.com/v2/oauth/token/
Content-Type: application/x-www-form-urlencoded
Cache-Control: no-cache

client_key=CLIENT_KEY
&client_secret=CLIENT_SECRET
&code=AUTH_CODE
&grant_type=authorization_code
&redirect_uri=https%3A%2F%2Fapp.palvento.com%2Fapi%2Ftiktok%2Foauth%2Fcallback
&code_verifier=PKCE_VERIFIER          # only if PKCE was used
```

### Successful response

```json
{
  "access_token":        "act.xxx",
  "expires_in":          86400,
  "open_id":             "723f24d7-e717-40f8-a2b6-cb8464cd23b4",
  "refresh_expires_in":  31536000,
  "refresh_token":       "rft.xxx",
  "scope":               "user.info.basic,video.list",
  "token_type":          "Bearer"
}
```

| Field | Meaning |
| --- | --- |
| `access_token` | Used as `Authorization: Bearer <access_token>` against `open.tiktokapis.com` |
| `expires_in` | **86,400 s = 24 h** |
| `refresh_expires_in` | **31,536,000 s = 365 days** from the most recent refresh |
| `open_id` | Stable per-app user identifier — store this as the FK. Cross-app identity requires the `union_id` field (needs the same developer org) |
| `scope` | Actual granted scopes — may be a subset of what was requested |

### Gotchas

- `redirect_uri` must **byte-for-byte match** the one used in the authorize
  request, including trailing slash — otherwise you get
  `invalid_request / "Redirect_uri is not matched..."`.
- Authorization codes are single-use and short-lived.
- Endpoint has a trailing slash (`/v2/oauth/token/`). Dropping the slash
  returns 404.

---

## 4. Login Kit: Refresh token lifecycle

Doc: <https://developers.tiktok.com/doc/login-kit-manage-user-access-tokens>

```
POST https://open.tiktokapis.com/v2/oauth/token/
Content-Type: application/x-www-form-urlencoded

client_key=CLIENT_KEY
&client_secret=CLIENT_SECRET
&grant_type=refresh_token
&refresh_token=rft.xxx
```

Response is the same shape as §3. Key behaviour:

- Access token TTL: **24 h**.
- Refresh token TTL: **365 days** from the last refresh — refresh tokens
  **rotate** (the response contains a new `refresh_token` you must persist).
- Refresh does **not** require user consent, so run a cron/worker to rotate
  access tokens in the background (recommended pattern in the doc).
- If a user revokes access from their TikTok settings, the next refresh fails
  with `invalid_grant` and you must redirect them through §2 again.
- Always store `refresh_expires_in` alongside the token so a worker can skip
  accounts whose refresh has lapsed.

---

## 5. Login Kit: Revoke token

```
POST https://open.tiktokapis.com/v2/oauth/revoke/
Content-Type: application/x-www-form-urlencoded

client_key=CLIENT_KEY
&client_secret=CLIENT_SECRET
&token=ACCESS_TOKEN
```

- Success = empty JSON body (HTTP 200).
- Revokes both access + refresh tokens for that user/app pair.
- Hit this from our disconnect flow so the user's token row in Supabase can
  be deleted confidently.

---

## 6. Scopes

Doc index: <https://developers.tiktok.com/doc/tiktok-api-scopes> +
<https://developers.tiktok.com/doc/scopes-overview>

Scopes are granular and **each app must request them explicitly on its portal
page** before they appear in the consent screen. Many need app review before
they can be granted to non-target (non-sandbox) users.

| Scope | Gates | Notes |
| --- | --- | --- |
| `user.info.basic` | `open_id`, `union_id`, `avatar_url`, `avatar_url_100`, `avatar_large_url`, `display_name` via `/v2/user/info/` | Always auto-approved. Minimum viable scope for Login Kit |
| `user.info.profile` | `bio_description`, `profile_deep_link`, `is_verified`, `username` fields on `/v2/user/info/` | Requires app review |
| `user.info.stats` | `follower_count`, `following_count`, `likes_count` / `like_count`, `video_count` on `/v2/user/info/` | Requires app review; this is the one Palvento's analytics view needs |
| `video.list` | `/v2/video/list/` and `/v2/video/query/` for the authed user | Requires app review |
| `video.upload` | Content Posting API — inbox uploads (user publishes from TikTok app) | Content Posting API, not Display API |
| `video.publish` | Content Posting API — direct post publishing | Content Posting API, requires audit + Direct Post permission |
| `research.*` | Research API only | Academic only, separate application |

> Confirm the exact scope string for `user.info.stats` vs `user.info.profile`
> in the portal before wiring them in — TikTok has re-shuffled these once
> already (see <https://developers.tiktok.com/bulletin/user-info-scope-migration>).
> The migration bulletin explicitly warns that **v2 `user.info.basic` no longer
> returns the full v1 field set** — stats/profile fields now gate behind the
> extra scopes above.

### For Palvento's initial integration

Minimum sensible set: `user.info.basic,user.info.profile,user.info.stats,video.list`.
That covers profile display + the content analytics dashboard. We do NOT need
`video.publish` unless/until we schedule TikTok posts from Palvento.

---

## 7. Sandbox vs production

Docs:
- <https://developers.tiktok.com/blog/introducing-sandbox>
- <https://developers.tiktok.com/doc/add-a-sandbox>
- <https://developers.tiktok.com/doc/app-review-guidelines>

| Concern | Sandbox | Production |
| --- | --- | --- |
| Users | Up to **10** target users you explicitly add by TikTok handle | Anyone |
| App review | Not required | Required before scopes leave sandbox |
| Scopes | You can test any scope you've enabled, even without audit | Only audited scopes appear on consent screen |
| Content visibility | **All content posted via an unaudited client is forced to "private" / self-only view** | Public posting allowed after audit |
| Endpoints | Same hosts (`www.tiktok.com`, `open.tiktokapis.com`) — TikTok does NOT have a separate sandbox base URL | Same |

The practical implication: swap `client_key`/`client_secret` between sandbox
and production app credentials — there is no `sandbox.tiktokapis.com`. Plan to
keep two Supabase env var sets (dev/preview vs prod).

App review requires a screen recording demonstrating every scope/product in
use — important if we add `user.info.stats` mid-cycle.

---

## 8. Display API: Overview

Doc: <https://developers.tiktok.com/doc/display-api-overview>

The Display API is the read-only surface for a logged-in user's own profile
and public videos. It has three endpoints, all under `open.tiktokapis.com`:

- `GET  /v2/user/info/`
- `POST /v2/video/list/`
- `POST /v2/video/query/`

Common conventions:

- Auth header: `Authorization: Bearer <access_token>`.
- `Content-Type: application/json` on POSTs.
- **`fields` is always a query-string parameter** (comma-separated field
  names). The request body contains filters/paging only. This is the biggest
  footgun — omitting `fields` returns an empty data object, not an error.
- Response envelope uses an `error` object with `code`, `message`, `log_id`
  (see §13). Success = `error.code === "ok"`.

---

## 9. Display API: /v2/user/info/

Doc: <https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info>

```
GET https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,follower_count,following_count,likes_count,video_count,is_verified
Authorization: Bearer act.xxx
```

### Available fields (by scope)

| Field | Scope | Notes |
| --- | --- | --- |
| `open_id` | `user.info.basic` | Stable per-app ID |
| `union_id` | `user.info.basic` | Stable across apps of the same developer |
| `avatar_url` | `user.info.basic` | Short-TTL signed URL |
| `avatar_url_100` | `user.info.basic` | 100x100 variant |
| `avatar_large_url` | `user.info.basic` | Largest variant |
| `display_name` | `user.info.basic` | |
| `bio_description` | `user.info.profile` | |
| `profile_deep_link` | `user.info.profile` | `https://www.tiktok.com/@handle` |
| `is_verified` | `user.info.profile` | Boolean |
| `username` | `user.info.profile` | Handle (unconfirmed; some v2 docs call this `username`, older docs call it `display_name`) |
| `follower_count` | `user.info.stats` | |
| `following_count` | `user.info.stats` | |
| `likes_count` | `user.info.stats` | Some API responses spell this `like_count` — handle both |
| `video_count` | `user.info.stats` | |

### Response shape

```json
{
  "data": {
    "user": {
      "open_id": "...",
      "union_id": "...",
      "avatar_url": "https://p16-sign-sg.tiktokcdn.com/...",
      "display_name": "Creator Name"
    }
  },
  "error": { "code": "ok", "message": "", "log_id": "2026..." }
}
```

### Gotchas

- `avatar_url` is a signed CDN URL with a TTL — do **not** store it
  permanently; re-hydrate from `/v2/user/info/` when you need to render it, or
  mirror the bytes into our own Supabase Storage bucket.
- Requesting a field your token's scopes don't cover silently drops that
  field (field missing from `data.user`, no error). Always compare returned
  fields to requested when building our Supabase row.

---

## 10. Display API: /v2/video/list/

Doc: <https://developers.tiktok.com/doc/tiktok-api-v2-video-list>

Returns the authed user's own **public** videos, newest first.

```
POST https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,create_time,cover_image_url,share_url,embed_link,embed_html,duration,height,width,like_count,comment_count,share_count,view_count
Authorization: Bearer act.xxx
Content-Type: application/json

{
  "max_count": 20,
  "cursor": 1713456789000
}
```

### Request body

| Field | Type | Notes |
| --- | --- | --- |
| `max_count` | int | 1–20 per page (confirm upper bound on live doc; v1 was 20) |
| `cursor` | int | Omit on first page; echo `data.cursor` from previous response for next page |

### Response

```json
{
  "data": {
    "videos": [
      {
        "id": "7123...",
        "create_time": 1713456789,
        "title": "...",
        "video_description": "...",
        "duration": 28,
        "height": 1920,
        "width": 1080,
        "cover_image_url": "https://...",
        "share_url": "https://www.tiktok.com/@handle/video/7123...",
        "embed_link": "https://www.tiktok.com/embed/v2/7123...",
        "embed_html": "<blockquote class=\"tiktok-embed\" ...",
        "like_count": 0,
        "comment_count": 0,
        "share_count": 0,
        "view_count": 0
      }
    ],
    "cursor": 1713456780000,
    "has_more": true
  },
  "error": { "code": "ok", "message": "", "log_id": "..." }
}
```

### Fields

- Metadata: `id`, `title`, `video_description`, `create_time` (unix seconds),
  `duration` (seconds), `height`, `width`.
- Display: `cover_image_url`, `share_url`, `embed_link`, `embed_html`.
- Stats: `like_count`, `comment_count`, `share_count`, `view_count` — these
  exist on the v2 video object but their inclusion in `/video/list/` versus
  only `/video/query/` flips between doc revisions. If a stat field returns
  zero/undefined on `/video/list/`, refetch that single video ID through
  `/video/query/`.

### Gotchas

- `cover_image_url` is short-TTL signed; v1 docs explicitly say "re-call
  `/v2/video/query/` to refresh cover URL". Never persist the URL; persist the
  video ID and re-query on render, or pre-mirror to our own storage.
- Pagination `cursor` is a timestamp-like int, not an opaque string. `has_more`
  is the authoritative end-of-list signal.

---

## 11. Display API: /v2/video/query/

Doc: <https://developers.tiktok.com/doc/tiktok-api-v2-video-query>

Given an authed user + a list of that user's video IDs, returns the current
metadata. Primary use: refreshing expired `cover_image_url` and re-polling
stats.

```
POST https://open.tiktokapis.com/v2/video/query/?fields=id,title,cover_image_url,like_count,comment_count,share_count,view_count
Authorization: Bearer act.xxx
Content-Type: application/json

{
  "filters": {
    "video_ids": ["7123...", "7124..."]
  }
}
```

### Rules

- `filters.video_ids`: up to **20 IDs per call**.
- The endpoint rejects (drops) IDs that don't belong to the authorizing user —
  useful for audit.
- Same `fields` mechanic as `/video/list/` (query-string).

### Response

Same `videos[]` shape as `/video/list/` without `cursor` / `has_more`.

---

## 12. Rate limits

Doc: <https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit>

- Enforced on a **one-minute sliding window**.
- Over-limit requests return HTTP **429** with error code
  `rate_limit_exceeded`.
- Per-endpoint thresholds are listed on the rate-limit page (values vary and
  TikTok has changed them quietly — re-check before shipping, and log
  `log_id` + response headers so we can tune).
- In Palvento, run `/video/list/` + `/video/query/` through a single worker
  with a concurrency limiter keyed by `open_id` rather than per-request in the
  API route.

---

## 13. Error codes + response shape

Doc: <https://developers.tiktok.com/doc/tiktok-api-v2-error-handling> and
<https://developers.tiktok.com/doc/oauth-error-handling>.

### OAuth endpoints (`/v2/oauth/...`)

Flat error structure (RFC 6749 style):

```json
{
  "error": "invalid_request",
  "error_description": "Redirect_uri is not matched with the uri when requesting code.",
  "log_id": "202206221854370101130062072500FFA2"
}
```

Common OAuth error codes: `invalid_request`, `invalid_client`,
`invalid_grant`, `invalid_scope`, `unauthorized_client`, `access_denied`.

### Data endpoints (`/v2/user/*`, `/v2/video/*`)

Error is nested inside the standard envelope, `code` is a string:

```json
{
  "data": {},
  "error": {
    "code": "access_token_invalid",
    "message": "Access token is invalid, please refresh token and retry",
    "log_id": "202210112248442CB9319E1FB30C1073F3"
  }
}
```

Common codes to handle:

| `error.code` | HTTP | Action |
| --- | --- | --- |
| `ok` | 200 | Success |
| `access_token_invalid` | 401 | Refresh token (§4), retry once, else re-auth |
| `scope_not_authorized` | 403 | Re-auth with additional scopes |
| `rate_limit_exceeded` | 429 | Back off (respect sliding window) |
| `internal_error` | 5xx | Retry with jitter |
| `invalid_params` | 400 | Usually missing `fields` query or malformed `video_ids` |

**Always log `error.log_id`** — TikTok support requires it to investigate.

---

## 14. Integration gotchas for Palvento

These are the things most likely to bite when we build this out under
Next.js + Supabase, in priority order:

1. **Field masks are query-string, not body.** The Display API silently
   returns empty `data.user` / empty video objects if you forget the `fields=`
   query parameter. Build a tiny helper `tiktokFetch(path, { fields, body })`
   that refuses to run without `fields`.
2. **Signed CDN URLs expire.** `avatar_url`, `cover_image_url`, `embed_link`
   are short-TTL. Never persist them on Supabase rows that will be rendered
   later — either mirror to our `public/` Storage bucket on ingest or re-query
   on demand. The TikTok doc calls this out explicitly under `/video/query/`.
3. **Scope deltas require a fresh authorize round-trip.** If we launch with
   `user.info.basic,video.list` and later add `user.info.stats`, existing
   tokens will get `scope_not_authorized` on stats fields — they do **not**
   auto-upgrade on refresh. Plan a "reconnect TikTok" banner driven off the
   `scope` string stored in Supabase.
4. Refresh tokens rotate — persist the **new** `refresh_token` in the same
   transaction as the `access_token`, or you will lock users out after the
   first refresh.
5. `redirect_uri` must match exactly (trailing slash, casing). Keep it in a
   const, don't template it. Register every env's URL (`localhost:3000`,
   preview deploys, prod) — max 10 per app.
6. No separate sandbox host. Two app credentials + env-gated `client_key` is
   the only real isolation. Preview deploys must use the sandbox app or they
   will try to go through production OAuth against an unauthed user list.
7. Unaudited apps force all posted content to private — irrelevant for
   read-only Display API use but critical if we ever enable `video.publish`.
8. Module-level SDK instantiation kills Next.js build (per
   `MEMORY.md`). Wrap any TikTok HTTP client the same way we wrap Supabase:
   `const getTikTok = () => new TikTokClient(...)` inside the route handler.

---

### Appendix: primary source URLs

- Login Kit web: <https://developers.tiktok.com/doc/login-kit-web>
- Login Kit overview: <https://developers.tiktok.com/doc/login-kit-overview>
- Login Kit desktop (PKCE): <https://developers.tiktok.com/doc/login-kit-desktop>
- Manage user access tokens: <https://developers.tiktok.com/doc/login-kit-manage-user-access-tokens>
- OAuth token management: <https://developers.tiktok.com/doc/oauth-user-access-token-management>
- OAuth v1 → v2 migration: <https://developers.tiktok.com/bulletin/migration-guidance-oauth-v1>
- Scopes overview: <https://developers.tiktok.com/doc/scopes-overview>
- Scope index: <https://developers.tiktok.com/doc/tiktok-api-scopes>
- User info scope migration: <https://developers.tiktok.com/bulletin/user-info-scope-migration>
- Display API overview: <https://developers.tiktok.com/doc/display-api-overview>
- Display API get-started: <https://developers.tiktok.com/doc/display-api-get-started>
- v2 user info: <https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info>
- v2 video list: <https://developers.tiktok.com/doc/tiktok-api-v2-video-list>
- v2 video query: <https://developers.tiktok.com/doc/tiktok-api-v2-video-query>
- v2 video object: <https://developers.tiktok.com/doc/tiktok-api-v2-video-object>
- Rate limits: <https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit>
- Error handling (data API): <https://developers.tiktok.com/doc/tiktok-api-v2-error-handling>
- Error handling (OAuth): <https://developers.tiktok.com/doc/oauth-error-handling>
- Sandbox: <https://developers.tiktok.com/doc/add-a-sandbox>
- App review guidelines: <https://developers.tiktok.com/doc/app-review-guidelines>
- Introducing sandbox (blog): <https://developers.tiktok.com/blog/introducing-sandbox>
