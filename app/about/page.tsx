'use client'

import Link from 'next/link'

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'About',        href: '/about' },
]

const VALUES = [
  {
    icon: '⚡',
    title: 'Speed over complexity',
    desc: 'Enterprise tools make simple things hard. We believe you should be live on a new channel in under 10 minutes — not after a 6-week onboarding process.',
  },
  {
    icon: '🔍',
    title: 'Transparency first',
    desc: 'No custom quotes. No revenue share. No hidden fees. Our pricing is on the website, our profit numbers are real, and we tell you exactly what each channel costs you.',
  },
  {
    icon: '🇬🇧',
    title: 'Built for UK sellers',
    desc: "eBay UK, OnBuy, Royal Mail, UK VAT — we build for how UK sellers actually operate. Not a US product retrofitted with a pound sign.",
  },
  {
    icon: '🤖',
    title: 'AI that earns its place',
    desc: "We only add AI where it genuinely saves time. Channel-specific listing copy, hook analysis, profit forecasting — tools that do real work, not AI for AI's sake.",
  },
]

const TIMELINE = [
  { date: 'Jan 2026', event: 'Auxio founded — frustration with existing tools that cost too much and moved too slow.' },
  { date: 'Feb 2026', event: 'First eBay and Amazon integrations built and tested with 12 beta sellers.' },
  { date: 'Mar 2026', event: 'Shopify, WooCommerce, and feed rules engine added. AI listing agent launched.' },
  { date: 'Apr 2026', event: 'True profit tracking, Social Intelligence, and TikTok Shop integration shipped.' },
  { date: 'Now',      event: 'Opening to founding members. 50 spots at up to 40% off lifetime.' },
]

export default function AboutPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0f172a' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8e5', padding: '0 48px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>A</div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>Auxio</span>
        </Link>
        <div style={{ display: 'flex', gap: '32px' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{ fontSize: '14px', color: n.href === '/about' ? '#5b52f5' : '#64748b', textDecoration: 'none', fontWeight: n.href === '/about' ? 500 : 400 }}>{n.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Start free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: '140px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto', padding: '140px 48px 80px' }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: 'rgba(91,82,245,0.08)', border: '1px solid rgba(91,82,245,0.15)', fontSize: '12px', color: '#5b52f5', fontWeight: 600, marginBottom: '24px', letterSpacing: '0.02em' }}>
          OUR STORY
        </div>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '28px', color: '#0f172a' }}>
          We built the tool<br />we wished existed
        </h1>
        <p style={{ fontSize: '20px', color: '#64748b', lineHeight: 1.7, marginBottom: '20px' }}>
          Multichannel selling shouldn't require a team of specialists, a six-figure annual contract, or three months of onboarding. For most sellers, it requires one good platform — and none of the enterprise tools are built for them.
        </p>
        <p style={{ fontSize: '18px', color: '#64748b', lineHeight: 1.7 }}>
          Feedonomics costs more than most sellers make in profit. Rithum takes months to go live. Baselinker covers the basics but stops there. We looked at the tools available and saw a gap: a self-serve, AI-powered, genuinely affordable platform that treats UK sellers as the main character — not an afterthought.
        </p>
      </div>

      {/* Mission */}
      <div style={{ background: '#0f172a', padding: '80px 48px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '20px' }}>OUR MISSION</div>
          <blockquote style={{ fontSize: '32px', fontWeight: 800, color: 'white', lineHeight: 1.3, letterSpacing: '-0.02em', fontStyle: 'normal', margin: 0 }}>
            "To give independent sellers the same multichannel infrastructure that enterprise retailers have — without the enterprise price tag, the enterprise complexity, or the enterprise timeline."
          </blockquote>
        </div>
      </div>

      {/* Values */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '48px', textAlign: 'center' }}>What we believe</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {VALUES.map(v => (
            <div key={v.title} style={{ padding: '32px', border: '1px solid #e8e8e5', borderRadius: '16px' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>{v.icon}</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.01em' }}>{v.title}</h3>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.7 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: '#fafafa', borderTop: '1px solid #f1f1ef', borderBottom: '1px solid #f1f1ef', padding: '80px 48px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '48px', textAlign: 'center' }}>How we got here</h2>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '15px', top: '8px', bottom: '8px', width: '1px', background: '#e2e8f0' }} />
            {TIMELINE.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: '24px', marginBottom: '32px', paddingLeft: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: i === TIMELINE.length - 1 ? '#5b52f5' : 'white', border: `2px solid ${i === TIMELINE.length - 1 ? '#5b52f5' : '#e2e8f0'}`, flexShrink: 0, marginTop: '2px', position: 'relative', zIndex: 1 }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{t.date}</div>
                  <div style={{ fontSize: '15px', color: '#374151', lineHeight: 1.6 }}>{t.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '16px' }}>Want to be part of it?</h2>
        <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '32px', lineHeight: 1.7 }}>
          We're opening to founding members now. 50 spots at up to 40% off — for people who want to grow with us and help shape the product.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/signup" style={{ padding: '14px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', color: 'white', fontSize: '15px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 24px rgba(91,82,245,0.35)' }}>Claim founding rate →</Link>
          <Link href="/contact" style={{ padding: '14px 28px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#374151', fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>Get in touch</Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0f172a', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2026 Auxio. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Features', '/features'], ['Pricing', '/pricing'], ['Login', '/login']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
    </div>
  )
}
