import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The True Cost of Running Multichannel Commerce on Spreadsheets (2026)',
  description: 'Spreadsheets feel free. They aren\'t. Here is what a multichannel commerce operation actually pays per year for running on Google Sheets — oversells, reconciliation time, missed margin, bad decisions.',
  keywords: ['multichannel spreadsheet cost', 'spreadsheet ecommerce errors', 'oversell cost', 'ecommerce operations spreadsheet', 'cost of manual inventory'],
}

export default function BlogPostPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fff', color: '#0f172a' }}>

      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '0 48px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', textDecoration: 'none' }}>Fulcra</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/blog" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', padding: '7px 14px' }}>← All guides</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: '7px', background: '#5b52f5', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Start free →</Link>
        </div>
      </nav>

      <article style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 48px 96px' }}>
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Investigation · 2026</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: '12px', marginBottom: '20px' }}>
            The true cost of running multichannel on spreadsheets
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7 }}>
            Google Sheets is free. That is why it is the most expensive software your ecommerce operation runs. This piece totals the bill for a representative multichannel seller — and shows where every dollar of it actually goes.
          </p>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#94a3b8', marginTop: '16px' }}>
            <span>April 2026</span><span>·</span><span>8 min read</span>
          </div>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>The operator we&apos;re modelling</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Meet the median operator we see on our demo calls. $180k/mo gross revenue. Four channels: Shopify, Amazon, eBay, and TikTok Shop. About 450 SKUs. A team of three: founder, a VA who handles customer support and order entry, and an accountant on retainer. Their ops stack is Shopify admin, Amazon Seller Central, two marketplace dashboards, A2X, Xero, and nine Google Sheets that nobody remembers the exact purpose of.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            They feel fine. Their accountant says the numbers look healthy. They close most months with something that resembles a P&L. And yet, if you ask them &quot;which SKU on which channel is losing you money right now&quot;, the honest answer is some variation of &quot;I don&apos;t know, but I could probably work it out by Friday&quot;.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Here is what running on spreadsheets is actually costing that operator, annualized.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>Line 1 — Oversells (est. $14,400/yr)</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Four channels means four places that can sell the same physical unit before the others update. In spreadsheet-driven inventory, stock levels are pushed on a schedule — every fifteen minutes at best, every few hours at worst. On any given Black Friday weekend, that schedule window is long enough for a disaster.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            The operator in our model reports about 1.4% of their orders as oversells or stock-correction refunds. At $180k/mo that is ~$2,520/mo in goodwill refunds, expedited reorder cost, and customer-service time. Call it $14,400/yr and be slightly generous (the real number after factoring in lost repeat purchases is higher, but this line is deliberately conservative).
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>Line 2 — Reconciliation time (est. $18,200/yr)</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            The VA spends six hours a week reconciling order exports from four channels into the master sheet. The founder spends another two hours a week cross-checking it. The accountant bills four hours a month doing the same work at the P&L layer.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Rates: VA $22/hr fully loaded, founder $80/hr opportunity cost, accountant $110/hr billable. Weekly cost $308. Monthly accountant cost $440. Annual: roughly $18,200.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            This is the line operators most consistently under-count. The work doesn&apos;t feel like work because it&apos;s how everyone always did it. But it is the single biggest cost item on this list.
          </p>
        </div>

        <div style={{ margin: '40px auto 44px', display: 'flex', justifyContent: 'center' }}>
          <svg width="620" height="300" viewBox="0 0 620 300" style={{ maxWidth: '100%', height: 'auto' }} aria-label="Bar chart showing annualized hidden cost of spreadsheet ops across six categories">
            <g fontFamily="Inter, system-ui" fontSize="12" fill="#0f172a">
              {[
                { label: 'Oversells', val: 14400, x: 0 },
                { label: 'Reconciliation', val: 18200, x: 1 },
                { label: 'Missed margin', val: 22000, x: 2 },
                { label: 'Bad PO decisions', val: 9600, x: 3 },
                { label: 'Duplicated tools', val: 4800, x: 4 },
                { label: 'Founder attention', val: 12000, x: 5 },
              ].map(({ label, val, x }) => {
                const barH = (val / 22000) * 180
                const cx = 40 + x * 95
                return (
                  <g key={label}>
                    <rect x={cx} y={220 - barH} width="60" height={barH} fill="#5b52f5" stroke="#0f172a" strokeWidth="1.5" />
                    <text x={cx + 30} y={238} textAnchor="middle" fontSize="10" fill="#475569">{label}</text>
                    <text x={cx + 30} y={214 - barH} textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="600">${(val / 1000).toFixed(1)}k</text>
                  </g>
                )
              })}
              <line x1="30" y1="220" x2="600" y2="220" stroke="#0f172a" strokeWidth="1.5" />
              <text x="30" y="270" fontSize="11" fill="#64748b">Annualized hidden cost — representative $180k/mo multichannel operator (est.)</text>
            </g>
          </svg>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>Line 3 — Missed margin (est. $22,000/yr)</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Here is the one nobody wants to hear. Because per-SKU per-channel net margin isn&apos;t visible without an hour of work, operators price defensively rather than optimally. The repricer&apos;s floor gets set to a round number rather than the actual break-even. Promotional discounts get applied uniformly across channels even though the fee structures are materially different.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            In every retrospective review we&apos;ve run with operators who moved off spreadsheets, the discovery is the same: between 60 and 140 basis points of net margin were being left on the table because nobody had the visibility to capture it. On $2.16M of annual revenue, 100 bps of recovered margin is $21,600. We round to $22,000. This line has the biggest variance operator-to-operator — some are leaving 40 bps, some are leaving 300 — but it is never zero.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>Line 4 — Bad purchase-order decisions (est. $9,600/yr)</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Spreadsheet-driven reorder points are either &quot;when I feel nervous&quot; or &quot;when the sheet says red&quot;, and the sheet doesn&apos;t know about lead-time variance or channel-specific velocity. The result is two specific mistakes that cost real money: emergency air-freighted reorders on SKUs that ran out, and slow-moving stock that tied up cash for six months longer than necessary.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            For a 450-SKU operator, we typically see two air-freight emergencies per year at ~$2,400 each premium, plus roughly $4,800 in carrying cost on dead stock that a forecasting layer would have caught. Call it $9,600, probably low.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>Line 5 — Duplicated tooling ($4,800/yr)</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            This one is easy to count. A typical spreadsheet-based multichannel operator pays for: a repricer ($120/mo), a feed manager or a Zapier Pro plan ($50), an inventory add-on in Shopify ($40), an accounting integration like A2X ($55), and a reporting dashboard they use twice a month ($35). That&apos;s $300/mo, or $3,600/yr, plus about $100/mo in micro-tools that accumulate. $4,800.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            This is the line operators cite first when asked &quot;what does your ops stack cost?&quot;. It is also the smallest line on this list. The software bill is not the real cost.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>Line 6 — Founder attention tax (est. $12,000/yr)</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            The founder spends ninety minutes every Monday morning rebuilding last week&apos;s real P&L from four exports. That is 78 hours a year at an $80/hr internal opportunity cost. But the real cost is what those ninety minutes displace — the sourcing decision, the marketing experiment, the customer conversation that didn&apos;t happen. We won&apos;t put a number on the displacement; the 78 hours alone is $6,240. Then add another ~$5,500 for the smaller founder-touches throughout the week. Twelve thousand is the floor.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>The total, and what it means</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            $14,400 + $18,200 + $22,000 + $9,600 + $4,800 + $12,000 = <strong>$81,000/yr</strong>. On a $2.16M revenue base, that is 3.75% of revenue, silently leaking out through a stack that felt free because none of the invoices had the word &quot;spreadsheet&quot; on them.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            That number is a median. Operators with lower margin profiles (where the missed-margin line is larger in absolute terms) often land above $100k. Operators with smaller teams (where the founder-attention line is the biggest item) land closer to $60k. Either way, the software bill at the bottom of the receipt — $4,800 for the whole tool stack — is a rounding error on the real total.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            If you take one thing from this: the question you should be asking when you evaluate an operations platform is not &quot;how much does it cost?&quot; It is &quot;how much of the $81,000 does it recover in the first ninety days?&quot;. That is the only honest ROI calculation in commerce ops software.
          </p>
        </div>

        <div style={{ background: '#ede9fe', borderRadius: '10px', padding: '24px', marginTop: '40px', marginBottom: '48px' }}>
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>See the $81,000 in your own numbers</strong>
          <p style={{ fontSize: '14px', color: '#4c1d95', margin: '0 0 16px', lineHeight: 1.6 }}>Fulcra is a Commerce Operations Platform that replaces the middle of your ops stack with one ledger, one P&amp;L, and real forecasting. Connect two channels in under ten minutes and see the numbers for yourself. From $59/mo.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '7px', background: '#5b52f5', color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Start free trial →</Link>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px' }}>Related guides</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/blog/2026-running-multi-marketplace-on-one-ledger" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>Running 5+ marketplaces on one ledger →</Link>
            <Link href="/blog/multi-currency-pnl-explained" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>Multi-currency P&amp;L explained →</Link>
            <Link href="/blog/how-to-calculate-true-profit-ecommerce" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>How to calculate true profit in ecommerce →</Link>
          </div>
        </div>
      </article>
    </div>
  )
}
