import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Palvento vs Linnworks — A better option for multichannel sellers (2026)',
  description: 'Linnworks starts at $549/month. Palvento starts at $149. Compare features, pricing, and AI capabilities for global multichannel sellers in 2026.',
  keywords: ['Linnworks alternative', 'Linnworks alternative cheaper', 'Linnworks vs Palvento', 'cheaper than Linnworks', 'global multichannel software', 'multichannel software small business', 'international ecommerce operations platform'],
}

const COMPARISON = [
  { feature: 'Starting price', palvento: '$149/mo', lw: '$549/mo', highlight: true },
  { feature: 'Free trial', palvento: '14 days (no card)', lw: 'Demo only', highlight: true },
  { feature: 'AI listing writer', palvento: true, lw: false, highlight: false },
  { feature: 'True profit tracking (after fees)', palvento: true, lw: false, highlight: false },
  { feature: 'OnBuy integration', palvento: true, lw: false, highlight: false },
  { feature: 'Social intelligence', palvento: true, lw: false, highlight: false },
  { feature: 'AI daily briefings', palvento: true, lw: false, highlight: false },
  { feature: 'Profit-floor repricing', palvento: true, lw: 'Add-on', highlight: false },
  { feature: 'Built for multichannel sellers', palvento: true, lw: false, highlight: false },
  { feature: 'Feed rules engine', palvento: true, lw: true, highlight: false },
  { feature: 'eBay integration', palvento: true, lw: true, highlight: false },
  { feature: 'Amazon integration', palvento: true, lw: true, highlight: false },
  { feature: 'Shopify integration', palvento: true, lw: true, highlight: false },
  { feature: 'Contract required', palvento: false, lw: 'Annual', highlight: false },
  { feature: 'Onboarding time', palvento: 'Self-serve, <10 min', lw: 'Weeks of setup', highlight: false },
]

export default function VsLinnworksPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0f172a' }}>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8e5', padding: '0 48px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #e8863f, #e8863f)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>A</div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>Palvento</span>
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Start free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: '100px', paddingBottom: '64px', background: '#fafaf9', borderBottom: '1px solid #f1f1ef' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 48px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: 'rgba(232,134,63,0.10)', border: '1px solid rgba(232,134,63,0.10)', fontSize: '12px', color: '#e8863f', fontWeight: 600, marginBottom: '20px' }}>
            COMPARISON
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '20px', color: '#0f172a' }}>
            Palvento vs Linnworks
          </h1>
          <p style={{ fontSize: '18px', color: '#64748b', lineHeight: 1.7, marginBottom: '16px' }}>
            Linnworks is a powerful platform — built for warehouse operations teams at $549+/month. Palvento is built for independent multichannel sellers worldwide who want the same capabilities without the enterprise price tag or the 6-week onboarding.
          </p>
          <div style={{ display: 'inline-flex', gap: '8px', padding: '12px 20px', background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.15)', borderRadius: '10px', marginBottom: '32px' }}>
            <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: 600 }}>Linnworks starts at $549/month.</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Palvento starts at $149.</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/signup" style={{ padding: '13px 24px', borderRadius: '8px', background: 'linear-gradient(135deg, #e8863f, #e8863f)', color: 'white', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Try Palvento free →</Link>
            <Link href="/pricing" style={{ padding: '13px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#374151', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>See pricing</Link>
          </div>
        </div>
      </div>

      {/* Price comparison callout */}
      <div style={{ maxWidth: '900px', margin: '40px auto 0', padding: '0 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', background: '#fafaf9', border: '1px solid #f1f1ef', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8863f', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Palvento Starter</div>
            <div style={{ fontSize: '56px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>$149</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>per month · all channels · no contract · billed in USD / GBP / EUR / AUD / CAD</div>
            <div style={{ fontSize: '13px', color: '#e8863f', marginTop: '8px', fontWeight: 500 }}>Founding rate available →</div>
          </div>
          <div style={{ borderLeft: '1px solid #f1f1ef', paddingLeft: '40px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Linnworks</div>
            <div style={{ fontSize: '56px', fontWeight: 900, color: '#94a3b8', letterSpacing: '-0.03em', lineHeight: 1 }}>$549</div>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px' }}>per month · annual contract required</div>
            <div style={{ fontSize: '13px', color: '#dc2626', marginTop: '8px', fontWeight: 500 }}>That's $6,588/year before you sell a single item</div>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 48px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '32px', color: '#0f172a' }}>Feature by feature</h2>
        <div style={{ border: '1px solid #e8e8e5', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Feature</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, color: '#a3e635', fontSize: '13px' }}>Palvento</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Linnworks</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} style={{ borderTop: '1px solid #f1f1ef', background: row.highlight ? 'rgba(232,134,63,0.10)' : i % 2 === 0 ? 'white' : '#fafaf9' }}>
                  <td style={{ padding: '13px 20px', color: '#374151', fontWeight: row.highlight ? 700 : 500 }}>{row.feature}</td>
                  <td style={{ padding: '13px 20px', textAlign: 'center' }}>
                    {row.palvento === true ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      : row.palvento === false ? <span style={{ color: '#dc2626' }}>✗</span>
                      : <span style={{ color: '#0f172a', fontWeight: row.highlight ? 700 : 400 }}>{row.palvento}</span>}
                  </td>
                  <td style={{ padding: '13px 20px', textAlign: 'center' }}>
                    {row.lw === true ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      : row.lw === false ? <span style={{ color: '#dc2626' }}>✗</span>
                      : <span style={{ color: '#64748b' }}>{row.lw}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Who should use what */}
      <div style={{ background: '#fafaf9', borderTop: '1px solid #f1f1ef', padding: '80px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '32px', color: '#0f172a' }}>Who is each platform for?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ padding: '28px', background: 'white', border: '2px solid #e8863f', borderRadius: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8863f', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Palvento is for you if…</div>
              {[
                'You\'re an independent or small-team multichannel seller (1–50 staff)',
                'You want to be live on a new channel in under 10 minutes',
                'You want to know your actual profit, not just your GMV',
                'You want AI that writes listings and gives you daily insights',
                'You can\'t justify $549/month just to get started',
              ].map(r => (
                <div key={r} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#e8863f', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '28px', border: '1px solid #e8e8e5', borderRadius: '14px', background: '#fafaf9' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Linnworks suits you if…</div>
              {[
                'You have a dedicated warehouse management team',
                'You process 10,000+ orders/month across 15+ channels',
                'You need deep 3PL and fulfilment integrations',
                'You have budget for enterprise software and IT support',
                'You are a retailer, not a marketplace-first seller',
              ].map(r => (
                <div key={r} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#94a3b8', flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Migration note */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '64px 48px' }}>
        <div style={{ padding: '32px', background: 'rgba(232,134,63,0.10)', border: '1px solid rgba(232,134,63,0.10)', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>Moving from Linnworks?</h3>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.7, marginBottom: '20px' }}>
            Most sellers migrate in an afternoon. Connect your channels, import your product catalogue, and set your profit thresholds. We'll handle the rest. If you need help, our team will guide you through it at no extra charge.
          </p>
          <Link href="/contact" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '8px', background: '#e8863f', color: 'white', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Talk to us about migrating →</Link>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#09090b', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '16px' }}>
          Get the capabilities. Not the enterprise price.
        </h2>
        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.55)', marginBottom: '32px' }}>Start free for 14 days. No card, no contract, no onboarding call required.</p>
        <Link href="/signup" style={{ display: 'inline-block', padding: '16px 32px', borderRadius: '8px', background: '#a3e635', color: '#0f172a', fontSize: '16px', fontWeight: 700, textDecoration: 'none' }}>Start your free trial →</Link>
      </div>

      <footer style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2026 Palvento. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Pricing', '/pricing'], ['vs Baselinker', '/vs/baselinker'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
    </div>
  )
}
