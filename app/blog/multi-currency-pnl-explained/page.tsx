import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Multi-Currency P&L for Ecommerce — Why Your Dashboard Is Lying to You',
  description: 'If you sell cross-border and your dashboard shows revenue in one tidy currency, it is almost certainly wrong. Here is why invoice-rate P&L misleads operators, and what settled-currency P&L looks like instead.',
  keywords: ['multi currency ecommerce profit', 'multi currency P&L', 'ecommerce FX margin', 'settlement currency ecommerce', 'cross-border P&L'],
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
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Explainer · 2026</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: '12px', marginBottom: '20px' }}>
            Multi-currency P&amp;L for ecommerce — why your dashboard is lying to you
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7 }}>
            Every cross-border ecommerce operator has, at some point, stared at a dashboard showing a tidy monthly revenue number in their home currency and thought &quot;that can&apos;t be right&quot;. It isn&apos;t. Here is what&apos;s wrong, why nobody has fixed it, and what a settled-currency P&L actually looks like.
          </p>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#94a3b8', marginTop: '16px' }}>
            <span>April 2026</span><span>·</span><span>7 min read</span>
          </div>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>Two very different numbers</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            A GBP-based business sells a product on amazon.com for $40. At the moment the order is placed, the spot rate is 1.27, so the dashboard records £31.50 of revenue. That number is your <em>invoice-rate P&L</em>. It is the number most ecommerce dashboards — and most accounting tools — default to, because it is the simplest one to compute. It is also, in a real operational sense, fiction.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Fourteen days later, Amazon pays out the settlement. After FBA fees, referral fees, promotional credits, and Amazon&apos;s own currency conversion (at a rate that is always worse than spot), you receive £26.80. That number is your <em>settled P&L</em>. The difference — £4.70 on a single $40 order — is not noise. It is 15% of the invoice-rate revenue, and it is entirely missing from most dashboards.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Multiply that across 4,000 cross-border orders a month and you have roughly £18,800/month of P&L that exists in accounting but does not exist in operations. Most founders find out about the gap once a year when their accountant reconciles. By which point they have already run twelve months of pricing and marketing decisions on numbers that were quietly wrong.
          </p>
        </div>

        <div style={{ margin: '40px auto 44px', display: 'flex', justifyContent: 'center' }}>
          <svg width="620" height="260" viewBox="0 0 620 260" style={{ maxWidth: '100%', height: 'auto' }} aria-label="Diagram showing invoice-rate revenue flowing through fees and FX to produce settled revenue">
            <g fill="none" stroke="#0f172a" strokeWidth="1.5" fontFamily="Inter, system-ui">
              <rect x="20" y="30" width="140" height="60" rx="4" />
              <text x="90" y="58" textAnchor="middle" fontSize="13" stroke="none" fill="#0f172a" fontWeight="600">Invoice rate</text>
              <text x="90" y="76" textAnchor="middle" fontSize="12" stroke="none" fill="#475569">£31.50</text>

              {[
                { label: 'FBA fee', val: '−£2.40' },
                { label: 'Referral', val: '−£4.50' },
                { label: 'Promo credit', val: '−£1.10' },
                { label: 'FX spread', val: '−£1.40' },
              ].map(({ label, val }, i) => {
                const y = 20 + i * 50
                return (
                  <g key={label}>
                    <rect x="240" y={y} width="140" height="38" rx="4" stroke="#5b52f5" />
                    <text x="310" y={y + 18} textAnchor="middle" fontSize="12" stroke="none" fill="#5b52f5">{label}</text>
                    <text x="310" y={y + 31} textAnchor="middle" fontSize="11" stroke="none" fill="#475569">{val}</text>
                    <path d={`M 160 60 L 240 ${y + 19}`} stroke="#5b52f5" strokeWidth="1" />
                  </g>
                )
              })}

              <rect x="460" y="95" width="140" height="60" rx="4" stroke="#0f172a" strokeWidth="2" />
              <text x="530" y="122" textAnchor="middle" fontSize="13" stroke="none" fill="#0f172a" fontWeight="600">Settled</text>
              <text x="530" y="140" textAnchor="middle" fontSize="12" stroke="none" fill="#475569">£26.80</text>
              <path d="M 380 125 L 460 125" stroke="#0f172a" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>Why every dashboard gets this wrong</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            The reason is structural, not lazy. To compute a settled-currency P&L at operational speed, you need four things: the order record, the fee schedule, the settlement event, and the FX rate that applied at settlement. The first two are easy. The third lags by 7–14 days. The fourth is the killer — you can&apos;t compute it at order time because settlement hasn&apos;t happened yet.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            So every operational dashboard does one of two things. Option A: show invoice-rate revenue and quietly accept that it&apos;s 10–20% off. Option B: wait for settlement before attributing revenue, at which point your dashboard is always two weeks stale. Most platforms pick A without telling you. A few pick B and call it &quot;accrual accounting&quot; as if that excuses the staleness. The honest third option — which almost nobody offers — is to show both numbers, on the same line, with the variance explicit.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>What settled-currency P&L actually looks like</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            A real settled-currency P&L for a cross-border operator has four rows per channel: gross orders at invoice rate, fees and credits deducted in the marketplace currency, FX spread realised at settlement, and the net contribution in the home reporting currency. It looks noisier than a one-line revenue number. That is exactly the point. The noise is the information.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Once you have this view, certain decisions stop being guesses. Whether it&apos;s worth keeping a marketplace open in a weak-currency region. Whether a $2 price increase across amazon.com offsets the FX drag on a strengthening pound. Whether a supplier priced in EUR is actually cheaper than one priced in GBP after you account for inbound landed cost. None of these decisions are knowable from invoice-rate data.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>The FX spread is the part nobody talks about</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Amazon&apos;s Currency Converter for Sellers takes roughly 1.5% over interbank. Shopify Payments FX spread on foreign-currency presentment is similar. Marketplace payouts into a foreign account via Wise are often cheaper; PayPal routinely takes 4%+. Multiply by the annual cross-border volume and the FX spread alone is usually the third or fourth largest cost line in the business.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Yet in the average operator&apos;s accounts, it is not a line item. It is absorbed invisibly into revenue. That invisibility is the most expensive feature of the current software stack.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>What to do about it, short version</h2>
          <ol style={{ paddingLeft: '24px', margin: '0 0 14px' }}>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}>Open a multi-currency bank. Wise, Airwallex or Revolut Business. Stop letting marketplaces convert at point of payout if you can help it — take settlement in the marketplace currency and convert on your own terms.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}>Compute P&L in both the marketplace currency and your home currency. Compare monthly. If the variance is greater than 1% of revenue, you have an FX management problem, not a reporting problem.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}>Price at the channel level, not the product level. A product priced at £29.99 converting to $38 on a weak pound is a different product, strategically, than the same £29.99 at $42 on a strong pound.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}>Break out FX spread as an explicit P&L line. Once it&apos;s visible, it becomes manageable.</li>
          </ol>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>The ambient cost of a lying dashboard</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            We&apos;ve done this exercise with roughly thirty operators in the last quarter. In every single case, the settled P&L was lower than the invoice-rate P&L. The magnitude ranged from 4% to 19%. The median was 11%. That means for a typical cross-border operator, the revenue number on their weekly dashboard is overstated by about a ninth, consistently, every week, without anyone noticing.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Eleven percent is not a rounding error. It is the difference between a business that is growing and one that is treading water. It is the difference between a pricing strategy that works and one that is slowly eroding margin. And it is entirely, unnecessarily, a reporting problem — the money isn&apos;t missing, the visibility is.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            A Commerce Operations Platform that takes this seriously will show you both numbers, explicitly, without you asking. If it doesn&apos;t, assume it&apos;s lying to you, politely, by omission.
          </p>
        </div>

        <div style={{ background: '#ede9fe', borderRadius: '10px', padding: '24px', marginTop: '40px', marginBottom: '48px' }}>
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>Fulcra shows settled and invoice-rate P&amp;L side by side</strong>
          <p style={{ fontSize: '14px', color: '#4c1d95', margin: '0 0 16px', lineHeight: 1.6 }}>Across every channel and every currency. FX spread broken out as a first-class line. Priced in USD, GBP, EUR, AUD, or CAD. From $59/mo.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '7px', background: '#5b52f5', color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Start free trial →</Link>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px' }}>Related guides</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/blog/how-to-calculate-true-profit-ecommerce" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>How to calculate true profit in ecommerce →</Link>
            <Link href="/blog/the-true-cost-of-multichannel-spreadsheets" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>The true cost of multichannel spreadsheets →</Link>
            <Link href="/blog/pricing-floors-by-channel" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>Setting price floors by channel →</Link>
          </div>
        </div>
      </article>
    </div>
  )
}
