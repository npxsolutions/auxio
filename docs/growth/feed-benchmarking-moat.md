# Feed-benchmarking moat (Palvento)

Foundation doc for the multi-tenant feed-data aggregation layer that will back
cross-merchant benchmarks. This is an internal doc — nothing here ships to
users yet.

## What the tables capture

Two service-role-only tables in `public`:

- **`feed_health_rollups`** — weekly snapshots of aggregate feed quality
  (avg health score, avg errors/warnings, and the percentage of listings
  passing each major rule: images present, GTIN, brand, condition,
  category mapped, business policies) keyed on
  `(period_start, period_end, channel, category_bucket, gmv_band)`.
- **`feed_pattern_observations`** — daily observations of which
  pattern bins correlate with the best outcome inside a
  `(channel, category_bucket, pattern_kind)` triple. Pattern kinds shipped
  in v1: `title_length`, `image_count`. Deferred: `bullet_count`,
  `aspect_completeness`, `price_position`, `gtin_presence`, `brand_presence`.

Rollups are written by `/api/cron/feed-benchmarks` (weekly, Mon 05:00 UTC).
Pattern observations are written by `/api/cron/feed-patterns` (daily, 06:00
UTC). Both rely on `deriveCategoryBucket()` in
`app/lib/feed/category-buckets.ts` to collapse per-channel taxonomies into
~20 stable buckets.

## Privacy floor (k = 10)

Every persisted row is computed across at least **10 distinct contributing
user_ids**. Tuples with fewer contributors are silently dropped. This is a
k-anonymity guarantee: no row can ever be reversed into an individual
merchant's data, even by someone with full service-role access to the
rollups table.

Both tables are RLS-enabled with a `for all using (false) with check (false)`
policy — the only way to read them is via service role or through the
owner-allowlisted `/api/admin/feed-benchmarks` endpoint, which exists solely
for us to eyeball the data during the pre-launch phase.

## Roadmap to user exposure

We will **not** expose benchmarks to end users until we have reached the
following thresholds per category bucket we plan to surface:

1. **25+ merchants per (channel, category_bucket)** contributing over the
   trailing 4 weeks. Above 10 satisfies the math; above 25 satisfies the
   vibes — a single noisy merchant can't skew the mean.
2. **At least 4 weekly rollup rows** in a row (month of stability) before
   any bucket is surfaced.
3. A **second privacy pass** by a human (not an automated check) once we
   have real numbers to look at, to catch indirect re-identification risks
   (e.g. a bucket with k=12 but dominated by one outlier merchant).

Exposure will be opt-in per merchant (they contribute to + read from the
benchmark pool) — not default-on. This preserves trust and gives us a clean
legal posture for EU customers.

## Acceptable uses

- Showing a merchant **where they sit** inside a band (e.g. "your feed health
  is 74 vs. median 81 in apparel-womens at your GMV band").
- Showing **which pattern bin correlates with best publish success** in
  their bucket (e.g. "apparel-womens eBay listings with 60–79 char titles
  publish at 94% vs. 71% for 140+ char titles").
- Internal product decisions, prioritisation, launch messaging.

## Forbidden uses

- **Never** surface any individual merchant's data to any other merchant.
  Not anonymised, not delayed, not aggregated with fewer than k contributors.
- **Never** sell, expose, or API-ise competitive intel that could allow
  Merchant A to profile Merchant B. No "compare yourself vs. these specific
  stores".
- **Never** cross-join benchmarks with supplier/cost data in a way that
  reveals a competitor's margins.
- **Never** use benchmarks to price-discriminate against merchants
  (e.g. charging more for under-performers).

When in doubt: if a feature could make a single merchant identifiable, it's
forbidden. The k=10 floor is a floor, not a ceiling on caution.
