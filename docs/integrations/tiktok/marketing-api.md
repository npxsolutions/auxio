# TikTok Marketing API — Integration Reference

Persistent reference for Palvento's integration planning against the TikTok API for Business (aka TikTok Ads / Marketing API). Current version: **v1.3**.

> Scope: this covers the **business-api.tiktok.com** surface used for advertiser management, campaign automation, reporting, events (S2S), catalog/DPA, and audiences. It does **not** cover the separate `developers.tiktok.com` Login Kit, Display API, Content Posting, Commercial Content, or TikTok Shop Partner APIs — those are distinct products with their own auth.

Last reviewed: 2026-04-24. Digest built from search over official docs + `github.com/tiktok/tiktok-business-api-sdk`. The live portal (`business-api.tiktok.com/portal/docs`) was not directly scrapable during this pass, so exact endpoint slugs should be re-verified before shipping any integration.

---

## Table of Contents

1. [Host, Versioning, Transport](#1-host-versioning-transport)
2. [Authorization (OAuth)](#2-authorization-oauth)
3. [Advertiser & Account Structure](#3-advertiser--account-structure)
4. [Campaign Management](#4-campaign-management)
5. [Ad Group Management](#5-ad-group-management)
6. [Ad Management](#6-ad-management)
7. [Creative Management (Images, Videos, Spark Ads)](#7-creative-management-images-videos-spark-ads)
8. [Reporting API](#8-reporting-api)
9. [Pixel & Events API (Server-to-Server)](#9-pixel--events-api-server-to-server)
10. [Catalog API (DPA)](#10-catalog-api-dpa)
11. [Audience API](#11-audience-api)
12. [Business Center (BC) API](#12-business-center-bc-api)
13. [Rate Limits & Quotas](#13-rate-limits--quotas)
14. [Sandbox](#14-sandbox)
15. [Error Codes](#15-error-codes)
16. [Palvento Integration Notes](#16-palvento-integration-notes)
17. [Source Links](#17-source-links)

---

## 1. Host, Versioning, Transport

| Env | Base URL |
|---|---|
| Production | `https://business-api.tiktok.com` |
| Sandbox | `https://sandbox-ads.tiktok.com` |

- All endpoints are prefixed with `/open_api/v1.3/`.
- Most writes are `POST` with `Content-Type: application/json`. Most reads are `GET` with query-string params (including JSON-encoded arrays/objects, e.g. `dimensions=["stat_time_day","ad_id"]`).
- Authentication header: **`Access-Token: <token>`** (a custom header — *not* `Authorization: Bearer`). Some TikTok Developers endpoints use `Authorization: Bearer`, but **the Marketing API uses the `Access-Token` header**.
- Responses are JSON with a uniform envelope:

```json
{
  "code": 0,
  "message": "OK",
  "request_id": "202604241200010123456789ABCDEF",
  "data": { /* payload */ }
}
```

- `code: 0` = success. **Non-zero `code` does not necessarily come with an HTTP 4xx/5xx** — TikTok often returns HTTP 200 with an error code in the body (e.g. `40100` for QPS throttling returns 200). Always check `code`, not just HTTP status.

### Pagination

Two styles coexist depending on endpoint:

- **Offset paging** (most list endpoints, incl. campaign/adgroup/ad/list):
  - Request: `page` (1-indexed), `page_size` (default 10, max **1000**).
  - Response: `data.page_info = { page, page_size, total_number, total_page }`.
- **Cursor paging** (newer high-volume endpoints, some reporting/catalog):
  - Request: `cursor` (empty on first call).
  - Response: `data.cursor`, `data.has_more`. Pass `cursor` forward while `has_more: true`.

---

## 2. Authorization (OAuth)

TikTok's Marketing API uses a three-legged OAuth flow with a **long-lived access token** (no user-level refresh on the direct-advertiser flow by default — see caveat below).

### 2.1 App registration

- Register at `business-api.tiktok.com/portal` as a developer.
- Each app has `app_id` and `secret`, a registered `redirect_uri`, and a defined scope set (campaign management, reporting, audience, catalog, etc.).
- App must pass TikTok review before it can be installed on non-sandbox advertisers.

### 2.2 Authorization URL (direct advertiser)

Redirect the user (advertiser) to:

```
https://business-api.tiktok.com/portal/auth?app_id={APP_ID}&redirect_uri={REDIRECT_URI}&state={STATE}&rid={RANDOM_ID}
```

> Older docs reference `https://ads.tiktok.com/marketing_api/auth` — TikTok has moved this to the `business-api.tiktok.com/portal/auth` domain; either may be referenced in wild documentation. Use whatever URL the current portal "Authorization URL" field shows for your app.

After consent, TikTok redirects to your `redirect_uri` with `?auth_code=<one-time-code>&state=<STATE>`.

### 2.3 Exchange auth_code → access_token

`POST https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/`

Body (JSON):
```json
{
  "app_id": "...",
  "secret": "...",
  "auth_code": "...",
  "grant_type": "authorization_code"
}
```

Response `data`:
```json
{
  "access_token": "...",
  "scope": [4,11,12,...],
  "advertiser_ids": [1234567890, 2345678901]
}
```

**Gotchas:**
- `advertiser_ids` is an array — one authorization grant can map to many advertisers if the user operates multiple ad accounts.
- `access_token` is **long-lived** (effectively non-expiring under the direct-advertiser flow historically — token lifetime is not published and can be revoked at any time by the user, by TikTok, or by rotating the app secret).
- `auth_code` is single-use; trying to exchange twice returns an error.

### 2.4 Refresh flow

`POST https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/`

Body:
```json
{
  "app_id": "...",
  "secret": "...",
  "refresh_token": "...",
  "grant_type": "refresh_token"
}
```

Refresh tokens are primarily used by newer grant types (TikTok Accounts, Creator Marketplace) and by apps that opted into the short-lived Marketing API token option. If your advertiser-auth access_token response did *not* include a `refresh_token`, you are on the long-lived model and do not refresh — you re-auth when revoked.

### 2.5 Business Center authorization

For agencies/MCC-style setups, you auth the **Business Center (BC)** and then list advertisers under it:

- BC auth URL flow is identical structurally, but scopes include BC-level perms.
- Response contains `bc_id` as well as advertiser IDs inherited from the BC.
- Use `/bc/advertiser/get/` (section 12) to list advertisers under a BC.
- When a BC "onboards" a new advertiser, your existing BC token gains access *without* re-auth — so polling BC membership is the standard way to auto-discover new accounts.

### 2.6 Revoke / token hygiene

- Users can revoke from within TikTok Ads Manager → Assets → Linked Accounts. On revoke you'll start getting `40105` (invalid/expired token) on every call.
- Rotating your app `secret` invalidates **all** tokens for that app. Avoid.
- Store `access_token` encrypted per-advertiser (or per-BC) in your DB. See the Palvento Memory Index note on module-level SDK instantiation — instantiate the TikTok client lazily inside route handlers.

---

## 3. Advertiser & Account Structure

### 3.1 Hierarchy

```
Business Center (optional)
  └─ Advertiser (ad account)     ← advertiser_id, everything below scoped to this
      └─ Campaign                 ← objective, top-level budget
          └─ Ad Group             ← targeting, placement, bidding, schedule
              └─ Ad               ← creative + copy + identity
```

- `advertiser_id` is **required on nearly every request below campaign level** — it's how TikTok scopes authorization and billing.
- An advertiser belongs to exactly one "country/region" and one currency — these are fixed at account creation.
- Identity (the TikTok handle the ad is posted as) is a separate object (`identity_id` + `identity_type`) and must be authorized *per advertiser*.

### 3.2 List advertisers granted to your app

`GET /open_api/v1.3/oauth2/advertiser/get/`

Query params: `access_token`, `app_id`, `secret` (or header — check current docs; historically this one required them in query for backfill scenarios).

Response `data.list[]`:
```json
[{ "advertiser_id": "1234567890", "advertiser_name": "Palvento Test" }]
```

### 3.3 Advertiser detail

`GET /open_api/v1.3/advertiser/info/`

Query: `advertiser_ids=["1234567890"]` (JSON array, max ~100 per call), plus optional `fields`.

Returns: name, company, contacter, currency, timezone, industry, balance, license_no, status, role, telephone, email, country.

**`timezone`** is load-bearing for reporting — all `stat_time_day` buckets are in the advertiser's timezone, not UTC.

---

## 4. Campaign Management

Base path: `/open_api/v1.3/campaign/`

| Op | Method + path |
|---|---|
| Create | `POST /campaign/create/` |
| Update | `POST /campaign/update/` |
| Update status | `POST /campaign/status/update/` (enable/disable/delete) |
| List | `GET /campaign/get/` |

### Create request (minimum viable shape)

```json
{
  "advertiser_id": "1234567890",
  "campaign_name": "Palvento — Q2 ROAS",
  "objective_type": "PRODUCT_SALES",
  "budget_mode": "BUDGET_MODE_DAY",
  "budget": 50.00
}
```

### Key fields

- **`objective_type`** — one of: `REACH`, `TRAFFIC`, `VIDEO_VIEWS`, `ENGAGEMENT` (deprecated in some regions), `LEAD_GENERATION`, `APP_PROMOTION`, `WEB_CONVERSIONS`, `PRODUCT_SALES`, `CATALOG_SALES` (legacy alias), `SHOP_PURCHASES`. The set shifts regionally; always check the error message if creation rejects an objective.
- **`budget_mode`** — `BUDGET_MODE_INFINITE` (no cap; not allowed with CBO), `BUDGET_MODE_DAY`, `BUDGET_MODE_TOTAL`.
- **`campaign_type`** — `REGULAR_CAMPAIGN` (default) or `IOS14_CAMPAIGN` (SKAdNetwork; requires `PRODUCT_SALES`/`APP_PROMOTION`).
- **`budget_optimize_on`** (CBO) — `true` to enable Campaign Budget Optimization. When true, you must set a campaign-level `optimization_goal` and *cannot* set per-adgroup budgets.
- **Campaign name** — up to 512 chars; emoji not supported.

### List

`GET /campaign/get/` with `advertiser_id`, optional `filtering` (JSON object: `campaign_ids`, `status`, `objective_type`, `creation_filter_start_time` …), `page`, `page_size`, `fields`.

---

## 5. Ad Group Management

Base path: `/open_api/v1.3/adgroup/`

| Op | Path |
|---|---|
| Create | `POST /adgroup/create/` |
| Update | `POST /adgroup/update/` |
| Status update | `POST /adgroup/status/update/` |
| List | `GET /adgroup/get/` |

### Create — high-value fields

```json
{
  "advertiser_id": "1234567890",
  "campaign_id": "171...",
  "adgroup_name": "US 18-34 — Shoppers",

  "placement_type": "PLACEMENT_TYPE_NORMAL",
  "placements": ["PLACEMENT_TIKTOK"],

  "location_ids": ["6252001"],
  "age_groups": ["AGE_25_34","AGE_35_44"],
  "gender": "GENDER_UNLIMITED",
  "interest_category_ids": [],
  "action_categories": [],
  "audience_ids": [],
  "excluded_audience_ids": [],

  "budget_mode": "BUDGET_MODE_DAY",
  "budget": 25.00,
  "schedule_type": "SCHEDULE_START_END",
  "schedule_start_time": "2026-05-01 00:00:00",
  "schedule_end_time":   "2026-05-31 23:59:59",

  "optimization_goal": "CONVERT",
  "billing_event": "OCPM",
  "bid_type": "BID_TYPE_NO_BID",
  "pacing": "PACING_MODE_SMOOTH",

  "pixel_id": "C...",
  "optimization_event": "COMPLETE_PAYMENT"
}
```

### Gotchas

- **`placement_type`**: `PLACEMENT_TYPE_AUTOMATIC` lets TikTok choose; `PLACEMENT_TYPE_NORMAL` requires explicit `placements` array. Valid placements include `PLACEMENT_TIKTOK`, `PLACEMENT_PANGLE` (off-platform inventory), `PLACEMENT_TOPBUZZ`, `PLACEMENT_GLOBAL_APP_BUNDLE`. Pangle is **not available in all markets** — passing it where it's blocked errors at creation.
- **`billing_event`** vs **`optimization_goal`** are distinct. `billing_event` is what TikTok bills (`CPC`, `CPM`, `OCPM`, `CPV`). `optimization_goal` is what the delivery system optimizes for (`CLICK`, `CONVERT`, `SHOW`, `REACH`, `VALUE`, `INSTALL`, `IN_APP_EVENT`, `LEAD_GENERATION`). Not all combos are valid.
- **Conversion optimization (`optimization_goal=CONVERT` or `VALUE`)** requires `pixel_id` + `optimization_event`. Without a firing pixel for 7+ days, creative won't learn and CPA balloons.
- **Schedule** — dates are in advertiser timezone; format `YYYY-MM-DD HH:MM:SS` (no TZ offset in the string).
- **Budget floor** — TikTok enforces minimums (roughly $20 USD/day for conversion campaigns, $50/day for some objectives). The API error is `40002` range with a human-readable message.

---

## 6. Ad Management

Base path: `/open_api/v1.3/ad/`

| Op | Path |
|---|---|
| Create | `POST /ad/create/` |
| Update | `POST /ad/update/` |
| Status update | `POST /ad/status/update/` |
| List | `GET /ad/get/` |

### Create shape (abbreviated)

```json
{
  "advertiser_id": "1234567890",
  "adgroup_id": "171...",
  "creatives": [
    {
      "ad_name": "Palvento_Apr_V1",
      "ad_format": "SINGLE_VIDEO",
      "identity_type": "CUSTOMIZED_USER",
      "identity_id": "...",
      "video_id": "v1234...",
      "image_ids": ["i1234..."],
      "ad_text": "Sell everywhere from one screen.",
      "call_to_action": "LEARN_MORE",
      "landing_page_url": "https://palvento.com/signup?utm_source=tiktok"
    }
  ]
}
```

- **`ad_format`** — `SINGLE_VIDEO`, `SINGLE_IMAGE` (placement-dependent), `CAROUSEL_ADS`, `CATALOG_CAROUSEL`, `SPARK_ADS`.
- **`identity_type`** options: `CUSTOMIZED_USER` (fake display name/avatar — advertiser owns), `AUTH_CODE` (creator-authorized Spark), `TT_USER` (branded TikTok account), `BC_AUTH_TT` (BC-authorized TT account).
- One `ad/create/` call can ship up to **20 ads** in one `creatives[]` array.
- `landing_page_url` must be HTTPS and must match an approved domain for some objectives.

---

## 7. Creative Management (Images, Videos, Spark Ads)

### 7.1 Upload image

`POST /open_api/v1.3/file/image/ad/upload/` — `multipart/form-data`

Fields:
- `advertiser_id`
- `upload_type` — `UPLOAD_BY_FILE` | `UPLOAD_BY_URL` | `UPLOAD_BY_FILE_ID`
- `image_file` (binary) **or** `image_url` **or** `file_id`
- `image_signature` — **MD5 of the file bytes**, required on `UPLOAD_BY_FILE`

Response:
```json
{ "data": { "image_id": "ad-site-i/...", "url": "https://...", "width": 1080, "height": 1920, "size": 123456 } }
```

### 7.2 Upload video

`POST /open_api/v1.3/file/video/ad/upload/` — `multipart/form-data`

Same pattern as image: `upload_type`, `video_file` | `video_url`, plus `video_signature` (MD5) for file uploads. Returns `video_id`, `duration`, `width`, `height`, `bit_rate`, `format`, `poster_url`.

Videos take a while to transcode — after upload you must poll `/file/video/ad/info/` (or equivalent) until `material_status = 1` (READY) before using the `video_id` in an ad.

### 7.3 Generated poster / cover images

`POST /open_api/v1.3/file/video/suggestcover/` returns AI-suggested cover frames. For Spark Ads you do not upload a cover — TikTok uses the original post's cover.

### 7.4 Spark Ads (authorized posts)

Spark Ads run an existing organic TikTok post as a paid ad. Two auth paths:

- **Auth Code**: the creator taps `... → Ad settings → Generate code` in the TikTok app, which yields an alphanumeric TCM auth code (valid 7/30/60/365 days). You pass it via `POST /open_api/v1.3/tt_video/authorize/` or the equivalent Spark authorize endpoint to turn it into a `video_id` + `identity_id` tied to the creator's handle. Up to **20 codes per batch**.
- **BC TikTok Account Auth**: for creators linked through BC, no one-off code is needed — you directly reference the BC-linked identity.

Once authorized, pass `ad_format: "SPARK_ADS"`, the Spark `video_id`, and `identity_type: "AUTH_CODE"` (or `BC_AUTH_TT`) into `/ad/create/`.

### 7.5 Creative Library / Asset Group

Creatives can be stored in an advertiser's Asset Library and referenced across ads. Endpoints live under `/creative/portfolio/` and `/creative/` (name/group CRUD, material listing).

---

## 8. Reporting API

Base path: `/open_api/v1.3/report/`

### 8.1 Synchronous report

`GET /open_api/v1.3/report/integrated/get/`

Query (JSON arrays must be URL-encoded):
```
advertiser_id=1234567890
report_type=BASIC                         # BASIC | AUDIENCE | PLAYABLE_MATERIAL | CATALOG | SHOP | RESERVATION
data_level=AUCTION_AD                     # AUCTION_ADVERTISER | AUCTION_CAMPAIGN | AUCTION_ADGROUP | AUCTION_AD | RESERVATION_*
dimensions=["stat_time_day","ad_id"]
metrics=["spend","impressions","clicks","ctr","cpc","cpm",
         "conversion","cost_per_conversion","conversion_rate",
         "complete_payment","complete_payment_roas","total_purchase_value"]
start_date=2026-04-01
end_date=2026-04-24
page=1
page_size=1000
order_field=spend
order_type=DESC
filtering=[{"field_name":"campaign_ids","filter_type":"IN","filter_value":"[\"171...\"]"}]
```

Response `data.list[]` is an array of `{ dimensions: {...}, metrics: {...} }`.

### 8.2 Common dimensions

- Time: `stat_time_day`, `stat_time_hour`
- Entity: `advertiser_id`, `campaign_id`, `adgroup_id`, `ad_id`, `creative_id`
- Audience/placement: `country_code`, `province_id`, `dma_id`, `platform`, `placement`, `age`, `gender`, `interest_category`
- Audience report only: `interest`, `behavior`, `device`, `age+gender` combos

### 8.3 Common metrics

| Bucket | Metrics |
|---|---|
| Cost | `spend`, `cpc`, `cpm`, `cpv` |
| Reach | `impressions`, `reach`, `frequency` |
| Engagement | `clicks`, `ctr`, `video_play_actions`, `video_watched_2s`, `video_watched_6s`, `average_video_play`, `profile_visits`, `likes`, `comments`, `shares`, `follows` |
| Conversion (pixel) | `conversion`, `cost_per_conversion`, `conversion_rate`, `complete_payment`, `complete_payment_roas`, `total_purchase_value`, `total_complete_payment_rate` |
| App events | `app_install`, `registration`, `purchase`, `real_time_app_install`, `real_time_app_install_cost` |
| Catalog / Shop | `product_details_page_browse`, `gross_revenue`, `total_onsite_shopping_roas` |

### 8.4 Async report

Use when row count × days × dimensions would blow past the sync cap (~ several hundred thousand rows) or when you need audience/catalog reports over long windows.

| Op | Path |
|---|---|
| Create task | `POST /open_api/v1.3/report/task/create/` |
| Check status | `GET /open_api/v1.3/report/task/check/` |
| Download | `GET /open_api/v1.3/report/task/download/` (returns a signed CSV URL) |
| Cancel | `POST /open_api/v1.3/report/task/cancel/` |

Status values: `QUEUEING`, `PROCESSING`, `SUCCESS`, `FAILED`, `CANCELED`. Polling cadence recommended at 15–30s.

Async is an **allowlist feature** on some apps — if `report/task/create/` returns `40002` ("feature not available"), open a ticket with your TikTok rep to get it enabled.

### 8.5 Data latency / freshness

- TikTok Ads Manager UI lag: **~2 hours** for delivery-level stats.
- Reporting API lag is higher — commonly **~11 hours** for finalized numbers, with late backfills of up to 3 days on conversion metrics.
- **Re-pull rule of thumb**: whatever daily bucket you ingested, re-pull it on each run for the last **3 days** to catch late-attributed conversions. Don't treat yesterday's snapshot as final.
- Date range per request is capped: typically 30 days for ad-level hourly, 365 days for campaign-level daily. Async reports have larger windows.

---

## 9. Pixel & Events API (Server-to-Server)

TikTok consolidated the prior Web Events, App Events, and Offline Events endpoints into the **Events API (Enhanced)** under one endpoint.

### 9.1 Pixel CRUD

| Op | Path |
|---|---|
| Create pixel | `POST /open_api/v1.3/pixel/create/` |
| Update pixel | `POST /open_api/v1.3/pixel/update/` |
| List pixels | `GET /open_api/v1.3/pixel/list/` |

Pixel has a `pixel_code` (the public ID used in the JS snippet) and `pixel_id` (internal).

### 9.2 Send server events

`POST /open_api/v1.3/event/track/`

Body (Enhanced / unified schema):
```json
{
  "event_source": "web",
  "event_source_id": "C3F8...",                // pixel_code for web, app_id for app, offline_event_set_id for offline
  "data": [
    {
      "event": "CompletePayment",
      "event_id": "orders/PAL-9f8d2...",        // dedupe key with browser pixel
      "event_time": 1745500000,                 // Unix seconds
      "user": {
        "email": "<sha256 hex>",                 // PII must be SHA256 lowercase hex
        "phone": "<sha256 hex>",
        "ttclid": "E.C.P.AAA...",                // TikTok click id from click-through
        "ttp": "...",                            // _ttp cookie value
        "external_id": "<sha256 hex of user_id>",
        "ip": "203.0.113.1",
        "user_agent": "Mozilla/5.0 ..."
      },
      "properties": {
        "currency": "USD",
        "value": 129.95,
        "contents": [
          { "content_id": "SKU-123", "quantity": 1, "price": 129.95 }
        ],
        "content_type": "product"
      },
      "page": { "url": "https://palvento.com/checkout/complete" }
    }
  ]
}
```

- **Test Events**: add `"test_event_code": "TEST..."` at the top level to route events to the Pixel's Test Events tab without touching attribution.
- **Standard event names**: `ViewContent`, `ClickButton`, `Search`, `AddToWishlist`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`, `CompletePayment`, `PlaceAnOrder`, `Contact`, `Download`, `SubmitForm`, `CompleteRegistration`, `Subscribe`, `Purchase` (app-only alias).
- **Deduplication**: if both browser pixel and server API send the same event, use identical `event_id` in both places. TikTok dedupes on `(pixel_code, event, event_id)`.
- **Hashing**: all PII in `user.*` (except `ttclid`, `ttp`, `ip`, `user_agent`) must be **SHA256 lowercase hex**. Emails must be trimmed + lowercased before hashing. Phones normalized to E.164 before hashing.

### 9.3 Offline events

Same `/event/track/` endpoint with `event_source: "offline"` and `event_source_id = <offline_event_set_id>`. The offline event set is created in Ads Manager → Assets → Events → Offline events, and is what you attach to an ad group for offline attribution.

---

## 10. Catalog API (DPA)

Catalogs drive Dynamic Product Ads / Video Shopping Ads / Catalog Sales campaigns.

### 10.1 Catalog CRUD

| Op | Path |
|---|---|
| Create catalog | `POST /open_api/v1.3/catalog/create/` |
| List catalogs | `GET /open_api/v1.3/catalog/get/` |
| Update | `POST /open_api/v1.3/catalog/update/` |
| Delete | `POST /open_api/v1.3/catalog/delete/` |

Required: `bc_id` (catalogs live under a BC, not an advertiser directly), `name`, `region` (ISO-3166 alpha-2 list), `currency`.

### 10.2 Product sync — three modes

**A. Feed URL (scheduled pull)** — TikTok pulls a hosted feed on a schedule.

| Op | Path |
|---|---|
| Create feed | `POST /open_api/v1.3/catalog/feed/create/` |
| Update feed | `POST /open_api/v1.3/catalog/feed/update/` |
| Get feeds | `GET /open_api/v1.3/catalog/feed/get/` |
| Last operations | `GET /open_api/v1.3/catalog/feed/operation/get/` |

Feed supports XML (Google Merchant spec) or CSV. Schedules: `ONE_TIME`, `HOURLY`, `DAILY`, `WEEKLY`. For hourly, TikTok will actually fetch on an internal cadence ~every 30–60 min.

**B. File upload (one-shot)** — `POST /open_api/v1.3/catalog/product/file/upload/` — push a CSV/XML directly, same format as a hosted feed.

**C. Direct API (per-SKU)** — for large, fast-changing inventories where feed latency hurts:

| Op | Path |
|---|---|
| Upsert products | `POST /open_api/v1.3/catalog/product/upload/` |
| Delete products | `POST /open_api/v1.3/catalog/product/delete/` |
| Get products | `GET /open_api/v1.3/catalog/product/get/` |

Bulk: up to ~5,000 products per call. Async processing — call returns a `task_id`; poll `/catalog/product/task/check/` for per-SKU success/failure.

### 10.3 Product set (for ad targeting)

`POST /open_api/v1.3/catalog/product_set/create/` — create targeted subsets (e.g. "in stock + price > $50"). Ad groups in `CATALOG_SALES` / `SHOP_PURCHASES` campaigns target `product_set_id`, not the raw catalog.

### 10.4 Catalog gotchas

- Feed URL is **the most operationally brittle**: if the host is slow, TLS expires, or returns partial content, TikTok silently disables the feed and the ads stop serving new SKUs. Alarm on `feed/operation/get/` returning `FAILED` or `WARNING`.
- Direct-API upserts are **eventually consistent** — `task_id` says "SUCCESS" but the product can still be in `PENDING_REVIEW` for 10–60 minutes before eligible in DPA.
- Currency/region lock: a catalog is pinned to a region+currency. Palvento running multi-currency stores needs one TikTok catalog per currency, not one global catalog.
- Shopify merchants often use the **TikTok Shopify app** which manages its own catalog behind the scenes; if Palvento also uploads via API to the same advertiser, you'll get **duplicate catalogs**. Decide ownership before you ship.

---

## 11. Audience API

Base path: `/open_api/v1.3/dmp/`

### 11.1 File-upload custom audiences

`POST /open_api/v1.3/dmp/custom_audience/file/upload/` — multipart upload

- Supported identifier types: `EMAIL_SHA256`, `PHONE_SHA256`, `IDFA_SHA256` / `GAID_SHA256` (raw MAID also accepted by some regions).
- Minimum: **1,000 entries** per file to create/activate an audience.
- After upload you call `POST /dmp/custom_audience/create/` to materialize the audience from uploaded files.

### 11.2 Audience types

| Type | Endpoint hint |
|---|---|
| Customer file | `dmp/custom_audience/file/*` |
| Engagement (TikTok interactors) | `dmp/custom_audience/create/` with `audience_sub_type: "ENGAGEMENT"` |
| App activity | `dmp/custom_audience/create/` with `ENGAGEMENT_APP` |
| Website (pixel) | `dmp/custom_audience/create/` with `PIXEL_RELATED` |
| Lookalike | `POST /dmp/custom_audience/lookalike/create/` |
| Saved audience (targeting preset) | `POST /dmp/saved_audience/create/` |

### 11.3 Rules / quotas

- Per-advertiser cap: ~**400 custom audiences** active at once.
- Lookalike seed needs ≥ 1,000 matched users and typically takes **24–48h** to build before it's usable in an ad group.
- Audiences sync **across BC advertisers** only if created at BC level and shared — per-advertiser audiences don't auto-propagate.

---

## 12. Business Center (BC) API

Base path: `/open_api/v1.3/bc/`

| Op | Path | Notes |
|---|---|---|
| List BCs | `GET /bc/get/` | What BCs this token can see |
| List advertisers under BC | `GET /bc/advertiser/get/` | Add new advertisers to Palvento without re-auth |
| List partners | `GET /bc/partner/get/` | Agencies |
| List members | `GET /bc/member/get/` | Users + their scopes |
| Asset permission grant | `POST /bc/asset/permission/grant/` | Share pixel/audience/catalog across advertisers |
| Transfer asset | `POST /bc/asset/assign/` | Move an advertiser between BCs |

BC authentication is the preferred model for Palvento's "one token, many customer ad accounts" case — grants one `Access-Token` the ability to operate across any advertiser the BC owns or has been granted, and new advertisers added to the BC become automatically accessible without extra OAuth rounds.

---

## 13. Rate Limits & Quotas

TikTok does not publish an official hard rate-limit table; the enforced behavior surfaces through error codes.

### 13.1 Observed tiers

- **Default (standard apps)**: ~**10 QPS per app, per advertiser**. Bursts over 10 QPS return `40100` (QPS limit).
- **Advanced / allowlisted apps**: **20 QPS** per advertiser, and ~**500 QPS app-wide** pool across advertisers. Requires TikTok BD/partner review.
- **Reporting**: synchronous reports are subject to the same QPS as other endpoints; additionally, concurrent async report tasks are capped per advertiser (commonly ~**3 concurrent** per advertiser, ~**50 queued** per app). Exceeding returns a dedicated async-quota error from `/report/task/create/`.
- **Catalog direct-API**: internal cap of ~**10 bulk upserts/sec** per BC. Hot-syncing a Shopify catalog of 100k SKUs will take several minutes at full throttle.
- **Events API**: ~**100 requests/sec per pixel**, with `data[]` arrays of up to 1,000 events per request, so effective event throughput is much higher than request count.

### 13.2 Enforcement and recovery

- Sliding window is **~1 minute**.
- On `40100`, back off exponentially with jitter; don't synchronously retry in-loop.
- Headers sometimes include `X-TT-LOGID`; log this alongside `request_id` for support tickets.

---

## 14. Sandbox

- Host: `https://sandbox-ads.tiktok.com` (replace `business-api.tiktok.com` everywhere).
- Provisioned from `business-api.tiktok.com/portal` → your app → **Sandbox** tab.
- Create up to **10 test advertisers** per sandbox app; each gets its own `advertiser_id` and a stub access token.
- **What works**: full campaign/adgroup/ad lifecycle, creative upload, targeting, pixel CRUD, events API, most reporting.
- **What doesn't work / differs**:
  - No real delivery — impressions/clicks/spend are always 0. You can't test live ROAS.
  - Review/approval stages are short-circuited or skipped — production will fail on rules that sandbox lets pass (disallowed creative, landing-page domain mismatches).
  - Some asset types (Spark Ads with real TT accounts, Business Center, some audience sources) are unavailable or return stubbed IDs.
  - Catalog feed URLs must be publicly reachable (sandbox still really goes and fetches them).
- No BC in sandbox in the standard setup — BC flows require production tokens.

---

## 15. Error Codes

Error codes are integers returned in the JSON body (`code` + `message`). HTTP status is almost always **200** even on business-logic errors — do not rely on it.

### 15.1 Common codes

| Code | Meaning | Notes |
|---|---|---|
| 0 | Success | — |
| 40001 | Invalid parameter | Missing or wrong-type field; `message` usually names it |
| 40002 | Business rule violation | Most common "you did a thing you're not allowed to do" — budget floor, invalid objective for region, feature not allowlisted |
| 40100 | QPS / rate limit exceeded | Back off |
| 40101 | Daily limit exceeded | App-level daily call cap |
| 40105 | Access token invalid / expired / revoked | Force re-auth flow |
| 40106 | Permission denied (scope) | Token lacks the scope the endpoint requires |
| 40131 | Access token required | Usually missing `Access-Token` header |
| 40133 | App has no permission on this advertiser | Advertiser not in your authorized list; re-auth with this account |
| 40300 | Resource not found | Bad IDs (adgroup_id doesn't exist, deleted, or belongs to another advertiser) |
| 41200 | Async report failed | Check `/report/task/check/` `err_msg` |
| 50000 / 50002 | Server error | Retryable; open a ticket if persistent |
| 51103 | Catalog product upload partially failed | Inspect per-SKU `task/check/` response |

A zernio.com error code reference is a useful unofficial catalog for the long tail (see sources).

### 15.2 Handling pattern

```
if (code === 0) return data;
if (code === 40100 || code === 40101) → backoff + retry
if (code === 40105 || code === 40131) → mark token revoked, trigger re-auth
if (code === 40106 || code === 40133) → log; do NOT retry; surface to user as "scope missing"
if (code >= 50000 && code < 60000) → retry up to 3× with exponential backoff
else → fail; log request_id + code + message
```

---

## 16. Palvento Integration Notes

**Only relevant to our codebase — not part of the TikTok spec.**

- **Lazy client instantiation** — per the memory rule, do not instantiate a TikTok client at module scope. Build it inside the route handler: `const getTT = () => new TikTokClient({ accessToken: ... })`.
- **Channel OAuth status** — current channels done: Shopify; partial: eBay; blocked: Amazon MD9100. TikTok Marketing would be a **new channel** — mirror the Shopify shop_domain persistence pattern with `advertiser_id` (and `bc_id` when present) as the canonical key.
- **Reporting ingest**: plan a Supabase table partitioned by `advertiser_id, stat_date` with a 3-day re-pull window on each incremental sync. Store `spend_micros` as bigint, don't trust floats for currency.
- **Currency**: pull from `/advertiser/info/`, not from the report — reports return raw numbers without currency codes.
- **Webhooks**: TikTok Marketing API does not offer campaign-status webhooks. All data is pull-based. If we need "ad disapproved" notifications, we'll poll `/ad/get/?fields=["operation_status","secondary_status"]` on a short interval.
- **Do not build on sandbox-only flows**: test OAuth + reporting in production with a low-budget real advertiser before committing to the integration shape — sandbox's lack of real delivery hides the most important failure modes (spend pacing, conversion lag, creative review).

---

## 17. Source Links

Primary (official):
- TikTok API for Business portal: https://business-api.tiktok.com/portal
- Marketing API docs index: https://business-api.tiktok.com/portal/docs
- Marketing API Authorization FAQs (v1.3): https://business-api.tiktok.com/portal/docs/marketing-api-authorization-faqs/v1.3
- Official SDK repo (JS / Python / Java): https://github.com/tiktok/tiktok-business-api-sdk
  - Reporting API reference: https://github.com/tiktok/tiktok-business-api-sdk/blob/main/js_sdk/docs/ReportingApi.md
  - Campaign reference: https://github.com/tiktok/tiktok-business-api-sdk/blob/main/js_sdk/docs/CampaignCreationApi.md
  - Ad Group reference: https://github.com/tiktok/tiktok-business-api-sdk/blob/main/js_sdk/docs/AdgroupApi.md
  - Business Center reference: https://github.com/tiktok/tiktok-business-api-sdk/blob/main/js_sdk/docs/BCApi.md
  - Audience reference: https://github.com/tiktok/tiktok-business-api-sdk/blob/main/js_sdk/docs/AudienceApi.md
  - File upload reference: https://github.com/tiktok/tiktok-business-api-sdk/blob/main/java_sdk/docs/FileApi.md
- Postman collection (v1.3): https://www.postman.com/tiktok/tiktok-api-for-business/documentation/efqhadc/tiktok-business-api-v1-3
- Sandbox blog post: https://developers.tiktok.com/blog/introducing-sandbox
- Events API product page: https://ads.tiktok.com/help/article/events-api
- Events API — getting started: https://ads.tiktok.com/help/article/getting-started-events-api
- Standard events + parameters: https://ads.tiktok.com/help/article/standard-events-parameters
- Reporting metrics glossary: https://ads.tiktok.com/help/article/all-metrics
- Custom Audiences: https://ads.tiktok.com/help/article/custom-audiences
- Spark Ads: https://ads.tiktok.com/help/article/spark-ads
- TikTok API error handling (v2, partial overlap): https://developers.tiktok.com/doc/tiktok-api-v2-error-handling
- TikTok API rate limits (v2): https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit

Unofficial but useful:
- Error code reference: https://zernio.com/tiktok/errors
- Kitchn API tutorial (reporting + creation): https://www.kitchn.io/blog/tiktok-ads-api-introduction
- Airbyte connector rate-limit issue (real-world quota evidence): https://github.com/airbytehq/airbyte/issues/70992
- Community-fork SDK error code reference: https://deepwiki.com/ldsink/python-tiktok-business-api-sdk/7.3-error-code-reference
