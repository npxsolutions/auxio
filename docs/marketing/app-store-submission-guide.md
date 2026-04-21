# Shopify App Store Submission — step-by-step click-through

*Everything you do in the browser, in the order you do it. All copy + assets are ready in the repo. Follow this top-to-bottom.*

---

## 0. Prerequisites (one-time — skip if done)

- [ ] Shopify Partners account active at `partners.shopify.com`
- [ ] Development store created (Partners → Stores → Add store → Development store). You'll need this for testing + Shopify's review team will install into a test store of their own
- [ ] Company profile filled (Partners → Account → Business settings). Shopify's review team looks at this

---

## 1. Match the app config in Partners to what's in `shopify.app.toml`

We updated `shopify.app.toml` on main (commit `<next>`). The Partners dashboard needs to match.

### Go to: Partners → Apps → your existing app (was "auxio_v2", now "palvento")

### App setup → Edit app details:

- **App name:** `Palvento: Multichannel Feeds` *(this is what shows in the App Store — 30 chars max)*
- **App URL:** `https://palvento.com`
- **Allowed redirection URL(s):**
  ```
  https://palvento.com/api/shopify/callback
  https://auxio-lkqv.vercel.app/api/shopify/callback
  ```
  *(keep both — the Vercel URL stays as a fallback)*
- **Embedded app:** toggle **On**

### App setup → Protected customer data access:

- **What customer data does the app access?** Tick: `name, email, phone, address, orders`
- **Why:** paste →
  > *Palvento syncs order records from Shopify to connected marketplaces and reconciles them against marketplace payouts. Customer name, email, and address are required to identify the buyer on the marketplace listing and for fulfilment. Orders are required for the per-channel P&L feature.*

### App setup → Webhooks → Mandatory compliance webhooks:

Paste these three URLs exactly:
- `customers/data_request` → `https://palvento.com/api/shopify/webhooks/customers-data-request`
- `customers/redact` → `https://palvento.com/api/shopify/webhooks/customers-redact`
- `shop/redact` → `https://palvento.com/api/shopify/webhooks/shop-redact`

*(Shopify rejects any submission missing these.)*

### App setup → GDPR compliance webhooks:

Same three URLs (Shopify shows them in two places — fill both).

---

## 2. Install on your own dev store to verify everything works

Before submitting, Shopify will ask: *"Have you tested the install flow end-to-end?"* You answer yes by having a demo install ready.

### From Partners → Apps → Palvento → Test on development store

1. Pick your dev store
2. Click **Install**
3. OAuth flow happens automatically
4. Land on the Palvento dashboard

### Verify:
- [ ] OAuth completes without errors
- [ ] You see the Palvento dashboard inside the Shopify admin iframe
- [ ] At least one channel connect (eBay) works end-to-end
- [ ] Uninstall the app from the dev store → verify the uninstall webhook triggers (check Supabase `channels` table — rows should be marked `active = false`)

*(If any of these break, submitting will waste your review window. Fix first.)*

---

## 3. Record the 90-second demo video

Scripted in `docs/marketing/app-store-listing.md` → "Video demo script" section. Nine shots, single take.

**Recording setup:**
- OBS Studio (free) or QuickTime (Mac)
- 1920×1080, 30fps, MP4 output
- Your dev store in the browser, full-screen
- Palvento admin in one tab, eBay Seller Hub in a second tab, Shopify admin in a third

**Before you hit record:**
- Pre-stage the dev store with 10 test products (use the sample-data import)
- Have eBay Seller account ready (sandbox or real, doesn't matter for demo)
- Close Slack, email, notifications
- Cursor movements slow — don't rush the shots

**File output:** save as `public/marketing/app-store-demo.mp4` so we have a canonical copy in the repo.

---

## 4. Go to App listing section

### Partners → Apps → Palvento → Distribution → **App Store listing**

This is the public-facing listing. Everything in the `docs/marketing/app-store-listing.md` file goes here.

### Step 4a — App icon

- Click **Upload app icon**
- Upload: `public/brand/palvento-app-icon-1200.png` (1200×1200 PNG, just generated)

### Step 4b — App name

- Field: **App name**
- Paste: `Palvento: Multichannel Feeds`
- Character count: 27/30

### Step 4c — App tagline

- Field: **Tagline**
- Paste: `Sync your Shopify catalogue to eBay, Amazon & Google Shopping — clean feeds, live in 10 minutes.`
- Character count: 96/100

### Step 4d — Introduction (above-fold paragraph)

- Field: **Introduction** (max 250 chars)
- Paste:
  ```
  Self-serve multichannel feed management for Shopify-led sellers. Catch GTIN, image and category errors before the marketplace rejects them. Per-channel P&L with line-item fee attribution. From $149/mo. Live in under 10 minutes.
  ```

### Step 4e — Full description

- Field: **Details**
- Paste the entire `FULL DESCRIPTION` section from `docs/marketing/app-store-listing.md` — starts with "Palvento keeps your Shopify catalogue clean across every marketplace you sell on." and ends with "Cancel any time."
- Keep the `━━━━━` dividers — they render as section breaks on the listing page

### Step 4f — Key benefits (3 bullets, 100 chars each)

Shopify surfaces these in search previews. Paste:
1. `Pre-flight feed validation — catch GTIN, image, category errors before marketplaces reject them.`
2. `Per-channel P&L — line-item fees reconciled into contribution margin per SKU per channel.`
3. `Self-serve from the App Store — install to first listing live in under ten minutes.`

### Step 4g — Demo video

- Upload: your `palvento-demo.mp4`
- Note: Shopify re-encodes. Check the preview after upload — if the first second gets clipped, re-upload with a 1-second blank lead-in

### Step 4h — Screenshots (5 × 1600×1200)

Upload in this order (the first is the hero — weighs heaviest in ranking + preview):

1. `public/marketing/app-store/screen-01-validator.png`
2. `public/marketing/app-store/screen-02-pnl.png`
3. `public/marketing/app-store/screen-03-category.png`
4. `public/marketing/app-store/screen-04-install.png`
5. `public/marketing/app-store/screen-05-pricing.png`

Caption each one. The captions below should go in the "screenshot caption" field if shown (some dashboards don't show that field — if not, skip):
- Screen 1: *"Pre-flight feed validation for Amazon, eBay, TikTok Shop, Etsy, Walmart and Google Shopping."*
- Screen 2: *"Per-channel P&L with line-item fee attribution — FBA, eBay insertion, TikTok commission."*
- Screen 3: *"AI narrows Amazon (30k+), eBay (18k+) and TikTok Shop (8k+) taxonomies to three picks."*
- Screen 4: *"Shopify App Store OAuth. Install → first listing live in under ten minutes."*
- Screen 5: *"Flat monthly. Five currencies. No percentage of GMV."*

### Step 4i — Categories

- **Primary:** Selling products → Marketplace management
- **Secondary:** Store management → Product listings

### Step 4j — Search tags (5 tags)

```
multichannel feed management
Shopify multichannel
Shopify Amazon eBay sync
marketplace feed optimisation
per-channel P&L
```

### Step 4k — Pricing plans

Add these four plans. Shopify's pricing-plan editor wants one per tier:

| Plan name | Price | Billing | Features |
|---|---|---|---|
| Starter | $149/mo | Recurring | 1 sales channel; up to 500 active listings; pre-flight validator; feed health hub; true profit dashboard; email support; 10 AI enrichments/mo |
| Growth | $349/mo | Recurring | 5 sales channels; unlimited listings; AI listing optimisation; feed rules engine; priority support; 200 AI enrichments/mo; 50 AI image analyses/mo |
| Scale | $799/mo | Recurring | Unlimited channels; priority sync; reconciled payouts; unlimited AI enrichment + image analysis |
| Enterprise | Custom from $2,000/mo | Recurring | SSO/SAML; dedicated solutions architect; custom SLA; data residency |

Enable the **14-day free trial** toggle on each.

### Step 4l — Support URL + contacts

- **Support email:** `support@palvento.com`
- **Support URL:** `https://palvento.com/help`
- **Privacy policy URL:** `https://palvento.com/privacy`

### Step 4m — Developer info

- **Website:** `https://palvento.com`
- **Company name:** `NPX Solutions Limited`
- **Country:** `United Kingdom`

---

## 5. Final checks before Submit for Review

- [ ] All 5 screenshots look sharp in the preview (Shopify will auto-crop if not 1600×1200 — verify)
- [ ] Demo video plays cleanly, no cut frames
- [ ] Free-trial toggle is on for all paid plans
- [ ] Privacy policy URL resolves (click it in the preview)
- [ ] Help URL resolves
- [ ] The introduction paragraph scans in 3 seconds — read it like a stranger
- [ ] You've installed + uninstalled the app on a dev store in the last 24 hours

---

## 6. Submit

Click **Submit for Review** at the bottom.

**Expected timeline:** 5–10 business days for first review. They send feedback via email — reply fast (within 24h) and the re-review cycle compresses to 2–3 days.

**Common rejection reasons** (and how this listing avoids them):
- Missing GDPR webhooks → *fixed in `shopify.app.toml` and Partners config above*
- Privacy policy doesn't mention marketplace data → *check `/privacy` — add one sentence about marketplace credential storage if missing*
- Pricing not clearly labelled → *we're flat-monthly + trial-enabled, which Shopify rewards*
- App name uses a trademark → *Palvento is clean*
- Demo video shows features not in the app → *shot list is tied to shipped features only*

---

## 7. After approval (Day 0 public)

From `docs/marketing/app-store-listing.md` → "90-day post-approval ranking sprint":

1. **Same day:** email every founding-partner applicant with the App Store link
2. **Day 14:** first review-request email to early installs
3. **Weekly for 90 days:** one listing update — screenshot rotation, copy tweak, changelog entry
4. **Every uninstall:** one-question email auto-sent

Target: top 3 for "multichannel feed management" by Day 60.

---

## Troubleshooting

**"App installation fails with scope error"** — the scopes in `shopify.app.toml` don't match what the Palvento code requests. Match `app/api/shopify/connect/route.ts` → `shopify.app.toml` [access_scopes] → Partners dashboard scopes.

**"Webhook verification fails"** — `app/api/shopify/webhooks/_verify.ts` uses `SHOPIFY_CLIENT_SECRET` for HMAC. Check the env var is set on Vercel prod (it is per `supabase/migrations` pattern).

**"Review team can't install on their test store"** — likely the test-store URL in your app config is stale. Partners → App setup → clear the test store field, add their address, try again.
