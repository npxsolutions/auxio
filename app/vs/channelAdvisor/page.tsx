import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Auxio vs ChannelAdvisor (Rithum) — global alternative comparison (2026)',
  description: 'ChannelAdvisor/Rithum starts at $2,500+/mo and targets enterprise brands. Auxio gives multichannel sellers worldwide the same channel breadth, plus AI and true P&L, from $59/mo.',
  keywords: ['ChannelAdvisor alternative', 'Rithum alternative', 'ChannelAdvisor vs Auxio', 'cheaper ChannelAdvisor', 'global multichannel ecommerce software', 'international commerce operations platform'],
}

const COMPARISON = [
  { feature: 'Starting price',              auxio: 'From $59/mo',       ca: '$2,500+/mo',         highlight: true },
  { feature: 'Time to go live',             auxio: '<10 min self-serve', ca: 'Months',              highlight: true },
  { feature: 'Free trial',                  auxio: '14 days, no card',   ca: 'Demo only',           highlight: true },
  { feature: 'Independent multichannel seller focus', auxio: true,                 ca: false,                 highlight: false },
  { feature: 'True net P&L tracking',       auxio: true,                 ca: false,                 highlight: false },
  { feature: 'Demand forecasting',          auxio: true,                 ca: false,                 highlight: false },
  { feature: 'Purchase orders',             auxio: true,                 ca: false,                 highlight: false },
  { feature: 'AI listing optimisation',     auxio: true,                 ca: 'RithumIQ (enterprise)', highlight: false },
  { feature: 'Advertising (PPC) tracking',  auxio: true,                 ca: true,                  highlight: false },
  { feature: 'Developer API + webhooks',    auxio: true,                 ca: true,                  highlight: false },
  { feature: 'eBay integration',            auxio: true,                 ca: true,                  highlight: false },
  { feature: 'Amazon integration',          auxio: true,                 ca: true,                  highlight: false },
  { feature: 'Shopify integration',         auxio: true,                 ca: true,                  highlight: false },
  { feature: 'Annual contract required',    auxio: false,                ca: 'Yes',                 highlight: false },
]

export default function VsChannelAdvisorPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0f172a' }}>

      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '0 48px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 50 }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', textDecoration: 'none', letterSpacing: '-0.02em' }}>Auxio</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/pricing" style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>See pricing</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: '7px', background: '#5b52f5', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Start free →</Link>
        </div>
      </nav>

      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '80px 48px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: '#fee2e2', fontSize: '12px', color: '#991b1b', fontWeight: 600, marginBottom: '24px' }}>
          ChannelAdvisor / Rithum alternative
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px' }}>
          ChannelAdvisor is built for enterprise brands.<br />
          <span style={{ color: '#5b52f5' }}>Auxio is built for multichannel sellers like you.</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7, marginBottom: '36px' }}>
          ChannelAdvisor (now Rithum) is a powerful commerce network — but it starts at $2,500+/mo, requires months of onboarding, and is priced for enterprise brands managing millions in GMV. Auxio gives multichannel sellers worldwide enterprise-level operations at a fraction of the cost, live in minutes.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/signup" style={{ padding: '13px 28px', borderRadius: '8px', background: '#5b52f5', color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Start free — no card needed
          </Link>
          <Link href="/pricing" style={{ padding: '13px 28px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
            See our pricing →
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: '860px', margin: '0 auto', padding: '0 48px 80px' }}>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', gap: '8px' }}>
            <span>Feature</span><span style={{ textAlign: 'center', color: '#5b52f5' }}>Auxio</span><span style={{ textAlign: 'center' }}>ChannelAdvisor</span>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '12px 20px', borderBottom: i < COMPARISON.length - 1 ? '1px solid #f1f5f9' : 'none', background: row.highlight ? '#fafaf8' : 'white', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#334155', fontWeight: row.highlight ? 600 : 400 }}>{row.feature}</span>
              <span style={{ fontSize: '13px', textAlign: 'center', color: typeof row.auxio === 'boolean' ? (row.auxio ? '#059669' : '#dc2626') : '#5b52f5', fontWeight: 600 }}>
                {typeof row.auxio === 'boolean' ? (row.auxio ? '✓' : '✗') : row.auxio}
              </span>
              <span style={{ fontSize: '13px', textAlign: 'center', color: typeof row.ca === 'boolean' ? (row.ca ? '#059669' : '#dc2626') : '#64748b' }}>
                {typeof row.ca === 'boolean' ? (row.ca ? '✓' : '✗') : row.ca}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: '600px', margin: '0 auto', padding: '0 48px 80px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '16px' }}>The smarter choice for growing multichannel sellers</h2>
        <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.7, marginBottom: '32px' }}>
          ChannelAdvisor makes sense when you're managing $10M+ GMV and need a managed service. For multichannel sellers who want control, transparency, and a platform that grows with them — Auxio is built for you.
        </p>
        <Link href="/signup" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: '8px', background: '#5b52f5', color: '#fff', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
          Start your free trial →
        </Link>
        <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/vs/linnworks" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>vs Linnworks</Link>
          <Link href="/vs/brightpearl" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>vs Brightpearl</Link>
          <Link href="/vs/baselinker" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>vs Baselinker</Link>
        </div>
      </section>
    </div>
  )
}
