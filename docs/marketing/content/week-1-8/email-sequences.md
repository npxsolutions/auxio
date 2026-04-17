# Email sequences

Three sequences: onboarding drip (5 emails), win-back (3 emails), feature announcement template. All plain-text. Founder voice. No emoji. No "Hey [Name]!" opener — use "Hi [Name]," or just start.

Sending tool: Loops or Resend. Trigger-based, not batch.

---

## Sequence 1 — Onboarding drip (5 emails)

Triggers on: trial signup. Goal: first feed live, first error resolved, first P&L viewed. The sequence stops if the user completes the activation milestone for that email.

---

### Email 1 — Immediately after signup

**Subject:** Your Palvento account is live
**Preview:** Connect your first channel in under ten minutes

Hi {{firstName}},

Your Palvento account is active. Here is the one thing that matters in the next ten minutes: connect your first channel.

Go to Settings > Channels > Add Channel, pick Shopify or whichever marketplace you want to sync first, and authorise via OAuth. The feed sync starts immediately.

If you get stuck on anything — category mapping, GTIN validation, image requirements — reply to this email. I read every one.

— Nick
Palvento · palvento-lkqv.vercel.app

**Exit condition:** User connects first channel.

---

### Email 2 — 24 hours after signup (if no channel connected)

**Subject:** One step left
**Preview:** Most merchants connect their first channel in under 5 minutes

Hi {{firstName}},

You signed up yesterday but haven't connected a channel yet. Totally fine — here are the three most common reasons and fixes:

1. **Not sure which channel to start with.** Start with whichever marketplace has the most SKU overlap with your Shopify store. For most merchants, that's Amazon or eBay.

2. **OAuth authorization failed.** This usually means the marketplace account doesn't have API access enabled. Here's how to enable it for [Amazon](link) / [eBay](link) / [TikTok Shop](link).

3. **Want to test with a subset first.** You can filter which products sync by collection, tag, or SKU range in Settings > Sync Rules.

If none of these apply, reply and tell me what's blocking you. I'll fix it or point you to the right doc.

— Nick

**Exit condition:** User connects first channel.

---

### Email 3 — 48 hours after first channel connected

**Subject:** Your first feed is live — here's what to check
**Preview:** Three things to review in the error hub

Hi {{firstName}},

Your first feed has been syncing for about 48 hours. Three things to check now:

1. **Error hub** (Dashboard > Errors). Any feed rejections — missing GTINs, title-length violations, category mismatches — show up here before they hit the marketplace. If the count is zero, your feed is clean. If it's not, each error has a one-click remediation.

2. **Inventory sync status** (Dashboard > Inventory). Confirm that stock levels match across Shopify and your connected channel. The sync runs sub-minute — if something looks off, check Settings > Sync Rules for any filters.

3. **Listing preview** (click any SKU > Listings tab). See exactly what each marketplace will receive — title, description, images, item specifics. Edit inline if needed.

Once you're comfortable with the feed quality, the next milestone is seeing your first per-channel P&L. That populates automatically once the first orders land and the payout reconciles.

— Nick

**Exit condition:** User views error hub.

---

### Email 4 — 5 days after signup

**Subject:** Which channel is actually profitable?
**Preview:** Per-channel P&L is live for your account

Hi {{firstName}},

If you've had orders come through since connecting, your per-channel P&L is now populating in Dashboard > Profit.

This is the view that answers the question most multichannel sellers can't: "which marketplace is actually profitable after fees, shipping, returns, and FX?"

A few things to know:

- **Margin is computed after marketplace fees, shipping, returns, and VAT/sales tax.** What you see is what you keep.
- **FX spread is explicit.** If you sell in GBP and report in USD, the exchange rate and spread are shown per transaction — not buried in a blended number.
- **You can filter by SKU, channel, or date range.** The most useful view for most operators is per-SKU, per-channel, last 30 days.

If the numbers surprise you — they usually do on the first look — reply and I'll walk through it.

— Nick

**Exit condition:** User views P&L dashboard.

---

### Email 5 — 10 days after signup (3 days before trial ends)

**Subject:** Your trial ends in 3 days
**Preview:** What you've set up so far — and what happens next

Hi {{firstName}},

Your 14-day trial ends on {{trialEndDate}}. Here is what you've set up:

- **Channels connected:** {{channelCount}}
- **SKUs syncing:** {{skuCount}}
- **Feed errors caught:** {{errorCount}}
- **Orders processed:** {{orderCount}}

If this is working for you, upgrading takes 30 seconds: Dashboard > Billing > Pick a plan. Starter is $149/mo for one channel, Growth is $349/mo for up to five, Scale is $799/mo for unlimited. All plans include the feed rules engine, error hub, and per-channel P&L.

If it's not working — or if something is missing — reply and tell me. I'd rather fix the product than lose you.

No hard sell. The trial data persists for 30 days after expiry so you don't lose anything by waiting.

— Nick

**Exit condition:** User upgrades or trial expires.

---

## Sequence 2 — Win-back (3 emails)

Triggers on: trial expired without conversion, or paid subscription cancelled. Goal: re-engage with a specific value hook. Spacing: Day 3, Day 10, Day 30 after churn.

---

### Email 1 — 3 days after churn

**Subject:** What was missing?
**Preview:** Honest question — one line is enough

Hi {{firstName}},

Your Palvento account expired {{daysAgo}} days ago. I have one question and I'll keep it short:

What was the single biggest reason it didn't work for you?

- Channel you needed wasn't supported
- Setup took too long
- Feed quality wasn't good enough
- Pricing didn't fit
- Already using something else
- Just exploring, not ready

Reply with the number or a line. Every response shapes what we build next.

— Nick

---

### Email 2 — 10 days after churn

**Subject:** We shipped {{recentFeature}} since you left
**Preview:** Might fix the thing that was missing

Hi {{firstName}},

Since your account expired, we shipped:

- **{{recentFeature1}}** — {{oneLineDescription1}}
- **{{recentFeature2}}** — {{oneLineDescription2}}

If one of these touches the reason you left, your account is still there. Log in at palvento-lkqv.vercel.app and your previous channel connections, sync rules, and feed configurations are intact. We'll extend your trial by 7 days — no form, it's automatic on login.

If it's still not the right time, no follow-up after this unless you ask.

— Nick

---

### Email 3 — 30 days after churn

**Subject:** Last one from me
**Preview:** Door is open whenever the timing is right

Hi {{firstName}},

This is the last email in this sequence. Three things in case the timing changes:

1. **Your data is still there.** We retain account data for 90 days post-expiry. After that, it's deleted per our privacy policy.

2. **Pricing may have changed.** We update pricing quarterly based on what we've learned. Current plans: Starter $149/mo, Growth $349/mo, Scale $799/mo. Check palvento-lkqv.vercel.app/pricing.

3. **If you went with a competitor and it's not working**, I'm happy to do a side-by-side. No pitch — just an honest comparison against your actual data.

Reply any time. I read every email.

— Nick

---

## Sequence 3 — Feature announcement template

Use for major feature releases (new channel, new capability, pricing change). Not for minor fixes or UI tweaks. Maximum frequency: twice per month.

---

**Subject:** New: {{featureName}} is live in Palvento
**Preview:** {{oneLineBenefit}}

Hi {{firstName}},

We shipped {{featureName}} today. Here is what it does, why it matters for your setup, and how to use it.

**What it does**
{{2-3 sentences explaining the feature. Specific. No marketing fluff. What the user can now do that they couldn't before.}}

**Why it matters for {{channelOrUseCase}}**
{{1-2 sentences connecting the feature to the user's actual workflow. Reference their connected channels or order volume if available.}}

**How to use it**
{{Step-by-step, 3-5 steps maximum. Link to the relevant dashboard screen.}}

**What's next**
{{1 sentence on what's shipping next, to signal momentum.}}

If you have questions or feedback on {{featureName}}, reply to this email. We're iterating on it this week.

— Nick
Palvento · palvento-lkqv.vercel.app
