import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Setting Price Floors by Channel — Amazon, eBay, Shopify (Tactical Guide)',
  description: 'A practical guide to setting minimum price floors per channel for multichannel sellers. How to compute the real break-even price on Amazon, eBay and Shopify, and how to enforce it without losing the Buy Box.',
  keywords: ['price floor amazon', 'minimum price amazon fba', 'repricer floor', 'ebay price floor', 'shopify channel pricing', 'multichannel pricing strategy'],
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
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tactical · 2026</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: '12px', marginBottom: '20px' }}>
            Setting price floors by channel
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7 }}>
            A price floor is the number below which you would rather lose the sale than take it. Most operators set one number for the whole catalogue. That is wrong. Here is how to compute a per-SKU, per-channel floor that reflects actual break-even, and how to enforce it without strangling your Buy Box.
          </p>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#94a3b8', marginTop: '16px' }}>
            <span>April 2026</span><span>·</span><span>6 min read</span>
          </div>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>Why one floor does not fit all channels</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Amazon takes a referral fee of 8–15% depending on category, plus FBA fulfilment, plus storage, plus returns processing. eBay takes a final value fee of 12–14% plus 2.9% payment processing. Shopify takes 2.9%+$0.30. Same product, three channels, three entirely different cost structures. A single &quot;minimum price&quot; of £19.99 across all three means you are either overpricing on Shopify or underpricing on Amazon — probably both.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            The right mental model is a per-SKU, per-channel floor. It is more numbers to maintain, but only a couple more, and the alternative is leaving margin on the table every time a repricer drops you to the wrong bottom.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>The formula (it&apos;s short)</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Floor = (landed COGS + variable overhead per unit + minimum acceptable contribution) ÷ (1 − channel fee rate).
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            <strong>Landed COGS</strong> is cost of goods plus inbound freight plus duty, per unit. <strong>Variable overhead</strong> is anything that scales with the order — packaging, outbound postage (for FBM/Shopify), returns provision (typically 2–5% of revenue depending on category). <strong>Minimum acceptable contribution</strong> is the target $ you need per unit to cover fixed costs and make the channel worth running. <strong>Channel fee rate</strong> is the marketplace&apos;s combined fees as a fraction of sale price.
          </p>
        </div>

        <div style={{ margin: '40px auto 44px', display: 'flex', justifyContent: 'center' }}>
          <svg width="620" height="260" viewBox="0 0 620 260" style={{ maxWidth: '100%', height: 'auto' }} aria-label="Bar chart comparing per-channel price floor for the same SKU on Amazon, eBay and Shopify">
            <g fontFamily="Inter, system-ui">
              {[
                { label: 'Amazon FBA', floor: 27.40, color: '#5b52f5' },
                { label: 'Amazon FBM', floor: 23.80, color: '#5b52f5' },
                { label: 'eBay', floor: 22.10, color: '#0f172a' },
                { label: 'Shopify', floor: 19.20, color: '#0f172a' },
              ].map(({ label, floor, color }, i) => {
                const barH = (floor / 30) * 170
                const cx = 90 + i * 120
                return (
                  <g key={label}>
                    <rect x={cx} y={200 - barH} width="70" height={barH} fill={color} stroke="#0f172a" strokeWidth="1.5" />
                    <text x={cx + 35} y={218} textAnchor="middle" fontSize="12" fill="#475569">{label}</text>
                    <text x={cx + 35} y={194 - barH} textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="600">£{floor.toFixed(2)}</text>
                  </g>
                )
              })}
              <line x1="70" y1="200" x2="580" y2="200" stroke="#0f172a" strokeWidth="1.5" />
              <text x="70" y="250" fontSize="11" fill="#64748b">Same SKU, same COGS, different channel floors — £12 landed COGS, £3 target contribution.</text>
            </g>
          </svg>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>Worked example — one SKU, four floors</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            A typical small-parcel SKU: £12 landed COGS, £0.80 packaging, target £3/unit contribution.
          </p>
          <ul style={{ paddingLeft: '24px', margin: '0 0 14px' }}>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}><strong>Amazon FBA.</strong> Fees: 15% referral + £3.20 FBA pick/pack. Floor = (£12 + £0.80 + £3.20 + £3) ÷ (1 − 0.15) = <strong>£22.35</strong>. Round up for returns provision (2%) → <strong>£22.80</strong>. Add storage accrual of ~£0.60 for a typical unit → ~<strong>£23.40</strong>. Illustrative; real numbers vary by weight and category.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}><strong>Amazon FBM.</strong> Fees: 15% referral + £3.20 outbound postage. No FBA pick/pack, no storage. Floor = (£12 + £0.80 + £3.20 + £3) ÷ (1 − 0.15) ≈ <strong>£22.35</strong>. Similar to FBA but trades inbound cost for per-order postage — margin sensitivity to volume differs.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}><strong>eBay.</strong> Fees: 12.8% final value + 3% payment (bundled as managed payments). Floor = (£12 + £0.80 + £3.20 postage + £3) ÷ (1 − 0.158) ≈ <strong>£22.55</strong>.</li>
            <li style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '6px' }}><strong>Shopify.</strong> Fees: 2.9% + £0.25 Shopify Payments. Floor = (£12 + £0.80 + £3.20 postage + £3) ÷ (1 − 0.029) ≈ <strong>£19.55</strong>.</li>
          </ul>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Same product, same cost, four different minimums. Four is not a lot of numbers to maintain. But the gap between the highest (Amazon FBA at £23.40) and the lowest (Shopify at £19.55) is £3.85, which is larger than the target contribution itself. Setting a single floor at either end means you are leaving money or losing money, depending on which end.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>Enforcement — without strangling the Buy Box</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            A floor is only useful if your repricer respects it. Most repricers let you set a per-SKU minimum. A few only let you set a catalogue-level percentage off list. If yours is the second kind, switch.
          </p>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Enforcement philosophy matters too. &quot;Never go below floor&quot; is simple but costs you the Buy Box during competitor price dips that you would have been fine to match for a day. The smarter rule is &quot;match-within-floor for the top competitor, but only if Buy Box share is below X%&quot;. You are trading a tiny margin hit for continued rank. In practice, that rule recovers 2–4% of weekly revenue on competitive SKUs, and it only fires when it needs to.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>When to update the floor</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Every time one of three things changes: landed COGS (new supplier quote, shipping rate change, duty rule change), channel fee schedule (Amazon revises referral fees annually, eBay changes promoted listing minimums periodically), or currency (if you source in one currency and sell in another, the floor is a moving number). Anything less frequent than quarterly review is a backlog; anything more frequent than weekly is usually overkill.
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '14px' }}>The one mistake everyone makes</h2>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, margin: '0 0 14px' }}>
            Setting the floor at COGS. Operators think &quot;well, I need to cover my cost, so that&apos;s the floor&quot;. It isn&apos;t. The floor needs to cover landed COGS plus variable overhead plus your target contribution, grossed up for the channel fees. Setting it at COGS guarantees you lose money on every sale, because the fees always eat into whatever you thought was margin. We&apos;ve audited repricer configurations where the &quot;floor&quot; was simply the CSV import of cost — which was a recipe for 20% losses on every matched competitor. Do not do this. Do the short formula. It takes fifteen minutes per SKU category and it is the highest-leverage pricing work in the business.
          </p>
        </div>

        <div style={{ background: '#ede9fe', borderRadius: '10px', padding: '24px', marginTop: '40px', marginBottom: '48px' }}>
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>Per-channel floors, computed and enforced in Fulcra</strong>
          <p style={{ fontSize: '14px', color: '#4c1d95', margin: '0 0 16px', lineHeight: 1.6 }}>Fulcra calculates your floor from live landed cost + real fee schedule per channel, and pushes it into your repricer or channel listing automatically. From $59/mo, connect Shopify and Amazon in under ten minutes.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '7px', background: '#5b52f5', color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Start free trial →</Link>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px' }}>Related guides</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/blog/multi-currency-pnl-explained" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>Multi-currency P&amp;L explained →</Link>
            <Link href="/blog/how-to-calculate-true-profit-ecommerce" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>How to calculate true profit in ecommerce →</Link>
            <Link href="/blog/2026-running-multi-marketplace-on-one-ledger" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>Running 5+ marketplaces on one ledger →</Link>
          </div>
        </div>
      </article>
    </div>
  )
}
