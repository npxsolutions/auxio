# Positioning Canvas

> Framework: April Dunford's *Obviously Awesome*. This doc is the source of truth for how Meridia is described in every piece of marketing copy. If you are tempted to invent a new phrase on a landing page, check this doc first.

---

## 1. Competitive alternatives

What customers compare us to when they are shopping. Not hypothetical — the set they actually have tabs open for.

| Alternative | Why they fail |
|---|---|
| **Linnworks** | Enterprise pricing, 6–12 week implementation, UI frozen around 2016. Rep-gated. Doesn't do real P&L. Lock-in via proprietary data model. |
| **Brightpearl (Sage)** | Positioned as a Retail OS but is really an ERP with a channel bolt-on. Implementation runs 90+ days. Starts at ~$7,500/mo. Entirely wrong shape for operators under $5M/yr. |
| **ChannelAdvisor / Rithum** | Enterprise-only, % of revenue pricing, requires a managed-services contract. Excellent feed engine, almost nothing below it. |
| **Feedonomics** | Feed management only. Doesn't touch inventory, orders, or P&L. Needs five other tools stacked around it. |
| **Baselinker** | Strong in EU, weak in US/UK. Interface translated rather than designed. No real forecasting or profitability layer. |
| **Spreadsheets + Zapier** | The true incumbent for Tier 1 and half of Tier 2. Free and infinitely flexible, but breaks at 3+ channels and doesn't survive a single oversell. |
| **Shopify + native channels** | Works for single-region DTC. Falls apart the moment Amazon and eBay are both in the mix. |

---

## 2. Unique attributes

Five things we have that the alternatives do not.

1. **Full-loop data model.** Supplier → PO → stock → listing → order → fulfillment → fees → P&L, in one schema. Nobody else closes this loop under $3k/mo.
2. **Multi-currency settled P&L.** We normalize against settlement currency, not invoice currency — so a GBP business selling on amazon.com sees true USD margin after FX, not an accounting fiction.
3. **10-minute time-to-first-value.** Self-serve OAuth into Shopify + one marketplace, first real number on screen inside ten minutes. Linnworks and Brightpearl take weeks.
4. **Order-volume pricing.** Flat, predictable, does not scale with GMV. ChannelAdvisor and Rithum charge a percentage of revenue — we do not, and we say so on the pricing page.
5. **Developer API as a first-class surface.** Full REST + webhooks + a typed SDK, documented publicly at `/developers`. The incumbents treat APIs as a premium SKU; we treat them as the table stakes.

---

## 3. Value (the value, not the attributes)

What the attributes actually produce for the customer.

- **Fewer oversells and stranded stock.** One operator's quarterly oversell rate drops from ~1.8% to under 0.2%. At a $500k/mo business that recovers ~$15k/quarter of margin that would otherwise have become refund and reship cost.
- **Real margin clarity.** "We thought SKU A was our hero; Meridia showed us SKU C had 3x the net margin after Amazon fees and inbound freight." Operators reallocate ad spend within the first month.
- **Ops hours reclaimed.** Growing Operator tier reports 8–12 hours/week of spreadsheet work eliminated. That is a fractional hire's worth of time, redeployed to merchandising or sourcing.
- **Boardroom-ready P&L.** CFO and founder look at the same number. The multi-currency question stops being a monthly argument.
- **Platform, not a trap.** Because the API is real and data is exportable, nobody has to fear switching — which paradoxically is why they stay.

---

## 4. Best-fit customer

The Growing Operator (Tier 2 in `icp.md`): $50k–$500k/mo GMV, 3–6 channels, 1–5 person team, either on spreadsheets or actively trying to leave Linnworks. This is the shape of customer our product is tuned to win, expand, and retain.

---

## 5. Market category

**Commerce Operations Platform.**

We are deliberately claiming this as a category name, not a product name. The category is defined in `/blog/what-is-a-commerce-operations-platform`. Every external asset uses this phrase verbatim. Avoid: "multichannel tool", "listing platform", "inventory SaaS", "ERP". Those are either too small (tool) or too large (ERP) and invite the wrong comparisons.

The secondary, more colloquial version — used on the homepage and in launch copy — is **"The operating system for modern commerce."** Same category, warmer vocabulary.

---

## 6. Trends we leverage

- **Multi-marketplace as default.** The Shopify-only seller is now the exception, not the rule. Amazon + eBay + TikTok Shop + Shopify is the baseline stack for anyone doing real volume.
- **AI in operations.** Every operator has tried ChatGPT on their ops data and found it hallucinates. We are shipping grounded AI — answers derived from their own schema, not an LLM guess.
- **Multi-currency normalization.** Cross-border ecommerce crossed 30% of global GMV in 2025 (est.). Single-currency dashboards are now actively misleading for most sellers over $500k/yr.
- **Agency-led commerce.** Growth agencies and fractional ops firms are now the primary channel advisors for Tier 2 operators. Our partner program is designed for them, not for resellers.
- **Unbundling of Shopify admin.** As Shopify adds surface area, operators are looking for the layer *above* Shopify to make sense of it alongside everything else. That is the slot we fill.

---

## 7. Elevator pitch — three lengths

### 6 words
> The operating system for modern commerce.

### 30 words
> Meridia is the Commerce Operations Platform for multichannel sellers. Inventory, orders, forecasting and true multi-currency P&L across every marketplace — in one place, live in ten minutes, priced on order volume not revenue.

### 90 seconds
> Most ecommerce operators today are running five channels on three spreadsheets and a prayer. They sell on Shopify, Amazon, eBay, maybe TikTok Shop and Etsy. Inventory drifts out of sync, so they oversell. Fees eat 30% of revenue but nobody sees the true per-order margin until the accountant files quarterly. And if they're selling across currencies, the dashboard is lying to them by the time the Stripe payout lands.
>
> The incumbents — Linnworks, Brightpearl, ChannelAdvisor — either cost $5k+ a month with a 90-day implementation, or they're bolted-together listing tools that don't close the loop to P&L.
>
> Meridia is the Commerce Operations Platform for this shape of business. You connect your channels in minutes, and inside the same product you get live inventory sync, order orchestration, demand forecasting, multi-currency settled P&L, and a real developer API. Order-volume pricing — never a percentage of revenue. From $59/month, live today.
>
> We're building this because commerce has gotten much more complex in the last five years, and the tools for running it haven't. That's the opening.
