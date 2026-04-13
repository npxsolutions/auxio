import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Auxio vs Brightpearl — Full comparison for UK multichannel sellers (2026)',
  description: 'Brightpearl requires a custom quote, weeks of onboarding, and an enterprise contract. Auxio gives you inventory, procurement, P&L, and AI from £49/mo — live in 10 minutes.',
  keywords: ['Brightpearl alternative', 'Brightpearl alternative cheaper', 'Brightpearl vs Auxio', 'retail operating system alternative', 'multichannel ecommerce software UK', 'inventory management Brightpearl'],
}

const COMPARISON = [
  { feature: 'Starting price',               auxio: 'From £49/mo',    bp: 'Custom quote only',    highlight: true },
  { feature: 'Time to go live',              auxio: 'Self-serve, <10 min', bp: 'Weeks of onboarding', highlight: true },
  { feature: 'Free trial',                   auxio: '14 days, no card',   bp: 'Demo only',           highlight: true },
  { feature: 'Demand forecasting',           auxio: true,              bp: true,                   highlight: false },
  { feature: 'Purchase orders',             auxio: true,              bp: true,                   highlight: false },
  { feature: 'True net P&L (not revenue)',  auxio: true,              bp: 'Partial',              highlight: false },
  { feature: 'AI listing optimisation',     auxio: true,              bp: false,                  highlight: false },
  { feature: 'AI demand agent',             auxio: true,              bp: false,                  highlight: false },
  { feature: 'Advertising tracking (PPC)',  auxio: true,              bp: false,                  highlight: false },
  { feature: 'Developer API + webhooks',    auxio: true,              bp: 'Enterprise only',      highlight: false },
  { feature: 'eBay integration',            auxio: true,              bp: true,                   highlight: false },
  { feature: 'Amazon integration',          auxio: true,              bp: true,                   highlight: false },
  { feature: 'Shopify integration',         auxio: true,              bp: true,                   highlight: false },
  { feature: 'OnBuy integration',           auxio: true,              bp: false,                  highlight: false },
  { feature: 'UK-based support',            auxio: true,              bp: true,                   highlight: false },
  { feature: 'Revenue % fee',               auxio: 'Never',           bp: 'Never',                highlight: false },
  { feature: 'Annual contract required',    auxio: false,             bp: 'Yes',                  highlight: false },
]

const REASONS = [
  {
    heading: 'You don\'t need a 4-week implementation project',
    body: 'Brightpearl\'s onboarding takes weeks and requires a dedicated implementation specialist. Auxio is self-serve — connect your first channel in under 10 minutes, and your orders, listings, and inventory are live immediately. No calls, no contracts, no waiting.',
  },
  {
    heading: 'Transparent pricing from day one',
    body: 'Brightpearl\'s pricing is "bespoke" — which means you don\'t know what you\'ll pay until after a sales call. Auxio publishes every tier, every feature, and every limit upfront. Start at £49/mo, cancel any time. No surprises.',
  },
  {
    heading: 'AI built in — not bolted on',
    body: 'Brightpearl\'s platform is powerful but doesn\'t include AI-powered listing optimisation, an autonomous AI agent, or demand forecasting driven by machine learning. Auxio\'s AI layer is included on Growth and above — it monitors your store, surfaces actions, and can act on your behalf.',
  },
  {
    heading: 'The full operations stack, not just order management',
    body: 'Auxio covers the entire commerce operations loop: multichannel listings → inventory sync → order management → procurement → demand forecasting → P&L → advertising tracking → developer API. Brightpearl covers the back half well. Auxio covers all of it.',
  },
]

export default function VsBrightpearlPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0f172a' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '0 48px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 50 }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', textDecoration: 'none', letterSpacing: '-0.02em' }}>Auxio</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/pricing" style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>See pricing</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: '7px', background: '#5b52f5', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Start free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '80px 48px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: '#fef3c7', fontSize: '12px', color: '#92400e', fontWeight: 600, marginBottom: '24px' }}>
          Brightpearl alternative
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px' }}>
          Everything Brightpearl does —<br />
          <span style={{ color: '#5b52f5' }}>live in 10 minutes, from £49/mo.</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7, marginBottom: '36px' }}>
          Brightpearl is a powerful retail operating system. But it requires a custom quote, a weeks-long implementation project, and an annual contract. Auxio gives UK multichannel sellers the same depth — inventory, procurement, forecasting, P&amp;L — with self-serve setup and transparent pricing.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/signup" style={{ padding: '13px 28px', borderRadius: '8px', background: '#5b52f5', color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Start free — no card needed
          </Link>
          <Link href="/contact" style={{ padding: '13px 28px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
            Book a demo →
          </Link>
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ maxWidth: '860px', margin: '0 auto', padding: '0 48px 80px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '24px', textAlign: 'center' }}>Side-by-side comparison</h2>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', gap: '8px' }}>
            <span>Feature</span><span style={{ textAlign: 'center', color: '#5b52f5' }}>Auxio</span><span style={{ textAlign: 'center' }}>Brightpearl</span>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '12px 20px', borderBottom: i < COMPARISON.length - 1 ? '1px solid #f1f5f9' : 'none', background: row.highlight ? '#fafaf8' : 'white', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#334155', fontWeight: row.highlight ? 600 : 400 }}>{row.feature}</span>
              <span style={{ fontSize: '13px', textAlign: 'center', color: typeof row.auxio === 'boolean' ? (row.auxio ? '#059669' : '#dc2626') : '#5b52f5', fontWeight: 600 }}>
                {typeof row.auxio === 'boolean' ? (row.auxio ? '✓' : '✗') : row.auxio}
              </span>
              <span style={{ fontSize: '13px', textAlign: 'center', color: typeof row.bp === 'boolean' ? (row.bp ? '#059669' : '#dc2626') : '#64748b' }}>
                {typeof row.bp === 'boolean' ? (row.bp ? '✓' : '✗') : row.bp}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Reasons */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '80px 48px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '48px', textAlign: 'center' }}>
            Why UK sellers choose Auxio over Brightpearl
          </h2>
          <div style={{ display: 'grid', gap: '32px' }}>
            {REASONS.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', background: '#ede9fe', color: '#5b52f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{i + 1}</div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.01em' }}>{r.heading}</h3>
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.7, margin: 0 }}>{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '16px' }}>
          Ready to switch from Brightpearl?
        </h2>
        <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.7, marginBottom: '32px' }}>
          Join UK sellers who made the switch. No implementation project, no annual contract. Start a free 14-day trial — your first channel is live in under 10 minutes.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/signup" style={{ padding: '14px 32px', borderRadius: '8px', background: '#5b52f5', color: '#fff', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
            Start your free trial →
          </Link>
          <Link href="/vs/linnworks" style={{ padding: '14px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
            Compare vs Linnworks
          </Link>
        </div>
        <p style={{ marginTop: '16px', fontSize: '13px', color: '#94a3b8' }}>14-day free trial · No credit card · Cancel anytime</p>
      </section>
    </div>
  )
}
