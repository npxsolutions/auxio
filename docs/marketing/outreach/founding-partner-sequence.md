# Founding-partner follow-up email sequence

> Three emails. Sent from founder inbox (`nick@palvento.com`). Plain text, no HTML templates, no banner images. Merge fields in `{{double_braces}}` — `{{firstName}}`, `{{business}}`, `{{calendly_link}}`.
> **Trigger:** form submission at `/founding-partners` (Play 4.2 — 7 fields including GMV band, channel count, current tool, "worst thing about your current setup", timeline, email, business + store URL).
> **Tone:** first person. Short paragraphs. No marketing-voice. Specific numbers. No emoji.
> **Stop conditions:** reply (any content), calendar booking, unsubscribe link click.

---

## Email 1 — Immediate (≤10 min post-submission)

**Subject:** `Re: your founding-partner application — Palvento`

**Body:**

```
{{firstName}} —

Saw your application come through. Thanks for taking the time.

A few things to clarify so we can move fast if it's a fit:

1. I'm Nick, the founder. Every founding-partner onboarding goes through me personally for the first 10 customers. This is not a throwaway sign-up.

2. Founding-partner pricing is $89/mo against the $149 retail tier — 40% off, locked for the life of your account. Monthly, cancel anytime, no contract.

3. What you get beyond pricing. A direct Slack channel with me for questions and edge cases. Three roadmap votes that guide what ships next. First access to every new channel connector (Amazon, TikTok Shop, Etsy land over the next 4–6 weeks). A name-checked quote in the case study if the outcome is worth writing about — you approve the copy before it ships.

4. What I need from you. A 20-minute call so I can understand {{business}}'s current setup: which tool you're on now, how many rejections the feed throws in a typical week, and the single worst thing about the setup today. Plus a willingness to give honest feedback — especially when something doesn't work.

Book a slot that works for you: {{calendly_link}}

Or if you'd rather skip the call and just try the product: palvento.com/signup?src=fp-email-1

Either way — reply if there's anything specific you want me to look at before we talk.

— Nick
Founder, Palvento
palvento.com
```

---

## Email 2 — Day 2 (only if no reply + no booking)

**Subject:** `One anonymous founding-partner case — before the call`

**Body:**

```
{{firstName}} —

Quick follow-up. The founding-partner email probably got buried — no concern.

While you decide, here's one anonymous case from an operator in the same band as {{business}}:

UK-based Shopify merchant, $280k/mo GMV, four channels — Shopify storefront plus Amazon UK + DE, eBay, and a new TikTok Shop listing that kept getting suppressed. Was running the marketplace leg through a managed feed tool quoted at $1,800/mo with a 30-day onboarding already behind them.

We onboarded them in 14 minutes from signup. The first week caught 62 SKU rejections across Amazon and TikTok Shop that the previous tool was missing — most were GTIN format issues and one banned-word violation in a Beauty SKU that would have suppressed the listing for the full Q2 campaign.

Annualised fee saving against the prior tool: $17,400. Annualised recovered revenue on the rescued SKUs (their number, not mine): £4,200.

If {{business}}'s shape is roughly similar — Shopify-led, 3–5 channels, somewhere between "the free first-party connector is not enough" and "the enterprise feed engines quoted me $2k+" — the case is worth 20 minutes.

Book here: {{calendly_link}}

Or reply with the two questions you want answered before we talk, and I'll answer them inline.

— Nick
Palvento
```

---

## Email 3 — Day 7 (breakup email)

**Subject:** `Closing the loop on your Palvento application`

**Body:**

```
{{firstName}} —

I won't chase more than this. Two things before I close the loop on {{business}}'s application:

1. If the timing isn't right, that's completely fine. Reply "not now" and I'll archive the file. No nurture emails, no quarterly check-ins from marketing automation you didn't ask for.

2. If you're still evaluating but buried — no pressure. Reply with the single question blocking your next step and I'll answer it in one line. Pricing, integration scope, founding-partner terms, what's actually shipped vs. roadmap — whatever it is.

Founding-partner slots are 10 total, taken in order of real conversations. I'll reopen applications if we hit 10 without yours — but the lifetime pricing and the direct Slack channel are the two things only the founding 10 get.

palvento.com if you ever want to install direct without a call.

— Nick
```

---

## PostHog events to track per email

- `fp_email_sent` (with `touch` property: 1 | 2 | 3)
- `fp_email_opened`
- `fp_email_link_clicked` (with `link` property: calendly | signup | unsubscribe)
- `fp_calendar_booked` — terminates sequence
- `fp_email_replied` — terminates sequence

## Benchmarks (expected)

- Email 1 open rate: 60%+ (founder sender + specific subject).
- Email 1 → calendar booking: 25–35% (warm applicants).
- Email 2 additional booking: +10–15%.
- Email 3 reply rate ("not now" or real question): 8–12%.

If Email 1 open rate <45% after 20 sends, the subject line is wrong — rewrite before continuing.
If Email 1 booking rate <15%, the form itself is unqualified — tighten Play 4.2.
