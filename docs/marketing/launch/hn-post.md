# Hacker News — Show HN Post

Post Tuesday 6am PT (~6 hours after PH launch so the two traffic sources don&apos;t clash).

---

## Title (under 80 chars)
> **Show HN: Fulcra – Commerce Operations Platform for multichannel sellers**
> *(71 chars)*

## Body (under 1500 chars)

> Hi HN — I&apos;m Nick, and this is Fulcra.
>
> I built it because multichannel ecommerce operators are running businesses on a stack that doesn&apos;t exist: a channel manager that doesn&apos;t know their fees, an accounting tool that doesn&apos;t know their stock, and five spreadsheets holding the seam together. It breaks somewhere around the fifth channel, usually during a weekend sale, usually with an oversell.
>
> Fulcra is the layer that closes the loop. Inventory, orders, forecasting, procurement, and true multi-currency settled P&L across Shopify, Amazon, eBay, TikTok Shop, Etsy, and more — in one schema, with one canonical SKU. Order-volume pricing, never a percentage of revenue (the current enterprise incumbents all charge a % and we think that&apos;s wrong on principle).
>
> Tech: Next.js 16 on Vercel, Postgres via Supabase, Node worker jobs on Railway for the marketplace sync fan-out, PostHog for product analytics, Stripe for billing. The Developer API is REST + webhooks, typed SDK published to npm; everything you can see in the UI you can hit over API.
>
> Live demo: https://auxio-lkqv.vercel.app
>
> Honest feedback welcome. Three things I&apos;d love to hear on:
> 1. Is the Commerce Operations Platform category worth claiming, or is it unnecessary vocabulary?
> 2. Multi-currency settled P&L — is the design clear?
> 3. What would we need to break to make you switch off Linnworks / a spreadsheet / your Frankenstein?
>
> Happy to answer anything technical or commercial.
>
> *(1,476 chars)*

---

## Prepared answers — 5 most likely critical comments

### 1. "Isn't this just Linnworks / Brightpearl / ChannelAdvisor with a fresh coat of paint?"

> Fair question. Three concrete differences: (1) We close the loop to settled P&L, which none of the three do without a separate accounting integration and a batch lag. (2) Order-volume pricing, not a % of revenue — Linnworks and ChannelAdvisor both gate their real tiers behind sales conversations with % models. Ours is on the public pricing page. (3) Ten-minute self-serve onboarding, no implementation consultant. Brightpearl&apos;s typical implementation is 60–90 days. Mine is &quot;connect two OAuth apps and go&quot;.
>
> The broader answer is that the incumbents are excellent at the problem set of 2015. The problem set of 2026 is different — more channels, multi-currency, AI-assisted ops, API-first — and the product shape that fits it is different too.

### 2. "Multi-currency P&L is an accounting problem, not an ops problem. Isn't Xero + A2X enough?"

> A2X into Xero gives you an accurate <em>accounting</em> P&L, lagged by 7–14 days, in one currency. That&apos;s correct and valuable for your bookkeeper. It&apos;s insufficient for operational decisions — repricing, channel pruning, SKU rationalization — which happen on a weekly or daily cadence. Fulcra shows settled P&L at the SKU-channel grain, in both the marketplace currency and your reporting currency, with FX spread explicit. That&apos;s a different artifact with a different audience.

### 3. "Why should I trust a pre-PMF SaaS with my commerce data?"

> Honest answer: by starting small. Connect a test store, or a sandbox Amazon account, and watch it for two weeks. Everything is read-only until you explicitly enable write-backs. We publish data-retention and deletion endpoints at /developers. SOC 2 Type II is on the public roadmap at /trust — we&apos;re in the observation window now. And the whole point of the Developer API is that your data is exportable any time — we designed it to be easy to leave, because that&apos;s the only way we earn the right to have customers stay.

### 4. "Isn't order-volume pricing just a flat-fee rename? What about abuse?"

> It&apos;s a tiered flat fee indexed to order count, not revenue. So a high-AOV luxury brand and a low-AOV consumables brand pay similarly at similar volume, which reflects the actual cost of serving them (API calls, sync events, storage) rather than punishing the profitable ones. Abuse mitigation: if you exceed the tier by more than 20% two months running, we auto-upgrade; you never get surprise-billed. Overage on API calls above a generous ceiling is charged at cost. Pricing page is public.

### 5. "The landing page uses 'the operating system for modern commerce' — isn't that just category marketing fluff?"

> Yes and no. It&apos;s category marketing — deliberately. &quot;Commerce Operations Platform&quot; is the technical category, &quot;operating system for modern commerce&quot; is the colloquial framing. We&apos;re choosing to claim the category name rather than invent a made-up one, because the existing vocabulary (&quot;multichannel tool&quot;, &quot;listing platform&quot;) invites the wrong comparisons and makes customers underestimate what they&apos;re buying. April Dunford&apos;s *Obviously Awesome* is the playbook we&apos;re following. Whether the category claim sticks depends on whether we ship work that justifies it.
