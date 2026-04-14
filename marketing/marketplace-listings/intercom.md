# Intercom App Store — Meridia integration brief

**Status:** Concept; submission post-Shopify approval.
**Submission contact:** developers@auxio.io
**Internal owner:** Platform + Support team

## App name
Meridia for Intercom

## One-liner
Order, fulfilment, and refund context inside every Intercom conversation — across every marketplace your customers bought on.

## What it does
When a support agent opens an Intercom conversation, the Meridia sidebar surfaces:

- The customer&rsquo;s last 12 months of orders across every channel (Shopify, Amazon, eBay, Etsy, TikTok Shop, Walmart, OnBuy, BigCommerce, WooCommerce).
- Order status, fulfilment, tracking, and any open returns.
- Lifetime value and gross margin (so high-LTV customers get triaged faster).
- One-click actions: refund, resend tracking, escalate to ops.

## Where it appears
- **Inbox sidebar** — order context per conversation.
- **Messenger app** — self-serve order lookup for end customers.
- **Workflow action** — resolve conversations with structured outcomes (refund, replacement, lost-in-transit).

## Authentication
OAuth 2.0 via Intercom partner app. Meridia reads the Intercom user&rsquo;s email/external ID and matches against connected channels.

## Categories
- Primary: **Customer data**
- Secondary: **eCommerce · Reporting**

## Listing copy (≤500 chars)
Stop alt-tabbing during support tickets. Meridia for Intercom puts every order, refund, and shipment your customer ever placed — across every marketplace — directly in the conversation. Resolve faster, refund correctly, and escalate the right tickets to ops without leaving Intercom.

## Pricing
Included with all paid Meridia plans. No additional charge inside Intercom.

## Privacy
Data is fetched on demand per conversation. Meridia never writes customer data into Intercom; we only present read-only context.

## Submission notes
Sandbox app available on request. Demo workspace seeded with 2,000 representative orders.
