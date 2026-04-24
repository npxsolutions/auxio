# TikTok Shop Partner API — Reference

Internal reference for Palvento's TikTok Shop integration. Written before approval/live creds so we can ship fast when they land. Scaffold lives at `app/lib/tiktok-shop/client.ts`.

**Status (2026-04):** OAuth + HMAC-SHA256 signing scaffolded, no live app credentials yet. Official portal: <https://partner.tiktokshop.com/>. Most API reference pages are JS-rendered SPAs — several sections below were cross-referenced against public third-party SDKs (EcomPHP/tiktokshop-php, ipfans/tiktok) when the portal was not scrapable.

> Docs version targeted here: **202309** (stable, most widely used) with notes on **202407** / **202508** deltas where known. TikTok bumps API minor versions frequently; re-verify before GA.

---

## Table of Contents

- [1. Concepts & Hosts](#1-concepts--hosts)
- [2. Authorization (OAuth)](#2-authorization-oauth)
- [3. Request Signing (HMAC-SHA256)](#3-request-signing-hmac-sha256)
- [4. Shop Cipher & Multi-Shop](#4-shop-cipher--multi-shop)
- [5. Products API](#5-products-api)
- [6. Orders API](#6-orders-api)
- [7. Fulfillment / Logistics API](#7-fulfillment--logistics-api)
- [8. Returns & Refunds API](#8-returns--refunds-api)
- [9. Webhooks](#9-webhooks)
- [10. Rate Limits](#10-rate-limits)
- [11. Error Codes](#11-error-codes)
- [12. Regional Differences](#12-regional-differences)
- [13. Gotchas & Things We've Learned](#13-gotchas--things-weve-learned)
- [14. Source Links](#14-source-links)

---

## 1. Concepts & Hosts

TikTok Shop exposes one Open API surface behind **two separate portals**:

| Portal | URL | For |
|---|---|---|
| **US Partner Portal** | partner.us.tiktokshop.com | US-registered companies targeting US shops only |
| **Global Partner Portal** | partner.tiktokshop.com | All other regions (UK, DE, IT, FR, IE, ES, ID, MY, PH, SG, TH, VN, MX, BR, JP) |

If you need to sell in both the US **and** internationally, you must create **two separate developer accounts** and maintain **two separate app_key / app_secret pairs**. Webhook URLs are registered per-app.

**API hosts (all API calls):**

- Production: `https://open-api.tiktokglobalshop.com`
- Sandbox: `https://open-api-sandbox.tiktokglobalshop.com` (where available)
- OAuth token endpoint: `https://auth.tiktok-shops.com`

All API calls follow the pattern:

```
{HOST}/{resource}/{version}/{path}
e.g. https://open-api.tiktokglobalshop.com/product/202309/products/search
```

Common query params every authenticated call must carry:

- `app_key` — app credential
- `timestamp` — Unix seconds (not ms)
- `sign` — HMAC-SHA256 signature (see §3)
- `shop_cipher` — encrypted shop identifier (see §4), required for most endpoints in 202309+
- `version` — optional explicit pin, usually inferred from path

The access token goes in the `x-tts-access-token` **header**, NOT the query string (as of 202309). Older docs and our scaffold currently pass it as a query param — this needs fixing, see §13.

> Source: <https://partner.tiktokshop.com/docv2/page/tts-api-concepts-overview>, <https://partner.tiktokshop.com/docv2/page/methods-and-endpoints>

---

## 2. Authorization (OAuth)

TikTok Shop uses a non-standard OAuth-ish flow: 3-legged authorization via the Seller Center, then an app-key-authenticated code exchange.

### 2.1 Authorization URL (seller consent)

Redirect the seller to:

```
https://services.tiktokshop.com/open/authorize?service_id={SERVICE_ID}&state={CSRF_TOKEN}
```

- `service_id` — assigned per app in the partner portal (NOT the same as `app_key`)
- `state` — opaque CSRF token, TikTok echoes it back
- `app_key` is **not** sent here (unlike typical OAuth)

TikTok redirects back to the app's configured callback URL with:

```
?code={AUTH_CODE}&locale=en&state={CSRF_TOKEN}
```

The `code` expires in ~10 minutes.

### 2.2 Code exchange

```http
GET https://auth.tiktok-shops.com/api/v2/token/get
  ?app_key={APP_KEY}
  &app_secret={APP_SECRET}
  &auth_code={CODE}
  &grant_type=authorized_code
```

**Note:** this endpoint is NOT signed with HMAC — `app_secret` is sent in the query string. Yes, really.

Response:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "ROW_CBxxx...",
    "access_token_expire_in": 1734567890,   // absolute epoch seconds
    "refresh_token": "ROW_xxx...",
    "refresh_token_expire_in": 1766103890,
    "open_id": "7123456789012345678",
    "seller_name": "Acme Co",
    "seller_base_region": "GB",
    "user_type": 0,                          // 0=merchant, 1=creator
    "granted_scopes": ["product.read","order.read", ...]
  }
}
```

Persist all fields. Note `expire_in` is an **absolute epoch**, not a relative TTL (the field name is misleading).

### 2.3 Token lifetimes

| Token | Default lifetime | Refreshable? |
|---|---|---|
| `access_token` | 7 days (rolling) | Yes |
| `refresh_token` | 365 days | Yes — new one returned every refresh |
| `auth_code` | ~10 minutes | No (one-shot) |

### 2.4 Refresh flow

```http
GET https://auth.tiktok-shops.com/api/v2/token/refresh
  ?app_key={APP_KEY}
  &app_secret={APP_SECRET}
  &refresh_token={REFRESH_TOKEN}
  &grant_type=refresh_token
```

Always store the **new** refresh_token returned — the old one is invalidated. Refresh tokens rotate.

### 2.5 Get authorized shops

After token exchange, call this to discover which shops the seller granted you access to and to get the all-important `cipher` for each:

```http
GET /authorization/202309/shops
Headers: x-tts-access-token: {ACCESS_TOKEN}
Query:   app_key, sign, timestamp
```

Response includes an array of `shops[]` each with:

- `id` — shop_id (numeric string)
- `name` — display name
- `region` — 2-letter ISO (US, GB, etc.)
- `seller_type` — CROSS_BORDER | LOCAL
- `cipher` — the **shop_cipher** value, needed on nearly every downstream call

### 2.6 De-authorization

Sellers can revoke access in Seller Center. Detect via:

- The `SELLER_DEAUTHORIZE` webhook event (type 8), OR
- Any API call returning error code `105002` (invalid_access_token, shop_cipher mismatch)

On deauth, keep the row but flag `status = 'revoked'`. Don't delete — sellers sometimes reauthorize and you want a clean idempotent reattach keyed on `shop_id`.

> Sources:
> - <https://partner.tiktokshop.com/docv2/page/678e3a3292b0f40314a92d75> (202407 overview)
> - <https://partner.tiktokshop.com/docv2/page/authorization-guide-202309>
> - <https://partner.tiktokshop.com/docv2/page/get-authorized-shops>
> - <https://partner.tiktokshop.com/docv2/page/reauthorize-shops>

---

## 3. Request Signing (HMAC-SHA256)

Every API call (except the token endpoints in §2.2 / §2.4) must be signed.

### 3.1 Algorithm

```
1. Collect all query params EXCEPT `sign` and `access_token`
2. Sort keys ASCII-ascending
3. Concatenate as `{k1}{v1}{k2}{v2}...`  — NO separators, NO URL-encoding
4. Prepend the request path (leading slash, no host, no query)
5. Append the raw request body (only if Content-Type is application/json AND body is non-empty)
6. Wrap with app_secret on both ends:
     canonical = app_secret + path + joined_params + body + app_secret
7. sign = lowercase_hex(HMAC_SHA256(app_secret, canonical))
8. Add `sign` back to the query string
```

### 3.2 Example (pseudocode, mirrors `client.ts`)

```ts
const canonical = appSecret + path + sortedJoined + (body ?? '') + appSecret
const sign = createHmac('sha256', appSecret).update(canonical).digest('hex')
```

Our current scaffold in `client.ts` implements this correctly.

### 3.3 Rules

- **Timestamp window:** ±5 minutes from TikTok's clock. NTP-sync your production servers; Vercel functions are fine.
- **Timestamp units:** seconds, not milliseconds. Some third-party docs get this wrong.
- **Body signing applies only when Content-Type: application/json.** If you upload `multipart/form-data` (e.g. product images), omit the body from the canonical string.
- **URL encoding:** sign the **raw** (unencoded) values; only encode when actually sending the URL. Biggest source of 35002 errors.
- **Nested JSON body:** sign the exact minified JSON you'll send. Any reformatting between sign and send breaks the signature.
- **Path:** exactly as sent, including any trailing ID (e.g. `/product/202309/products/1729382901`).

### 3.4 Headers required on every call

```
Content-Type: application/json
x-tts-access-token: {ACCESS_TOKEN}
User-Agent: Palvento/1.0 (+https://palvento.com)
```

> Source: <https://partner.tiktokshop.com/docv2/page/sign-your-api-request>

---

## 4. Shop Cipher & Multi-Shop

`shop_cipher` is an opaque encrypted shop identifier that **must** be passed as a query param on almost every 202309+ endpoint. It's returned by `GET /authorization/202309/shops` (§2.5).

- Format: `ROW_<base64ish>` (ROW = rest-of-world) or `TTS_<...>` (US)
- **Do not** use `shop_id` alone — most endpoints require the cipher
- A single `access_token` can cover multiple `shop_id` / `shop_cipher` pairs (e.g. a cross-border seller with US + UK shops)
- The cipher is **stable** across reauthorizations for the same shop, but you should still refetch after any reauth to be safe

**Palvento schema implication:** the `tiktok_shops` table needs `(shop_id, shop_cipher, region, access_token, refresh_token, token_expires_at, refresh_expires_at)` per seller connection.

---

## 5. Products API

Base path: `/product/202309/` (202407 and 202508 also exist; 202309 is the most battle-tested).

### 5.1 Product lifecycle states

| State | Meaning |
|---|---|
| `DRAFT` | Saved but not submitted for review |
| `PENDING` | Under TikTok moderation (can take minutes → hours) |
| `FAILED` | Rejected, reason in `audit_failed_reasons[]` |
| `ACTIVATE` | Live and sellable |
| `SELLER_DEACTIVATED` | Seller paused |
| `PLATFORM_DEACTIVATED` | TikTok paused (policy violation) |
| `FROZEN` | Compliance freeze |
| `DELETED` | Soft-deleted |

Product reviews (PENDING → ACTIVATE) are asynchronous. Don't expect a product to be live after the create call returns.

### 5.2 Core endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/product/202309/products/search` | Paginated list (use for catalog sync) |
| `GET`  | `/product/202309/products/{product_id}` | Full detail |
| `POST` | `/product/202309/products` | Create |
| `PUT`  | `/product/202309/products/{product_id}` | Full update (replaces) |
| `POST` | `/product/202309/products/{product_id}/partial_edit` | Partial update (safer) |
| `DELETE` | `/product/202309/products` | Bulk delete (body: `{product_ids: []}`) |
| `POST` | `/product/202309/products/deactivate` | Pause listing |
| `POST` | `/product/202309/products/recover` | Unpause |
| `POST` | `/product/202309/products/inventory/update` | Update stock per SKU |
| `POST` | `/product/202309/prices/update` | Update price per SKU |

### 5.3 Taxonomy / rules (call before create)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/product/202309/categories` | Full category tree |
| `POST` | `/product/202309/categories/recommend` | Suggest category from title+description+image |
| `GET` | `/product/202309/categories/{category_id}/rules` | Required attributes, size charts, age group for this category |
| `GET` | `/product/202309/categories/{category_id}/attributes` | Attribute schema (values + whether custom values allowed) |
| `GET` | `/product/202309/brands` | Brand list (with `is_authorized` flag) |

### 5.4 Images & assets

Images are uploaded first, then referenced by URI in the product payload:

- `POST /product/202309/images/upload` — multipart/form-data, returns `uri`
- `POST /product/202309/files/upload` — for certification docs / compliance PDFs

Image constraints (202309):
- JPG/PNG, ≤5 MB each, ≥600×600 px, max 9 main images per product
- Width/height ratio 1:1 required for main image

### 5.5 Warehouses

Cross-border sellers must bind each SKU to a warehouse:

- `GET /logistics/202309/warehouses` — list authorized warehouses
- SKU creation requires `warehouse_id` per SKU

### 5.6 Payload shape (create product, abridged)

```json
{
  "title": "Matcha Set — Ceremonial Grade",
  "description": "<p>...HTML allowed...</p>",
  "category_id": "903241",
  "brand_id": "7288001234",
  "main_images": [{"uri": "tos-...."}],
  "skus": [
    {
      "sales_attributes": [{"name": "Size", "value_name": "100g"}],
      "price": {"amount": "29.99", "currency": "GBP"},
      "inventory": [{"warehouse_id": "7288999", "quantity": 120}],
      "seller_sku": "MATCHA-100"
    }
  ],
  "package_weight": {"value": "0.2", "unit": "KILOGRAM"},
  "package_dimensions": {"length":"10","width":"10","height":"5","unit":"CENTIMETER"},
  "product_attributes": [{"id":"100392","values":[{"id":"1001","name":"Japan"}]}]
}
```

Fields to persist: `product_id`, `status`, `audit_failed_reasons`, every `sku_id`, `seller_sku`, per-SKU `warehouse_id`.

> Sources:
> - <https://partner.tiktokshop.com/docv2/page/6502fc8da57708028b42b18a> (Create Product)
> - <https://partner.tiktokshop.com/docv2/page/edit-product-202309>
> - <https://partner.tiktokshop.com/docv2/page/get-category-rules-202309>
> - <https://partner.tiktokshop.com/docv2/page/products-api-overview>

---

## 6. Orders API

Base path: `/order/202309/`.

### 6.1 Order states

| Status | Meaning |
|---|---|
| `UNPAID` | Awaiting buyer payment |
| `AWAITING_SHIPMENT` | Paid, needs `ship_package` from seller |
| `AWAITING_COLLECTION` | Label printed, needs carrier handoff |
| `PARTIALLY_SHIPPING` | Multi-package, some sent |
| `IN_TRANSIT` | Carrier scanned |
| `DELIVERED` | End |
| `COMPLETED` | Buyer confirmed / auto-completed after return window |
| `CANCELLED` | Pre-ship cancellation |

Also: `ON_HOLD` (compliance), `PENDING_FULFILLMENT` (FBT/warehouse hold).

### 6.2 Core endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/order/202309/orders/search` | Paginated query (incremental sync) |
| `GET` | `/order/202309/orders` | Batch lookup by IDs (query param `ids`, max 50) |
| `GET` | `/order/202309/price_detail` | Line-item price breakdown (fees, taxes) |
| `POST` | `/order/202309/orders/{order_id}/cancel` | Seller-initiated cancel |

### 6.3 Search pattern

```json
POST /order/202309/orders/search?shop_cipher=...&page_size=50
{
  "order_status": "AWAITING_SHIPMENT",
  "create_time_ge": 1714204800,    // seconds
  "create_time_lt": 1714291200,
  "update_time_ge": 1714204800,    // prefer update_time for incremental
  "update_time_lt": 1714291200,
  "sort_field": "create_time",
  "sort_order": "DESC"
}
```

**Pagination:** cursor-based via `next_page_token`, not offset. Max window is ~7 days per query — longer windows 400.

Fields we'd persist per order: `order_id`, `buyer_uid` (opaque), `status`, `payment_info`, `shipping_provider_id`, `tracking_number`, `line_items[]` (each with `sku_id`, `product_id`, `seller_sku`, `sku_sale_price`, `platform_discount`, `seller_discount`), `recipient_address` (encrypted PII — see gotchas).

### 6.4 Cancellation

```http
POST /order/202309/orders/{order_id}/cancel
Body: { "cancel_reason_key": "OUT_OF_STOCK", "cancel_role": "SELLER" }
```

Reasons (from `GET /order/202309/orders/cancel_reasons`):
`OUT_OF_STOCK`, `PRICING_ERROR`, `CUSTOMER_REQUEST`, `UNRECOVERABLE_ADDRESS_ISSUE`, etc.

Cancellation after `AWAITING_COLLECTION` is typically blocked — use the refund flow instead.

> Sources:
> - <https://partner.tiktokshop.com/docv2/page/650b1b4bbace3e02b76d1011> (Order API overview)
> - <https://partner.tiktokshop.com/docv2/page/get-order-list-202309>
> - <https://partner.tiktokshop.com/docv2/page/get-order-detail-202309>
> - <https://partner.tiktokshop.com/docv2/page/cancel-order-202309>

---

## 7. Fulfillment / Logistics API

Base path: `/fulfillment/202309/`. There's also `/logistics/202309/` for carrier + warehouse metadata.

### 7.1 Happy-path flow

```
1. GET /logistics/202309/shipping_providers     → pick shipping_provider_id
2. POST /fulfillment/202309/packages            → create package(s) from order lines
3. POST /fulfillment/202309/packages/{package_id}/ship  → upload tracking
4. GET /fulfillment/202309/packages/{package_id}/shipping_documents  → label PDF
```

### 7.2 Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/logistics/202309/shipping_providers` | Available carriers for a shop |
| `GET` | `/logistics/202309/warehouses` | Authorized warehouses |
| `POST` | `/logistics/202309/warehouses/{warehouse_id}/delivery_options` | Delivery options per warehouse |
| `GET` | `/fulfillment/202309/orders/{order_id}/packages` | Packages on an order |
| `POST` | `/fulfillment/202309/packages` | Split order into 1+ packages |
| `POST` | `/fulfillment/202309/packages/combinable` | Check which packages can be combined |
| `POST` | `/fulfillment/202309/packages/{package_id}/combine` | Combine packages into one shipment |
| `POST` | `/fulfillment/202309/packages/{package_id}/uncombine` | Split apart |
| `POST` | `/fulfillment/202309/packages/{package_id}/ship` | Upload tracking # |
| `POST` | `/fulfillment/202309/packages/{package_id}/update_shipping_info` | Correct tracking post-ship |
| `GET` | `/fulfillment/202309/packages/{package_id}/shipping_documents` | Get label / packing slip |
| `POST` | `/fulfillment/202309/packages/{package_id}/handover` | Mark carrier pickup |
| `POST` | `/fulfillment/202309/orders/search_package` | Find packages by order |

### 7.3 Shipping document types

```
?document_type=SHIPPING_LABEL | PICK_LIST | PACKING_SLIP
?document_size=A6 | A5 | LETTER
```

Returns a short-lived PDF URL (expires ~1 hour). Download and re-host if you need to show it later in the UI.

### 7.4 Shipping types

- **Platform Shipping / TikTok Shipping:** TikTok provides the label. You only need to `handover` (not `ship`).
- **Seller Shipping:** You upload tracking + the label comes from your own carrier integration.

Which one applies is dictated by the shop's settings + the order's `shipping_type`. Always inspect `order.shipping_type` before deciding which endpoint sequence to run.

### 7.5 Tracking requirement

Sellers have an **Order Handling Time** SLA (typically 1–3 business days). Missing this triggers `late_ship` penalties on the seller account. Upload tracking via `/packages/{id}/ship` within that window:

```json
POST /fulfillment/202309/packages/pkg_001/ship
{
  "tracking_number": "1Z999AA10123456784",
  "shipping_provider_id": "7200000000001"
}
```

> Sources:
> - <https://partner.tiktokshop.com/docv2/page/650b2044f1fd3102b93c9178>
> - <https://partner.tiktokshop.com/docv2/page/update-shipping-info-202309>
> - <https://partner.tiktokshop.com/docv2/page/get-package-shipping-document-202309>

---

## 8. Returns & Refunds API

Base path: `/return_refund/202309/`. This also handles buyer-initiated order **cancellations** (before ship) and **claims** (after ship).

### 8.1 Reverse flow states

```
REQUESTING → APPROVED → RETURNING (buyer ships back) → RECEIVED
          ↘ REJECTED
```

Refund-only (no return) skips the RETURNING stage.

### 8.2 Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/return_refund/202309/returns/search` | List return/refund requests |
| `GET`  | `/return_refund/202309/returns/{return_id}` | Detail |
| `POST` | `/return_refund/202309/returns/{return_id}/records` | List status history |
| `POST` | `/return_refund/202309/returns/{return_id}/approve` | Seller approves |
| `POST` | `/return_refund/202309/returns/{return_id}/reject` | Seller rejects (needs reason + evidence) |
| `POST` | `/return_refund/202309/returns/{return_id}/calculate` | Preview refund amount |
| `POST` | `/return_refund/202309/cancellations/search` | Pre-ship buyer cancellation requests |
| `POST` | `/return_refund/202309/cancellations/{cancellation_id}/approve` | Approve buyer cancel |
| `POST` | `/return_refund/202309/cancellations/{cancellation_id}/reject` | Reject buyer cancel |

### 8.3 Rejection evidence

Rejections require evidence — `images[]` (uploaded via `/files/upload`) and a `reason` enum from:
`BUYER_MISSING_ITEMS`, `ITEM_NOT_RECEIVED_DELIVERED`, `SELLER_NOT_RECEIVED_RETURN`, `BUYER_RETURN_WRONG_ITEM`, `OTHER` + `reason_text`.

If the seller fails to respond within **48 hours** (configurable per region), TikTok **auto-approves** the buyer's request. Build your UI / cron around this.

> Sources:
> - <https://partner.tiktokshop.com/docv2/page/return-refund-and-cancel-api-overview>
> - <https://partner.tiktokshop.com/docv2/page/650b2001bace3e02b76db38a>

---

## 9. Webhooks

TikTok Shop pushes events to a single URL you configure per app in the Partner portal (Apps → App Management → Webhook).

### 9.1 Event types

| type | Name | Fires on |
|---|---|---|
| `1` | ORDER_STATUS_CHANGE | Any order state transition |
| `2` | REVERSE_STATUS_CHANGE | Return/refund state changes |
| `3` | RECIPIENT_ADDRESS_UPDATE | Buyer edited shipping address (rare, usually pre-ship) |
| `4` | PACKAGE_UPDATE | Package created/updated/split/combined |
| `5` | PRODUCT_STATUS_CHANGE | Audit result (PENDING→ACTIVATE / FAILED) |
| `6` | SELLER_DEAUTHORIZE / AUTHORIZE | Auth changes |
| `7` | CANCELLATION_STATUS_CHANGE | Buyer-initiated cancel flow |
| `8` | SHOP_UPDATE | Shop name / settings changed |
| `9` | PRODUCT_UPDATE | Catalog edits |
| `10` | FINANCE_SETTLEMENT | Payout posted |

Each POST body has shape:

```json
{
  "type": 1,
  "shop_id": "7493...",
  "timestamp": 1714204850,
  "data": { /* type-specific payload */ },
  "tts_notification_id": "evt_abc123"
}
```

### 9.2 Signature verification

TikTok sends:

```
Headers:
  Content-Type: application/json
  Authorization: {SHA256_HEX}
```

The `Authorization` header value is:

```
sha256_hex(app_secret + raw_request_body)
```

Note this is **SHA-256 plain, not HMAC** — the secret is concatenated, not used as a key. Different from the API request signing in §3. Verify before processing.

### 9.3 Delivery guarantees

- **Timeout:** respond `200 OK` within **5 seconds** or TikTok marks it failed.
- **Retries:** up to 72 hours with exponential backoff.
- **At-least-once:** dedupe on `tts_notification_id`.
- **Ordering:** not guaranteed. Use `timestamp` + resync via API on every event rather than trusting the webhook payload alone.
- **HTTPS only**, must return plain-text `"success"` or 200 status.

### 9.4 Registration

Webhook URL is set in the portal UI, NOT via API. One URL per app, not per shop. Multiple event types can be toggled independently in the same UI.

> Sources:
> - <https://partner.tiktokshop.com/docv2/page/tts-webhooks-overview>
> - <https://partner.tiktokshop.com/docv2/page/650512b42f024f02be19755f>
> - <https://partner.tiktokshop.com/docv2/page/1-order-status-change>

---

## 10. Rate Limits

Rate limits are tiered per app, enforced per shop, calculated on a **1-minute sliding window**.

| Tier | Default QPS per shop | Typical scope |
|---|---|---|
| Basic (default) | **20 QPS** | Pre-GA apps |
| Advanced | 50 QPS | Approved apps after volume review |
| Custom | Negotiated | High-volume integrations |

Also per-endpoint ceilings:

- Product create/edit: ~10 QPS
- Inventory update: 20 QPS
- Order search: 20 QPS

Rate-limit response:

```http
HTTP/1.1 429
{ "code": 45002, "message": "request frequency limit" }
```

Also watch for:
- `35000` / `35001` — general throttle
- `45002` — per-shop QPS exceeded
- `90008` — per-app QPS exceeded

**Backoff:** TikTok does NOT send `Retry-After`. Implement your own: exponential backoff starting 1s, max 60s, with jitter.

> Source: <https://partner.tiktokshop.com/docv2/page/rate-limits>

---

## 11. Error Codes

Top-level envelope is always:

```json
{ "code": 0, "message": "success", "data": {...}, "request_id": "..." }
```

`code: 0` = success. Any non-zero code is an error; HTTP status may still be 200. Always check the envelope.

### 11.1 Common codes

| Code | Meaning | Action |
|---|---|---|
| `0` | Success | — |
| `10000` | Unknown error | Retry with backoff |
| `12000` | Validation failed (body) | Fix payload |
| `12001` | Missing required param | Fix payload |
| `35000` | Signature error | Re-check §3 |
| `35002` | Signature mismatch | Usually URL-encoding at sign time |
| `36000` | App key invalid | Check `app_key` env var |
| `36004` | App not approved for this API | Request scope in portal |
| `45002` | Shop rate limit exceeded | Backoff |
| `90008` | App rate limit exceeded | Backoff |
| `105001` | Access token expired | Refresh (§2.4) |
| `105002` | Access token invalid | Re-auth from scratch |
| `105003` | Shop_cipher invalid | Re-fetch via §2.5 |
| `106002` | Scope insufficient | Reauthorize with expanded scopes |
| `5001000` | Product not found | 404-ish |
| `9001000` | Order not found | 404-ish |

### 11.2 Retry strategy

- `105001` → refresh access_token and retry once
- `105002`, `105003`, `36000`, `36004` → surface to user, do not retry
- `35000`–`35999` → log full canonical string, do not retry (our bug)
- `45002`, `90008`, `10000` → exponential backoff, retry up to 5x
- `5xxxxxx` / `9xxxxxx` → resource-not-found, do not retry

> Source: <https://partner.tiktokshop.com/docv2/page/678e3a45786253031531b942>

---

## 12. Regional Differences

| Region | Portal | Token format | Notes |
|---|---|---|---|
| **US** | US Partner Portal | `TTS_xxx` | Separate app credentials. More strict taxonomy/compliance. Tax collection handled by TikTok (marketplace facilitator). |
| **UK** | Global Portal | `ROW_xxx` | GBP pricing. VAT required on product records. |
| **EU** (DE/FR/IT/ES/IE) | Global Portal | `ROW_xxx` | EUR pricing. EORI number required for cross-border. GPSR compliance fields mandatory 2025+. |
| **SG / MY / PH / TH / VN / ID** | Global Portal | `ROW_xxx` | Local currency. Local shipping providers only for some. |
| **MX / BR** | Global Portal | `ROW_xxx` | Newer markets, smaller taxonomy. |
| **JP** | Global Portal | `ROW_xxx` | JPY, strict category rules. |

All regions hit the **same API host** (`open-api.tiktokglobalshop.com`) — the region is encoded in the access_token and shop_cipher. Do not hardcode per-region hosts (our scaffold currently has a `HOSTS` map that's redundant, remove it).

**Shop region determines:**
- Currency on product / order records
- Available shipping_providers
- Available categories (subset of master tree)
- Compliance required fields (GPSR in EU, Prop 65 in US, etc.)
- Return policy defaults

---

## 13. Gotchas & Things We've Learned

In rough order of "will bite us hardest":

### 13.1 Access token is a HEADER, not a query param
Our current `tiktokCall()` puts `access_token` in the query string. That worked in older API versions but **202309+ requires** it in the `x-tts-access-token` header and it's NOT signed. Fix `app/lib/tiktok-shop/client.ts` before shipping.

### 13.2 `shop_cipher` is mandatory on nearly every 202309 call
Our `listOrders()` helper passes `shop_id` instead. That will 400 with code 105003. Replace with `shop_cipher` fetched during auth callback and persisted alongside the tokens.

### 13.3 Webhook signature is SHA-256 plain, NOT HMAC
Easy to get wrong because API request signing IS HMAC. Webhook signature is literally `sha256(app_secret + raw_body)`. Different from Shopify (HMAC-SHA256) and from TikTok's own API signing. Implement as a separate helper — don't reuse `signRequest()`.

### 13.4 Timestamps are seconds, not milliseconds
All TikTok timestamps (request `timestamp`, order `create_time`, webhook `timestamp`) are **Unix seconds**. Most of our other integrations (Shopify webhooks, Stripe) use milliseconds. Convert at the boundary.

### 13.5 Refresh tokens rotate every refresh
Old refresh token is dead immediately. If you call `/token/refresh` twice with the same token, the second call fails. Wrap refresh in a Supabase `UPDATE ... RETURNING` mutex or you'll lock out the seller under concurrency.

### 13.6 Auto-approval of returns at 48h
If we don't call the approve/reject endpoint within 48 hours, TikTok auto-approves the refund and we lose leverage. Need a cron + UI badge to surface this to sellers.

### 13.7 `access_token_expire_in` is an absolute epoch, not a TTL
The field name suggests relative seconds ("expires in 604800 seconds"). It's actually an **absolute Unix second epoch**. Store as-is and compare against `Date.now() / 1000`.

### 13.8 Product audit is async with no guaranteed SLA
`POST /products` returns `product_id` + `status: PENDING`. Moderation can take anywhere from 2 minutes to 6 hours. Webhook type 5 (PRODUCT_STATUS_CHANGE) tells you when it flips — don't poll.

### 13.9 Shipping label URLs expire in ~1 hour
Re-host if we need to display it persistently. Don't store the TikTok URL in DB past 30 minutes.

### 13.10 Image 1:1 ratio requirement
Main image must be square. Sellers using Shopify tend to have 4:3 or 3:2 hero images. We need auto-cropping or sellers will bounce off with audit failures.

### 13.11 US vs Global apps require DIFFERENT credentials
If we want to support US sellers AND international sellers, we need to run two separate TikTok apps with two separate app_key/app_secret pairs, register two different webhook URLs, and maintain two approval tracks. Document this in onboarding — most sellers don't know which portal they fall under.

### 13.12 PII encryption in order responses
`recipient_address` comes back with encrypted fields (`name`, `phone`, `address_detail`) for some regions (EU especially, post-GDPR). You need to call `GET /order/202309/orders/{id}/address` with `decrypt=true` to get plaintext — and only when needed (logged). Plaintext caching should respect the deletion SLA (~72 hours post-delivery).

### 13.13 Cross-border vs local shop semantics
Cross-border sellers (`seller_type: CROSS_BORDER`) have extra requirements: warehouse bindings, customs docs, longer handling-time allowance. A product field or shipping flow that works for a US-local seller may 400 for a CB seller.

### 13.14 No bulk create for products
Each product creates with its own call. Plan for N calls + rate-limiting when importing a Shopify catalog. Use inventory/price bulk endpoints once live to minimize ongoing traffic.

### 13.15 `request_id` is the support ticket's magic string
Every response has a `request_id`. When opening a partner-support ticket, include it. Log it on every API call (ours currently doesn't — add to the `tiktokCall` error path).

---

## 14. Source Links

Primary portal (all require JS):

- Concepts: <https://partner.tiktokshop.com/docv2/page/tts-api-concepts-overview>
- Methods & endpoints index: <https://partner.tiktokshop.com/docv2/page/methods-and-endpoints>
- Authorization overview (202407): <https://partner.tiktokshop.com/docv2/page/678e3a3292b0f40314a92d75>
- Authorization guide (202309): <https://partner.tiktokshop.com/docv2/page/authorization-guide-202309>
- Create TTS App (OAuth client): <https://partner.tiktokshop.com/docv2/page/create-tts-app-oauth-client>
- Sign your API request: <https://partner.tiktokshop.com/docv2/page/sign-your-api-request>
- Generate test access token: <https://partner.tiktokshop.com/docv2/page/generate-test-access-token>
- Get Authorized Shops: <https://partner.tiktokshop.com/docv2/page/get-authorized-shops>
- Reauthorize shops: <https://partner.tiktokshop.com/docv2/page/reauthorize-shops>
- Product API overview: <https://partner.tiktokshop.com/docv2/page/products-api-overview>
- Create Product: <https://partner.tiktokshop.com/docv2/page/6502fc8da57708028b42b18a>
- Edit Product: <https://partner.tiktokshop.com/docv2/page/edit-product-202309>
- Search Product: <https://partner.tiktokshop.com/docv2/page/65854ffb8f559302d8a6acda>
- Get Category Rules: <https://partner.tiktokshop.com/docv2/page/get-category-rules-202309>
- Order API overview: <https://partner.tiktokshop.com/docv2/page/650b1b4bbace3e02b76d1011>
- Get Order List: <https://partner.tiktokshop.com/docv2/page/get-order-list-202309>
- Get Order Detail: <https://partner.tiktokshop.com/docv2/page/get-order-detail-202309>
- Cancel Order: <https://partner.tiktokshop.com/docv2/page/cancel-order-202309>
- Fulfillment API overview: <https://partner.tiktokshop.com/docv2/page/650b2044f1fd3102b93c9178>
- Update Shipping Info: <https://partner.tiktokshop.com/docv2/page/update-shipping-info-202309>
- Get Package Shipping Document: <https://partner.tiktokshop.com/docv2/page/get-package-shipping-document-202309>
- Return & Refund overview: <https://partner.tiktokshop.com/docv2/page/return-refund-and-cancel-api-overview>
- Return, Refund, Cancel overview: <https://partner.tiktokshop.com/docv2/page/650b2001bace3e02b76db38a>
- Finance API overview: <https://partner.tiktokshop.com/docv2/page/finance-api-overview>
- Webhooks overview: <https://partner.tiktokshop.com/docv2/page/tts-webhooks-overview>
- Webhook configuration: <https://partner.tiktokshop.com/docv2/page/650512b42f024f02be19755f>
- Order status change webhook (type 1): <https://partner.tiktokshop.com/docv2/page/1-order-status-change>
- Rate Limit Policy: <https://partner.tiktokshop.com/docv2/page/rate-limits>
- Common error codes: <https://partner.tiktokshop.com/docv2/page/678e3a45786253031531b942>

Community / cross-references (used where portal content was JS-blocked):

- EcomPHP SDK (202309, active): <https://github.com/EcomPHP/tiktokshop-php>
- ipfans Go SDK: <https://github.com/ipfans/tiktok>
- TikTok Shop Open Postman collection: <https://www.postman.com/tiktok-shop-open>
- TikTok Developers webhooks (adjacent API surface, overlapping concepts): <https://developers.tiktok.com/doc/webhooks-overview>

---

**Maintainer notes.** When TikTok approval lands:
1. Re-verify every endpoint path and status enum against the live portal — they bump versions without loud deprecation.
2. Test signing against a real shop before shipping. The 35xxx family of errors is opaque; instrument the canonical string.
3. Fix the 3 known bugs in `app/lib/tiktok-shop/client.ts` (§13.1, §13.2, §13.3) before first live call.
4. Set up webhook URL in portal → one for US app, one for Global app.
5. Backfill this doc with any 202407/202508 delta surfaced during integration.
