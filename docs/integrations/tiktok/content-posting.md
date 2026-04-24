# TikTok Content Posting API — Palvento Reference

> **Source**: Fetched from `developers.tiktok.com/doc/*` on 2026-04-24 via WebFetch.
> Palvento use case: seller publishes product videos/photos to their connected
> TikTok personal account from within our app.

## Table of Contents
1. [Overview & Flows](#overview--flows)
2. [Required Scopes & Audit](#required-scopes--audit)
3. [Query Creator Info](#query-creator-info)
4. [Direct Post — Video](#direct-post--video)
5. [Video Upload (FILE_UPLOAD chunked PUT)](#video-upload-file_upload-chunked-put)
6. [PULL_FROM_URL + Domain Verification](#pull_from_url--domain-verification)
7. [Photo Post](#photo-post)
8. [Inbox (Draft) Flow](#inbox-draft-flow)
9. [Publish Status Query](#publish-status-query)
10. [Rate Limits](#rate-limits)
11. [Error Codes](#error-codes)
12. [Sandbox vs Production](#sandbox-vs-production)
13. [Palvento Integration Notes](#palvento-integration-notes)
14. [Sources](#sources)

---

## Overview & Flows

Content Posting API has **three operational surfaces**, all hosted at
`https://open.tiktokapis.com` (same host as Login Kit / Display API):

| Surface | Entry point | Purpose |
|---|---|---|
| Query Creator Info | `POST /v2/post/publish/creator_info/query/` | Fetch creator's current privacy options + duration cap before posting |
| Direct Post — Video | `POST /v2/post/publish/video/init/` | Post a video that publishes automatically |
| Photo Post (content init) | `POST /v2/post/publish/content/init/` | Post a photo carousel |
| Inbox (Draft) — Video | `POST /v2/post/publish/inbox/video/init/` | Send a video to the creator's TikTok inbox for manual finalization |
| Status Query | `POST /v2/post/publish/status/fetch/` | Poll publish state |

Two media sources regardless of surface:
- **FILE_UPLOAD** — we upload bytes via chunked `PUT` to a short-lived
  pre-signed `upload_url` returned by the init call.
- **PULL_FROM_URL** — TikTok downloads from a URL we own (requires verified domain).

---

## Required Scopes & Audit

- **Scope**: `video.publish` (for Direct Post), `video.upload` (for Inbox draft).
  Some accounts grant both; query `/v2/post/publish/status/fetch/` only requires one.
- **App audit**: Unaudited apps can use the API but **content is forced to
  `SELF_ONLY`** visibility and cannot be toggled public afterward from our side
  (user would need to change it in the TikTok app manually).
- **Unaudited-app caps**: max **5 target users per 24h window** can post;
  shared 24h cap of ~15 posts per creator across all API clients.
- **Audit submission**: `developers.tiktok.com/application/content-posting-api`.
  Requires demonstrating that the app connects **authentic creators posting
  original content**, not cross-posting/reuploading.

**Branded content declaration** (`post_info.brand_content_toggle` /
`brand_organic_toggle`):
- `brand_organic_toggle = true` → labeled "Promotional content"
- `brand_content_toggle = true` → labeled "Paid partnership" (this is the
  one that requires disclosure)
- Branded content **cannot** be posted with `SELF_ONLY` privacy.

---

## Query Creator Info

**Endpoint**: `POST https://open.tiktokapis.com/v2/post/publish/creator_info/query/`
**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json; charset=UTF-8
```
**Body**: empty POST (no body required).
**Rate limit**: **20 req/min per access_token**.

### Response
```json
{
  "data": {
    "creator_avatar_url": "string",
    "creator_username":   "string",
    "creator_nickname":   "string",
    "privacy_level_options": ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"],
    "comment_disabled":    false,
    "duet_disabled":       false,
    "stitch_disabled":     false,
    "max_video_post_duration_sec": 600
  },
  "error": { "code": "ok", "message": "", "log_id": "..." }
}
```

### `privacy_level_options` — enum values

| Value | When returned |
|---|---|
| `PUBLIC_TO_EVERYONE` | Public accounts only |
| `MUTUAL_FOLLOW_FRIENDS` | Public & private accounts |
| `FOLLOWER_OF_CREATOR` | Private accounts only |
| `SELF_ONLY` | Always present |

**Gotcha**: The enum set depends on account type *at query time*. If an account
flips public↔private between query and post, `privacy_level_option_mismatch`
fires at init. Always query creator_info immediately before showing the
post dialog — don't cache beyond the session.

**`max_video_post_duration_sec`**: Varies by creator (typical: 60–600s).
Enforce client-side before upload to avoid wasting bytes.

---

## Direct Post — Video

**Endpoint**: `POST https://open.tiktokapis.com/v2/post/publish/video/init/`
**Scope**: `video.publish`
**Rate limit**: **6 req/min per access_token**.

### Request
```json
{
  "post_info": {
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "title": "Check out this #product @somebody",
    "disable_duet":    false,
    "disable_stitch":  false,
    "disable_comment": false,
    "video_cover_timestamp_ms": 1000,
    "brand_content_toggle": false,
    "brand_organic_toggle": false,
    "is_aigc": false
  },
  "source_info": {
    "source": "FILE_UPLOAD",
    "video_size": 50000000,
    "chunk_size": 10000000,
    "total_chunk_count": 5
  }
}
```

### `post_info` fields
| Field | Type | Required | Notes |
|---|---|---|---|
| `privacy_level` | enum | yes | Must be a value from the creator's `privacy_level_options` |
| `title` | string | no | **Max 2200 UTF-16 runes**. Supports `#tags` and `@mentions`. |
| `disable_duet` | bool | no | Blocks Duet. |
| `disable_stitch` | bool | no | Blocks Stitch. |
| `disable_comment` | bool | no | Blocks comments. |
| `video_cover_timestamp_ms` | int | no | Thumbnail frame position. |
| `brand_content_toggle` | bool | no | Paid partnership — `privacy_level` must not be `SELF_ONLY`. |
| `brand_organic_toggle` | bool | no | Self-promo. |
| `is_aigc` | bool | no | Discloses AI-generated content. |

### `source_info` fields
| Field | Type | When | Notes |
|---|---|---|---|
| `source` | enum | always | `FILE_UPLOAD` or `PULL_FROM_URL` |
| `video_url` | string | `PULL_FROM_URL` | HTTPS URL under a verified domain |
| `video_size` | int (bytes) | `FILE_UPLOAD` | Total file size |
| `chunk_size` | int (bytes) | `FILE_UPLOAD` | Per-chunk size |
| `total_chunk_count` | int | `FILE_UPLOAD` | Total chunks |

### Response
```json
{
  "data": {
    "publish_id": "v_inbox_file~...",
    "upload_url": "https://open-upload.tiktokapis.com/upload/..."
  },
  "error": { "code": "ok", "message": "", "log_id": "..." }
}
```

- `publish_id`: max 64 chars, used for all subsequent status queries.
- `upload_url`: valid **1 hour** only.

---

## Video Upload (FILE_UPLOAD chunked PUT)

After `video/init/` returns `upload_url`, upload chunks:

```
PUT {upload_url}
Content-Type:   video/mp4 | video/quicktime | video/webm
Content-Length: {chunk_byte_size}
Content-Range:  bytes {FIRST}-{LAST}/{TOTAL}

<binary chunk>
```

### Supported formats
- `video/mp4`, `video/quicktime` (`.mov`), `video/webm`

### Known constraints
- `upload_url` valid 1 hour from issuance
- Max **5 pending uploads per 24h** per creator (anti-spam)
- Per-chunk failure behavior: **not documented in public ref**. Treat as
  idempotent retry on same `Content-Range`; if still failing, re-init.
- Min/max chunk size, max total file size, max duration, resolution/aspect
  ratio constraints are **not in the public reference** — they surface as
  `fail_reason` values (`file_format_check_failed`, `frame_rate_check_failed`,
  `picture_size_check_failed`) during post-upload processing. Verify empirically
  with sandbox uploads before shipping.

---

## PULL_FROM_URL + Domain Verification

`source: "PULL_FROM_URL"` requires the URL to live under a
**domain we've verified** in the TikTok dev portal.

### How to verify a domain
1. Go to **developers.tiktok.com → My Apps → {app} → URL Properties**
2. Add the domain (e.g. `cdn.palvento.com`)
3. TikTok issues a verification token; serve it at `/.well-known/tiktok-developers.txt`
   (or as a DNS TXT record)
4. Click Verify

### Error if unverified
```
403 url_ownership_unverified
```

**Gotcha**: verification is per-app and per-exact-domain — `palvento.com` and
`cdn.palvento.com` are treated separately. Plan our CDN strategy around this
*before* shipping.

---

## Photo Post

**Endpoint** (inferred — exact photo-post reference page was 404 on
2026-04-24; see [Sources](#sources)):
`POST https://open.tiktokapis.com/v2/post/publish/content/init/`

Based on cross-referencing the overview + sharing guidelines:

- `media_type`: `PHOTO`
- `post_mode`: `DIRECT_POST` or `MEDIA_UPLOAD` (latter sends to drafts)
- `source_info.source`: **`PULL_FROM_URL` only** (no FILE_UPLOAD for photos)
- `photo_images`: array of HTTPS URLs under verified domain
- `photo_cover_index`: zero-based index into `photo_images`
- Max carousel size: **≤ 35 images** (per TikTok app limits — not contractually
  documented in API ref; verify in sandbox)

**Action item**: When we build the photo post path, re-fetch the reference page
(likely at a renamed slug) and replace this section with verbatim field spec.

---

## Inbox (Draft) Flow

**Endpoint**: `POST https://open.tiktokapis.com/v2/post/publish/inbox/video/init/`

Same request/response shape as Direct Post, but the video lands in the creator's
TikTok inbox instead of publishing immediately. The creator finalizes
(title, filters, privacy) in the TikTok app.

### Status semantics
- `status: "SEND_TO_USER_INBOX"` means delivery succeeded; we don't see
  the final post until/unless the user publishes it.
- No `publicly_available_post_id` returned.

**Required scope**: `video.upload` (weaker than `video.publish`; less audit friction).

---

## Publish Status Query

**Endpoint**: `POST https://open.tiktokapis.com/v2/post/publish/status/fetch/`
**Scope**: `video.upload` OR `video.publish`
**Rate limit**: **30 req/min per access_token**.

### Request
```json
{ "publish_id": "v_inbox_file~..." }
```

### Response
```json
{
  "data": {
    "status": "PROCESSING_UPLOAD",
    "fail_reason": "",
    "uploaded_bytes":   12345678,
    "downloaded_bytes": 0,
    "publicaly_available_post_id": []
  },
  "error": { "code": "ok", "message": "", "log_id": "..." }
}
```

**Note**: The field is spelled **`publicaly_available_post_id`** (sic) in the
public reference — typo is canonical. Use that spelling in types.

### `status` enum
| Value | Meaning |
|---|---|
| `PROCESSING_UPLOAD` | FILE_UPLOAD bytes still arriving |
| `PROCESSING_DOWNLOAD` | PULL_FROM_URL fetching |
| `SEND_TO_USER_INBOX` | Inbox flow: delivered, awaiting creator action |
| `PUBLISH_COMPLETE` | Live on TikTok (Direct Post) |
| `FAILED` | See `fail_reason` |

### `fail_reason` enum (known values)
- `file_format_check_failed`
- `duration_check_failed`
- `frame_rate_check_failed`
- `picture_size_check_failed`
- `video_pull_failed`      *(PULL_FROM_URL couldn't be fetched)*
- `auth_removed`           *(creator revoked app access mid-upload)*
- `spam_risk`
- `internal`

### Polling guidance
Docs say "moderation usually finishes within one minute" but may take "a few
hours". No mandated interval.

**Palvento recommendation**: exponential backoff starting 5s, max 60s, give
up after 30min and surface `FAILED` to the user for retry.

---

## Rate Limits

| Endpoint | Limit |
|---|---|
| `/v2/post/publish/creator_info/query/` | 20 / min / access_token |
| `/v2/post/publish/video/init/` | 6 / min / access_token |
| `/v2/post/publish/inbox/video/init/` | 6 / min / access_token |
| `/v2/post/publish/content/init/` (photo) | 6 / min / access_token (inferred) |
| `/v2/post/publish/status/fetch/` | 30 / min / access_token |

All 429s come back as `rate_limit_exceeded`. **No `Retry-After` header is sent**
— back off yourself.

24h spam caps:
- Max **5 pending uploads** per creator per 24h
- Shared ~15 posts/creator/24h across all API clients (platform-wide)

---

## Error Codes

| HTTP | `error.code` | Meaning | Retry? |
|---|---|---|---|
| 400 | `invalid_param` | Missing/malformed field | No — fix request |
| 401 | `access_token_invalid` | Expired / revoked | Refresh, retry once |
| 401 | `scope_not_authorized` | Missing `video.publish` or `.upload` | No — reconnect |
| 403 | `spam_risk_too_many_posts` | Creator hit 24h cap | Backoff ≥1h |
| 403 | `spam_risk_user_banned_from_posting` | Hard ban | No |
| 403 | `reached_active_user_cap` | **Unaudited app** hit 5-user/24h cap | Backoff 24h |
| 403 | `unaudited_client_can_only_post_to_private_accounts` | Tried public post from unaudited app | No — force `SELF_ONLY` |
| 403 | `url_ownership_unverified` | PULL_FROM_URL domain not verified | No — fix config |
| 403 | `privacy_level_option_mismatch` | Selected privacy not in creator's options | No — re-query creator_info |
| 429 | `rate_limit_exceeded` | Over QPM | Backoff |
| 5xx | *(none / `internal`)* | TikTok-side | Backoff, retry |

---

## Sandbox vs Production

- **Sandbox**: same hosts (`open.tiktokapis.com`), app is flagged; only up to
  10 allowlisted target users can authorize. All posts forced to `SELF_ONLY`.
- **Production (pre-audit)**: live with real users, but all posts still forced
  to `SELF_ONLY` + 5-user/24h client cap until audit passes.
- **Production (audited)**: full range of `privacy_level` available; caps lifted
  to TikTok's anti-spam defaults (~15/creator/24h).

**Visibility promotion**: An unaudited-app `SELF_ONLY` post cannot be
promoted to public via the API after the fact — the user must change it in
the TikTok app. Design the UX around that.

---

## Palvento Integration Notes

### Where this slots in our codebase
- **OAuth**: shared with Login Kit — see `app/lib/tiktok-login/*`
  (not yet built). `video.publish` / `video.upload` scopes go on the same
  access token.
- **Upload storage**: we'd likely host product videos in Supabase Storage,
  which means PULL_FROM_URL with `*.supabase.co` — **but that domain isn't
  ours to verify**. Options:
  1. Use FILE_UPLOAD (chunked PUT) and stream bytes server-side.
  2. Proxy Supabase Storage through our own verified `cdn.palvento.com`.
  Option 2 is cleaner for long-running/auto-scheduled posting.
- **Status tracking**: add a `tiktok_posts` table keyed by `publish_id`,
  poll via background job, update status; mirror to our notifications system
  on `PUBLISH_COMPLETE` / `FAILED`.
- **Creator info caching**: do **not** cache beyond a single session —
  account privacy flips invalidate it.

### Module-level SDK rule (per our memory)
All TikTok clients live behind `getTiktok...()` factories — never
module-top-level `new X()`. Next.js build will crash otherwise.

### Audit priority
We cannot ship public posting without app audit. Audit is the critical path
for any "scheduled TikTok post" feature. Start application paperwork early
(typical TikTok developer audit: 2–6 weeks).

---

## Sources

- **Overview**: https://developers.tiktok.com/doc/content-posting-api-get-started
- **Direct Post (video)**: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
- **Upload video**: https://developers.tiktok.com/doc/content-posting-api-reference-upload-video
- **Creator info query**: https://developers.tiktok.com/doc/content-posting-api-reference-query-creator-info
- **Get video status**: https://developers.tiktok.com/doc/content-posting-api-reference-get-video-status
- **Content sharing guidelines**: https://developers.tiktok.com/doc/content-sharing-guidelines
- **Audit application**: https://developers.tiktok.com/application/content-posting-api
- **Photo post reference**: *404 on 2026-04-24 — URL likely renamed. Verify
  exact slug in portal before photo-post implementation.*
