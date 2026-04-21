import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Running 5+ Marketplaces on One Ledger (2026 Operator Playbook)',
  description: 'How the best multichannel operators are consolidating Shopify, Amazon, eBay, Etsy and TikTok Shop onto a single source of truth — and why the spreadsheet stack finally breaks at five channels.',
  keywords: ['multi marketplace inventory management', 'one ledger ecommerce', 'multichannel operations platform', 'unified commerce ledger', 'multi marketplace accounting'],
}

export default function BlogPostPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fff', color: '#0f172a' }}>

      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '0 48px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', textDecoration: 'none' }}>Palvento</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/blog" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', padding: '7px 14px' }}>← All guides</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: '7px', background: '#e8863f', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Start free →</Link>
        </div>
      </nav>

      <article style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 48px 96px' }}>
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#e8863f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Playbook · 2026</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: '12px', marginBottom: '20px' }}>
            Running 5+ marketplaces on one ledger
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7 }}>
            Somewhere between the third and fifth channel, every multichannel operator hits the same wall: the spreadsheet stack stops working, the tool stack isn&apos;t a stack, and nobody in the business can give a single honest answer to &quot;how much did we actually make last week?&quot;. Here&apos;s how the best operators of 2026 are solving it.
          </p>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#94a3b8', marginTop: '16px' }}>
            <span>April 2026</span><span>·</span><span>10 min read</span>
          </div>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>The moment the stack breaks</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            The first two channels are fine. A Shopify store and an Amazon Seller Central account fit neatly in one operator&apos;s head. You know your top SKUs. You know which fees hit which payouts. Your accountant uses A2X, reconciles to Xero, and everyone sleeps at night.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            The third channel — usually eBay or Etsy — gets bolted on with a spreadsheet. The fourth, often TikTok Shop or Faire, introduces the first real oversell. And the fifth is the one that does it: you wake up on a Sunday morning to a notification that you&apos;ve sold eleven of an item you have seven of, across three marketplaces, at three different prices, with three different fulfillment commitments. That is the exact moment the stack is no longer a stack. It is a pile.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            We&apos;ve talked to roughly three hundred operators in the last six months who are either here now or were here eighteen months ago. The ones who got through it all did the same thing: they stopped trying to connect five tools and started running one ledger.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>What &quot;one ledger&quot; actually means</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            A ledger, in the accountant&apos;s sense, is a single book of record where every transaction lives in a consistent shape. In multichannel commerce, running one ledger means that every inventory movement, every order, every fee, every fulfillment event, across every channel, lands in one schema with one primary key per SKU and one customer-facing entity per order. It is dull to describe and transformational in practice.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            The test is simple: if you ask your ops person &quot;how many units of SKU A-1023 did we sell across all channels last Tuesday, at what average net margin after fees&quot;, can they answer in under a minute without opening a spreadsheet? If yes, you have one ledger. If they need to pull three CSVs and a calculator, you do not.
          </p>
        </div>

        <div style={{ margin: '40px auto 44px', display: 'flex', justifyContent: 'center' }}>
          <svg width="620" height="260" viewBox="0 0 620 260" style={{ maxWidth: '100%', height: 'auto' }} aria-label="Diagram: five channels flowing into one ledger, which flows out to P&L, forecasting and purchase orders">
            <g fill="none" stroke="#0f172a" strokeWidth="1.5">
              {['Shopify', 'Amazon', 'eBay', 'TikTok Shop', 'Etsy'].map((label, i) => {
                const y = 20 + i * 44
                return (
                  <g key={label}>
                    <rect x="20" y={y} width="140" height="32" rx="4" />
                    <text x="90" y={y + 21} textAnchor="middle" fontSize="13" fontFamily="Inter, system-ui" fill="#0f172a" stroke="none">{label}</text>
                    <path d={`M 160 ${y + 16} L 250 130`} stroke="#e8863f" />
                  </g>
                )
              })}
              <rect x="250" y="104" width="120" height="52" rx="4" stroke="#e8863f" strokeWidth="1.5" />
              <text x="310" y="128" textAnchor="middle" fontSize="13" fontFamily="Inter, system-ui" fill="#e8863f" stroke="none" fontWeight="600">One ledger</text>
              <text x="310" y="146" textAnchor="middle" fontSize="11" fontFamily="Inter, system-ui" fill="#e8863f" stroke="none">single schema</text>

              {['True net P&L', 'Demand forecast', 'Auto purchase orders'].map((label, i) => {
                const y = 44 + i * 60
                return (
                  <g key={label}>
                    <path d={`M 370 130 L 460 ${y + 16}`} stroke="#0f172a" />
                    <rect x="460" y={y} width="140" height="32" rx="4" />
                    <text x="530" y={y + 21} textAnchor="middle" fontSize="13" fontFamily="Inter, system-ui" fill="#0f172a" stroke="none">{label}</text>
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>The three things that have to be true</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            A single ledger is not a single spreadsheet, and it is not a pile of CSV exports into a data warehouse. For an operator running five marketplaces, the ledger needs three things to be true, continuously, without human intervention:
          </p>
          <ol style={{ paddingLeft: '24px', margin: '0 0 14px' }}>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '8px' }}><strong>Canonical SKUs.</strong> Every channel listing points back to one internal SKU, and every order enriches that SKU&apos;s transaction history. The ASIN, the eBay item ID, the TikTok Shop product ID are all aliases, not primary keys.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '8px' }}><strong>Net, not gross.</strong> Every order in the ledger carries the real fee structure — marketplace commission, payment processing, FBA or fulfilment cost, ad attribution — resolved to the payout currency. Gross revenue is useful as a headline, useless as a decision.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '8px' }}><strong>Event time, not batch time.</strong> Inventory moves in seconds. Oversells happen in seconds. A ledger that reconciles once a night is a good accounting tool and a bad operations tool. You need the ledger to reflect reality within a minute of it changing.</li>
          </ol>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            When operators sit down and list out every tool they&apos;re using, very few of them hit all three. A2X into Xero is net-accurate but batch-time. Linnworks is event-time but not net-accurate. A custom spreadsheet is whatever you built it to be, which usually means close enough to fool you.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>What operators are actually doing in 2026</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            The operators who have made this shift tend to cluster into three patterns. The pattern you pick says more about your team than your tech stack.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            <strong>The engineering-heavy pattern.</strong> Build it yourself, on top of Shopify as the source of truth, with ingestion scripts from every other marketplace. This works if you have a full-time engineer and it falls apart the moment they leave. We&apos;ve seen two operators do this well and six do it badly. The telltale sign it&apos;s going badly: a Google Doc titled &quot;ingestion runbook&quot; that nobody has opened in four months.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            <strong>The ERP pattern.</strong> Implement NetSuite or Brightpearl, run it for ninety days, realise the channel integrations are weak, hire a consultancy to patch them, and end up paying $6k/mo for a system that still requires a weekly spreadsheet to answer the hero-SKU question. This is the dominant pattern for sellers over $5M/yr because it&apos;s the default advice from accounting firms. It works, slowly, expensively.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            <strong>The Commerce Operations Platform pattern.</strong> Pick a platform whose entire purpose is to be the ledger — not a channel manager, not an ERP, not an accounting tool. The category is new enough that most operators don&apos;t know it exists yet. It&apos;s the subject of our <Link href="/blog/what-is-a-commerce-operations-platform" style={{ color: '#e8863f' }}>category explainer</Link>. The short version: it replaces the middle three tools in the stack and leaves Shopify and your accounting package untouched.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>The decisions that get easier once the ledger is one</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            It is worth being specific about what changes. Running five marketplaces on one ledger doesn&apos;t just make your spreadsheets shorter — it moves five specific decisions from hard to trivial.
          </p>
          <ul style={{ paddingLeft: '24px', margin: '0 0 14px' }}>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}><strong>What to reorder.</strong> Sales velocity aggregated across channels, with lead time per supplier, produces a reorder point that is actually right. Not a guess. Not a feeling.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}><strong>What to delist.</strong> SKUs that look profitable on Amazon because you&apos;re not counting returns, PPC spend, and long-term storage fees against them stop looking profitable the moment those costs are in the same row as the revenue.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}><strong>Where to push.</strong> Same SKU, five channels, different margin profiles. The ledger tells you where to put the repricer floor and where to lean in on ads.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}><strong>What to tell the bank.</strong> Growth-stage financing requires a P&L you can defend. A ledger that is net, canonical, and event-time is a P&L you can defend.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}><strong>When to stop.</strong> The honest one. A channel that looks marginal on the spreadsheet might be losing money on the ledger. Closing a channel is a decision you can only make when you trust the numbers.</li>
          </ul>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>A worked example</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Consider an operator doing $280k/mo across Shopify, Amazon US, Amazon UK, eBay, and Etsy. On the spreadsheet they see gross revenue of $280k and a blended &quot;margin&quot; of 34%, which they report to themselves as $95k/mo contribution. They feel fine.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            On a one-ledger view with the fees properly attributed, the same month resolves to Amazon US contributing $42k on $120k gross, Amazon UK contributing $11k on $56k gross because FBA UK inbound logistics ate the margin on two SKUs, eBay contributing $8k on $38k, Etsy contributing $4k on $26k, and Shopify contributing $28k on $40k. True blended contribution: $93k. Close to the spreadsheet.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            But the interesting number is not the total — it&apos;s that Amazon UK on two specific SKUs is running at 7% contribution, while the same SKUs on Amazon US run at 31%. Without the ledger, you see Amazon UK as a healthy $56k/mo channel. With the ledger, you see the product mix decision that would add $6k/mo to contribution in 90 days. That is the kind of decision that pays for the platform in its first week.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>How to start (this week, not this quarter)</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            The trap here is to treat this as a six-month project. Six-month projects don&apos;t finish. The alternative is the one-week test: connect two channels to a platform that can run the ledger, import three months of historical orders, and answer one question that was previously hard — say, &quot;which SKU on which channel has the highest net contribution per unit?&quot;. If the answer surprises you, you have a real problem worth solving. If it confirms what you already suspected, you still have a dashboard worth keeping.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            We built Palvento specifically around this motion — ten minutes to first real number, one ledger from day one, no implementation consultants. But the pattern matters more than the product. If you take one thing from this piece: stop trying to get five tools to agree with each other, and start running five channels on one book of record. The math of your business will change the week you do.
          </p>
        </div>

        <div style={{ background: '#ede9fe', borderRadius: '10px', padding: '24px', marginTop: '40px', marginBottom: '48px' }}>
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>Run your 5+ marketplaces on one ledger with Palvento</strong>
          <p style={{ fontSize: '14px', color: '#4c1d95', margin: '0 0 16px', lineHeight: 1.6 }}>Inventory, orders, forecasting, procurement, and true multi-currency P&amp;L in one place. Connect in ten minutes. From $149/mo, order-volume pricing, never a percentage of revenue.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '7px', background: '#e8863f', color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Start free trial →</Link>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px' }}>Related guides</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/blog/what-is-a-commerce-operations-platform" style={{ fontSize: '14px', color: '#e8863f', textDecoration: 'none' }}>What is a Commerce Operations Platform? →</Link>
            <Link href="/blog/the-true-cost-of-multichannel-spreadsheets" style={{ fontSize: '14px', color: '#e8863f', textDecoration: 'none' }}>The true cost of multichannel spreadsheets →</Link>
            <Link href="/blog/multi-currency-pnl-explained" style={{ fontSize: '14px', color: '#e8863f', textDecoration: 'none' }}>Multi-currency P&amp;L — why your dashboard is lying to you →</Link>
          </div>
        </div>
      </article>
    </div>
  )
}
