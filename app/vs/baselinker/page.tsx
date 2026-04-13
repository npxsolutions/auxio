import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Auxio vs Baselinker — Global platform vs regional alternative (2026)',
  description: 'Baselinker is a strong regional tool for Central/Eastern European sellers. Auxio is the global multichannel operations platform — see how they compare on pricing, AI, profit tracking, and support.',
  keywords: ['Baselinker alternative', 'Baselinker vs Auxio', 'Baselinker alternative 2026', 'global multichannel software', 'international commerce operations platform'],
}

const COMPARISON = [
  { feature: 'True profit tracking (after all fees)', auxio: true, bl: false, note: '' },
  { feature: 'AI listing writer', auxio: true, bl: false, note: '' },
  { feature: 'Global multichannel coverage', auxio: true, bl: 'partial', note: 'Baselinker is Poland-first; Auxio is built for sellers worldwide' },
  { feature: 'OnBuy integration', auxio: true, bl: 'partial', note: '' },
  { feature: 'Royal Mail, USPS, DHL, Australia Post label printing', auxio: true, bl: true, note: '' },
  { feature: 'Social intelligence (TikTok/Instagram)', auxio: true, bl: false, note: '' },
  { feature: 'Feed rules engine', auxio: true, bl: 'partial', note: '' },
  { feature: 'Profit-floor repricing', auxio: true, bl: false, note: '' },
  { feature: 'AI daily briefings', auxio: true, bl: false, note: '' },
  { feature: 'Starter price', auxio: '$59/mo', bl: '~$45/mo', note: 'Baselinker prices based on orders processed' },
  { feature: 'Free trial (no card)', auxio: true, bl: true, note: '' },
  { feature: 'Dedicated support', auxio: true, bl: false, note: '' },
  { feature: 'In-app AI chat', auxio: true, bl: false, note: '' },
]

const REASONS = [
  {
    title: 'You want to know what you actually made',
    desc: 'Baselinker tracks orders. Auxio tracks profit. We deduct eBay fees, Amazon referral fees, shipping costs, packaging, and COGS on every order so you see real margin — not just turnover.',
  },
  {
    title: 'You sell globally, not just in one region',
    desc: 'Baselinker is Poland-first and strongest in Central/Eastern Europe. Auxio is built for global multichannel sellers from day one — Amazon US/UK/DE/AU, eBay worldwide, Shopify, OnBuy, TikTok Shop, plus multi-currency billing in USD, GBP, EUR, AUD or CAD.',
  },
  {
    title: 'You want AI that actually helps',
    desc: 'Baselinker has basic automation. Auxio has an AI agent that writes channel-specific listings, spots underperforming products, recommends actions, and executes them — with your approval.',
  },
  {
    title: 'You\'re growing and want to add channels fast',
    desc: 'Baselinker\'s feed management is basic. Auxio\'s rule engine lets you transform titles, remap categories, and create channel-specific variants without touching a spreadsheet.',
  },
]

export default function VsBaselinkerPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0f172a' }}>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8e5', padding: '0 48px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>A</div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>Auxio</span>
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Start free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: '100px', paddingBottom: '64px', background: '#fafaf9', borderBottom: '1px solid #f1f1ef' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 48px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: 'rgba(91,82,245,0.08)', border: '1px solid rgba(91,82,245,0.15)', fontSize: '12px', color: '#5b52f5', fontWeight: 600, marginBottom: '20px' }}>
            COMPARISON
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '20px', color: '#0f172a' }}>
            Auxio vs Baselinker
          </h1>
          <p style={{ fontSize: '18px', color: '#64748b', lineHeight: 1.7, marginBottom: '32px' }}>
            Baselinker is a strong regional tool, especially for sellers in Poland and Central/Eastern Europe. Auxio is the global commerce operations platform — built for multichannel sellers worldwide who want to understand their profit, not just process their orders.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/signup" style={{ padding: '13px 24px', borderRadius: '8px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', color: 'white', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Try Auxio free →</Link>
            <Link href="/pricing" style={{ padding: '13px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#374151', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>See pricing</Link>
          </div>
        </div>
      </div>

      {/* Quick verdict */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 48px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ padding: '28px', background: 'rgba(91,82,245,0.04)', border: '2px solid #5b52f5', borderRadius: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Choose Auxio if…</div>
            {['You want to track true profit, not just revenue', 'You sell globally across Amazon, eBay, Shopify, OnBuy and TikTok Shop', 'You want AI that writes listings and surfaces insights daily', 'You\'re tired of tools that require a spreadsheet to run'].map(r => (
              <div key={r} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: '#5b52f5', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '28px', border: '1px solid #e8e8e5', borderRadius: '14px', background: '#fafaf9' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Baselinker might suit you if…</div>
            {['You sell primarily in Poland, Czech Republic, or Romania', 'You mainly need order management and basic routing', 'You need their very large courier integration library (323+ carriers)', 'Volume pricing by orders matters more than feature depth'].map(r => (
              <div key={r} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: '#94a3b8', flexShrink: 0 }}>→</span>
                <span style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 48px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '32px', color: '#0f172a' }}>Feature comparison</h2>
        <div style={{ border: '1px solid #e8e8e5', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Feature</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, color: '#a3e635', fontSize: '13px' }}>Auxio</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Baselinker</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} style={{ borderTop: '1px solid #f1f1ef', background: i % 2 === 0 ? 'white' : '#fafaf9' }}>
                  <td style={{ padding: '13px 20px', color: '#374151', fontWeight: 500 }}>
                    {row.feature}
                    {row.note && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{row.note}</div>}
                  </td>
                  <td style={{ padding: '13px 20px', textAlign: 'center' }}>
                    {row.auxio === true ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      : <span style={{ color: '#374151', fontWeight: 500 }}>{row.auxio}</span>}
                  </td>
                  <td style={{ padding: '13px 20px', textAlign: 'center' }}>
                    {row.bl === true ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      : row.bl === false ? <span style={{ color: '#dc2626' }}>✗</span>
                      : row.bl === 'partial' ? <span style={{ color: '#d97706' }}>Partial</span>
                      : <span style={{ color: '#374151' }}>{row.bl}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reasons to switch */}
      <div style={{ background: '#fafaf9', borderTop: '1px solid #f1f1ef', padding: '80px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '40px', color: '#0f172a' }}>Why multichannel sellers switch from Baselinker to Auxio</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {REASONS.map(r => (
              <div key={r.title} style={{ padding: '28px', background: 'white', border: '1px solid #e8e8e5', borderRadius: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>{r.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing comparison */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px', color: '#0f172a' }}>Pricing</h2>
        <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px', lineHeight: 1.6 }}>
          Baselinker prices by orders processed, which can get expensive as you scale. Auxio prices by plan — predictable monthly cost, no surprise bills when you have a good month.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ padding: '28px', border: '2px solid #5b52f5', borderRadius: '14px', background: 'rgba(91,82,245,0.03)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#5b52f5', marginBottom: '8px' }}>Auxio</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>$59<span style={{ fontSize: '16px', fontWeight: 400, color: '#64748b' }}>/mo</span></div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Starter — all channels included</div>
            {['All channels included', 'True profit tracking', 'AI listing writer', 'Global support', '14-day free trial'].map(f => (
              <div key={f} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#5b52f5' }}>✓</span>
                <span style={{ fontSize: '13px', color: '#374151' }}>{f}</span>
              </div>
            ))}
            <Link href="/pricing" style={{ display: 'block', textAlign: 'center', marginTop: '20px', padding: '10px', borderRadius: '8px', background: '#5b52f5', color: 'white', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>See all plans →</Link>
          </div>
          <div style={{ padding: '28px', border: '1px solid #e8e8e5', borderRadius: '14px', background: '#fafaf9' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Baselinker</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>~$45<span style={{ fontSize: '16px', fontWeight: 400, color: '#64748b' }}>/mo</span></div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>For up to 3,000 orders/month</div>
            {['Order management', 'Basic automation', 'Courier integrations', 'No profit tracking', 'Scales by order volume'].map((f, i) => (
              <div key={f} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: i > 2 ? '#dc2626' : '#64748b' }}>{i > 2 ? '✗' : '–'}</span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#09090b', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '16px' }}>Ready to try the global alternative?</h2>
        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.55)', marginBottom: '32px' }}>14-day free trial. No card. Migrate from Baselinker in an afternoon.</p>
        <Link href="/signup" style={{ display: 'inline-block', padding: '16px 32px', borderRadius: '8px', background: '#a3e635', color: '#0f172a', fontSize: '16px', fontWeight: 700, textDecoration: 'none' }}>Start free trial →</Link>
        <p style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Questions? <Link href="/contact" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>Talk to us</Link></p>
      </div>

      <footer style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2026 Auxio. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Pricing', '/pricing'], ['vs Linnworks', '/vs/linnworks'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
    </div>
  )
}
