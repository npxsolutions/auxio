'use client'

// Marketing asset generator — screenshot each card for social media use
// Designed to match Feedonomics' stat-card pattern + Rithum's case study cards

import { useState } from 'react'

const ASSETS = [
  { id: 'hero-stat',       label: 'Hero stat — LinkedIn/Twitter' },
  { id: 'comparison',      label: 'Comparison — LinkedIn' },
  { id: 'feature-card',    label: 'Feature card — Instagram' },
  { id: 'testimonial',     label: 'Testimonial — LinkedIn' },
  { id: 'founding',        label: 'Founding member — Story' },
  { id: 'vs-feedonomics',  label: 'vs Feedonomics — Twitter' },
]

// ── Individual asset components ───────────────────────────────────────────────

function HeroStatCard() {
  return (
    <div style={{ width: '1200px', height: '628px', background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(232,134,63,0.10) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.3)', fontSize: '14px', color: '#a3e635', fontWeight: 700, marginBottom: '28px' }}>
          Palvento · Multichannel Platform
        </div>
        <h1 style={{ fontSize: '88px', fontWeight: 800, letterSpacing: '-0.05em', color: 'white', lineHeight: 1, marginBottom: '16px' }}>
          List once.<br />
          <span style={{ background: 'linear-gradient(135deg, #a3e635, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sell everywhere.</span>
        </h1>
        <p style={{ fontSize: '22px', color: 'rgba(255,255,255,0.45)', marginBottom: '40px' }}>eBay · Amazon · Shopify · TikTok Shop · and 8 more</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          {[
            { value: '< 10 min', label: 'to go live', accent: '#38bdf8' },
            { value: '12+', label: 'channels', accent: '#a3e635' },
            { value: '40%', label: 'time saved', accent: '#fb923c' },
          ].map(s => (
            <div key={s.label} style={{ padding: '20px 32px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', color: s.accent, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '28px', right: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '20px', height: '20px', background: 'linear-gradient(135deg, #e8863f, #e8863f)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 800 }}>A</div>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>palvento.com</span>
      </div>
    </div>
  )
}

function ComparisonCard() {
  const rows = [
    { feature: 'Starting price',    palvento: '£49/mo',   feed: 'Custom £1k+', rithum: '$2,000+' },
    { feature: 'Time to go live',   palvento: '< 10 min', feed: 'Weeks',       rithum: 'Months' },
    { feature: 'AI optimisation',   palvento: '✓',        feed: '✓',           rithum: '✓' },
    { feature: 'Profit tracking',   palvento: '✓',        feed: '✗',           rithum: 'Partial' },
    { feature: 'Social intelligence',palvento: '✓',       feed: '✗',           rithum: '✗' },
    { feature: 'Self-serve',        palvento: '✓',        feed: 'Managed',     rithum: 'Managed' },
  ]
  return (
    <div style={{ width: '1200px', height: '628px', background: '#f7f3eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: '60px' }}>
      <div style={{ width: '100%' }}>
        <h2 style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>Why sellers switch to Palvento</h2>
        <p style={{ textAlign: 'center', fontSize: '16px', color: '#64748b', marginBottom: '36px' }}>Powerful like Feedonomics. Affordable like Baselinker. Faster than both.</p>
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#0f172a' }}>
            {['', 'Palvento', 'Feedonomics', 'Rithum'].map((h, i) => (
              <div key={i} style={{ padding: '12px 16px', textAlign: i > 0 ? 'center' : 'left' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: i === 1 ? '#a3e635' : 'rgba(255,255,255,0.4)' }}>{h}</span>
              </div>
            ))}
          </div>
          {rows.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ padding: '11px 16px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>{row.feature}</div>
              {[row.palvento, row.feed, row.rithum].map((val, j) => (
                <div key={j} style={{ padding: '11px 16px', textAlign: 'center', background: j === 0 ? 'rgba(232,134,63,0.10)' : 'transparent' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: j === 0 ? '#e8863f' : val === '✗' || val.includes('Months') || val.includes('Weeks') || val.includes('$2,000') || val.includes('Custom') || val === 'Managed' ? '#cbd5e1' : '#94a3b8' }}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>palvento.com · Start free — no credit card required</p>
      </div>
    </div>
  )
}

function FeatureCard() {
  return (
    <div style={{ width: '1080px', height: '1080px', background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: '80px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(163,230,53,0.12) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px', textAlign: 'center' }}>⚙️</div>
        <h2 style={{ fontSize: '56px', fontWeight: 800, letterSpacing: '-0.04em', color: 'white', textAlign: 'center', lineHeight: 1.1, marginBottom: '20px' }}>
          Feed rules that<br />
          <span style={{ background: 'linear-gradient(135deg, #a3e635, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>just work.</span>
        </h2>
        <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.6, marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
          Set IF/THEN rules that fire at publish time. Auto-adjust prices, reformat titles, fill missing attributes — per channel, zero manual work.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '640px', margin: '0 auto' }}>
          {[
            { if: 'Channel = eBay', then: 'Price × 1.08', color: '#a3e635' },
            { if: 'Stock < 2',      then: 'Price × 1.15', color: '#38bdf8' },
            { if: 'Cat = Footwear', then: 'Append "Brand New" to title', color: '#fb923c' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 18px' }}>
              <span style={{ fontSize: '13px', color: r.color, fontWeight: 700, fontFamily: 'monospace' }}>IF {r.if}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '16px' }}>→</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>THEN {r.then}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', background: 'linear-gradient(135deg, #e8863f, #e8863f)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 800 }}>A</div>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>palvento.com</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TestimonialCard() {
  return (
    <div style={{ width: '1200px', height: '628px', background: '#f7f3eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: '80px' }}>
      <div style={{ maxWidth: '800px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '9999px', background: 'rgba(163,230,53,0.15)', border: '1px solid rgba(163,230,53,0.3)', fontSize: '15px', fontWeight: 700, color: '#4d7c0f', marginBottom: '32px' }}>87% time saved</div>
        <p style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4, letterSpacing: '-0.02em', marginBottom: '32px', fontStyle: 'italic' }}>
          &ldquo;We were spending 3 hours a day managing listings across eBay and Amazon. Palvento cut that to under 20 minutes.&rdquo;
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #e8863f, #e8863f)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', fontWeight: 700 }}>S</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Sarah M.</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>eBay & Amazon seller · 800 SKUs</div>
          </div>
        </div>
        <p style={{ marginTop: '32px', fontSize: '14px', color: '#94a3b8' }}>palvento.com · Start free — no credit card required</p>
      </div>
    </div>
  )
}

function FoundingCard() {
  return (
    <div style={{ width: '1080px', height: '1080px', background: 'linear-gradient(135deg, #09090b 0%, #0f0f1a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: '80px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(217,119,6,0.15) 0%, transparent 60%)' }} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 24px', borderRadius: '9999px', background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.3)', fontSize: '16px', color: '#fbbf24', fontWeight: 700, marginBottom: '36px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          27 founding spots remaining
        </div>
        <h2 style={{ fontSize: '72px', fontWeight: 800, letterSpacing: '-0.05em', color: 'white', lineHeight: 1.0, marginBottom: '16px' }}>
          Founding<br />member offer
        </h2>
        <p style={{ fontSize: '22px', color: 'rgba(255,255,255,0.4)', marginBottom: '56px', lineHeight: 1.5 }}>
          Up to 40% off — locked in for life.<br />For sellers who want to grow with us.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '48px' }}>
          {[
            { name: 'Starter',  from: '£49/mo', was: '£79' },
            { name: 'Growth',   from: '£129/mo', was: '£199' },
            { name: 'Scale',    from: '£399/mo', was: '£599' },
          ].map(p => (
            <div key={p.name} style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>{p.name}</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', marginBottom: '4px' }}>{p.from}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', textDecoration: 'line-through' }}>was {p.was}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg, #e8863f, #e8863f)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 800 }}>A</div>
          <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>palvento.com/signup</span>
        </div>
      </div>
    </div>
  )
}

function VsFeedonomicsCard() {
  return (
    <div style={{ width: '1200px', height: '628px', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: '80px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <p style={{ textAlign: 'center', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Feedonomics vs Palvento</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '32px', alignItems: 'center' }}>
          {/* Feedonomics */}
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Feedonomics</div>
            {[['£1,000+/mo', 'Starting price'], ['Weeks', 'To go live'], ['Specialist required', 'Setup'], ['No', 'Profit tracking']].map(([v, l]) => (
              <div key={l} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>{v}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>{l}</div>
              </div>
            ))}
          </div>
          {/* VS */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'rgba(255,255,255,0.15)', letterSpacing: '-0.02em' }}>vs</div>
          </div>
          {/* Palvento */}
          <div style={{ border: '1px solid rgba(232,134,63,0.10)', borderRadius: '16px', padding: '32px', textAlign: 'center', background: 'rgba(232,134,63,0.10)' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#a3e635', marginBottom: '16px' }}>Palvento</div>
            {[['£49/mo', 'Starting price'], ['< 10 min', 'To go live'], ['Self-serve', 'Setup'], ['Yes', 'Profit tracking']].map(([v, l]) => (
              <div key={l} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>{v}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>palvento.com · Start free, no credit card required</p>
      </div>
    </div>
  )
}

const ASSET_COMPONENTS: Record<string, React.ReactNode> = {
  'hero-stat':      <HeroStatCard />,
  'comparison':     <ComparisonCard />,
  'feature-card':   <FeatureCard />,
  'testimonial':    <TestimonialCard />,
  'founding':       <FoundingCard />,
  'vs-feedonomics': <VsFeedonomicsCard />,
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketingAssetsPage() {
  const [active, setActive] = useState('hero-stat')

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#09090b', minHeight: '100vh', color: 'white' }}>

      <div style={{ padding: '32px 48px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Marketing Asset Generator</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Screenshot each asset for social media · Optimised sizes for each platform</div>
        </div>
        <a href="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Back to site</a>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 85px)' }}>

        {/* Sidebar */}
        <div style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '20px', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Assets</div>
          {ASSETS.map(a => (
            <button key={a.id} onClick={() => setActive(a.id)} style={{ width: '100%', display: 'block', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', background: active === a.id ? 'rgba(232,134,63,0.10)' : 'transparent', color: active === a.id ? '#a89ef8' : 'rgba(255,255,255,0.45)', fontSize: '13px', fontWeight: active === a.id ? 600 : 400, cursor: 'pointer', marginBottom: '2px', fontFamily: 'inherit' }}>
              {a.label}
            </button>
          ))}

          <div style={{ marginTop: '28px', padding: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>HOW TO USE</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              1. Select an asset<br />
              2. Right-click the preview<br />
              3. &ldquo;Inspect&rdquo; → find the outer div<br />
              4. Use browser screenshot or<br />
              &nbsp;&nbsp;&nbsp;&ldquo;Capture node screenshot&rdquo;<br />
              5. Upload to Canva or post directly
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, overflow: 'auto', padding: '40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center', marginBottom: '-200px' }}>
            {ASSET_COMPONENTS[active]}
          </div>
        </div>
      </div>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
    </div>
  )
}
