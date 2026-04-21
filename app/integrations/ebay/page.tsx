import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'eBay Listing Software for Global Sellers | Palvento',
  description: 'Connect your eBay store to Palvento and list products in minutes. Sync inventory, track true profit, and use AI to write better listings — built for eBay sellers worldwide, across eBay.com, eBay.co.uk, eBay.de, eBay.com.au and more.',
  keywords: ['eBay listing software', 'eBay inventory management', 'eBay multichannel software', 'sell on eBay', 'global eBay seller tool', 'eBay Cassini optimization'],
}

const NAV = [
  { label: 'Features', href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing', href: '/pricing' },
]

const STEPS = [
  { n: '1', title: 'Connect your eBay account', desc: 'OAuth in 60 seconds. No API keys, no developer setup. Just click "Connect eBay" and authorise access.' },
  { n: '2', title: 'Import your listings', desc: 'Palvento pulls in your existing eBay listings, prices, and stock levels automatically. Your data stays intact.' },
  { n: '3', title: 'List everywhere, manage from one place', desc: 'Publish the same product to Amazon, Shopify, and OnBuy from a single screen. One update syncs to all channels.' },
]

const FEATURES = [
  { icon: '📊', title: 'True profit per eBay order', desc: 'After eBay fees, payment processing, postage, COGS, and sales tax/VAT — see what you actually made on every sale, not just the sale price.' },
  { icon: '🤖', title: 'AI listing writer', desc: 'Generate eBay-optimised titles and descriptions that follow Cassini best practices — structured data, keyword placement, condition notes.' },
  { icon: '🔄', title: 'Real-time stock sync', desc: 'Sell one unit on Amazon and your eBay quantity drops instantly. No overselling, no manual updates.' },
  { icon: '⚠️', title: 'Error detection', desc: 'Palvento watches your eBay listings 24/7 and flags ended listings, policy violations, and suppressed items before they cost you sales.' },
  { icon: '📦', title: 'Order management', desc: 'eBay orders land in one unified inbox alongside Amazon and Shopify orders. Print labels, mark dispatched, track returns.' },
  { icon: '📈', title: 'Fee-aware repricing', desc: 'Automatically adjust eBay prices to stay competitive while protecting your margin floor — factoring in eBay fees, not just sale price.' },
]

const FAQS = [
  { q: 'Which eBay marketplaces does Palvento support?', a: 'All major eBay sites — eBay.com (US), eBay.co.uk, eBay.de, eBay.fr, eBay.it, eBay.es, eBay.com.au, eBay.ca and more. We handle region-specific categories, sales tax / VAT calculation, and carrier integrations for each market (USPS, Royal Mail, DHL, Australia Post, Canada Post).' },
  { q: 'Will Palvento interfere with my existing eBay listings?', a: 'No. When you connect, we read your existing listings and import them. We only make changes when you explicitly tell us to — we never modify or end listings without your instruction.' },
  { q: 'Does it work with eBay Promoted Listings?', a: 'We sync your organic listing data. Promoted Listings management is on our roadmap for Q3 2026.' },
  { q: 'Can I use Palvento just for eBay and nothing else?', a: 'Absolutely. Many sellers start with eBay only and expand to other channels over time. There is no requirement to connect multiple channels.' },
  { q: 'How does the profit tracking work?', a: 'We pull your order data from eBay (sale price, shipping charged), combine it with your product cost and postage settings, and deduct the actual eBay final value fees. The result is your true profit on every transaction.' },
  { q: 'Is there a free trial?', a: 'Yes — 14 days free, no credit card required. You can connect eBay, import your listings, and see your profit dashboard before paying anything.' },
]

export default function EbayIntegrationPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0f172a' }}>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8e5', padding: '0 48px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #e8863f, #e8863f)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>A</div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>Palvento</span>
        </Link>
        <div style={{ display: 'flex', gap: '32px' }}>
          {NAV.map(n => <Link key={n.href} href={n.href} style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none' }}>{n.label}</Link>)}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Start free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: '#09090b', paddingTop: '100px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 48px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginBottom: '24px' }}>
            <span style={{ fontSize: '16px' }}>🛒</span> eBay Integration
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'white', marginBottom: '24px' }}>
            The eBay listing tool<br />
            <span style={{ color: '#a3e635' }}>built for multichannel sellers</span>
          </h1>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '40px', maxWidth: '680px', margin: '0 auto 40px' }}>
            Connect your eBay store in 60 seconds. Track true profit after all fees, sync inventory across every channel, and use AI to write listings that actually sell.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/signup" style={{ padding: '14px 28px', borderRadius: '8px', background: '#a3e635', color: '#0f172a', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>Start free — no card needed →</Link>
            <Link href="/contact" style={{ padding: '14px 28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>Book a demo</Link>
          </div>
          <p style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>14-day free trial · No credit card · Dedicated support</p>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: '#fafaf9', borderTop: '1px solid #f1f1ef', padding: '80px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '48px', color: '#0f172a' }}>Connect eBay in 3 steps</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #e8863f, #e8863f)', color: 'white', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{s.n}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '12px', color: '#0f172a' }}>Everything eBay sellers need</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '16px', marginBottom: '48px' }}>Built from scratch for how eBay actually works — across every major marketplace.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ padding: '28px', border: '1px solid #e8e8e5', borderRadius: '14px' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Profit calculator callout */}
      <div style={{ background: '#09090b', padding: '80px 48px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>$</div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Know your real eBay profit
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '32px' }}>
            Most eBay sellers think they're making 20% margin. After eBay final value fees (10–15%), payment processing (2.9%), shipping, packaging, and COGS — the real number is often half that. Palvento shows you the actual figure on every order.
          </p>
          <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
            {[['Sale price', '$55.00'], ['eBay fees', '−$7.15'], ['Postage', '−$4.85'], ['Packaging', '−$0.60'], ['COGS', '−$22.00'], ['True profit', '$20.40']].map(([label, val]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: label === 'True profit' ? '#a3e635' : 'white' }}>{val}</div>
              </div>
            ))}
          </div>
          <Link href="/signup" style={{ display: 'inline-block', padding: '14px 28px', borderRadius: '8px', background: '#a3e635', color: '#0f172a', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>See your real profit →</Link>
        </div>
      </div>

      {/* vs competitors */}
      <div style={{ background: '#fafaf9', padding: '80px 48px', borderTop: '1px solid #f1f1ef' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '12px', color: '#0f172a' }}>How Palvento compares for eBay sellers</h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '15px', marginBottom: '40px' }}>vs Linnworks, ChannelAdvisor, and selling manually</p>
          <div style={{ border: '1px solid #e8e8e5', borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: 'white' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Feature</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, color: '#a3e635' }}>Palvento</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Linnworks</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>ChannelAdvisor</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['True profit tracking (after all fees)', '✓', '✗', '✗'],
                  ['AI listing writer', '✓', '✗', 'Enterprise'],
                  ['Built for independent multichannel sellers', '✓', '✗', '✗'],
                  ['OnBuy integration', '✓', '✗', '✗'],
                  ['Social intelligence', '✓', '✗', '✗'],
                  ['Starting price', '$149/mo', '$549+/mo', '$2,500+/mo'],
                  ['Free trial (no card)', '✓', '✗', '✗'],
                  ['Self-serve setup', '✓', '✗', '✗'],
                ].map(([feat, a, l, b], i) => (
                  <tr key={feat} style={{ borderTop: '1px solid #f1f1ef', background: i % 2 === 0 ? 'white' : '#fafaf9' }}>
                    <td style={{ padding: '13px 20px', color: '#374151', fontWeight: 500 }}>{feat}</td>
                    <td style={{ padding: '13px 20px', textAlign: 'center', color: a === '✓' ? '#16a34a' : '#64748b', fontWeight: a === '✓' ? 700 : 400 }}>{a}</td>
                    <td style={{ padding: '13px 20px', textAlign: 'center', color: l === '✓' ? '#16a34a' : '#64748b' }}>{l}</td>
                    <td style={{ padding: '13px 20px', textAlign: 'center', color: b === '✓' ? '#16a34a' : '#64748b' }}>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
            <Link href="/vs/linnworks" style={{ fontSize: '14px', color: '#e8863f', textDecoration: 'none', fontWeight: 500 }}>Palvento vs Linnworks →</Link>
            <span style={{ color: '#e2e8f0' }}>|</span>
            <Link href="/vs/channelAdvisor" style={{ fontSize: '14px', color: '#e8863f', textDecoration: 'none', fontWeight: 500 }}>Palvento vs ChannelAdvisor →</Link>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '48px', color: '#0f172a' }}>Frequently asked questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#f1f1ef', borderRadius: '14px', overflow: 'hidden' }}>
          {FAQS.map(f => (
            <div key={f.q} style={{ background: 'white', padding: '24px 28px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{f.q}</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, #e8863f, #e8863f)', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '16px' }}>Start selling smarter on eBay</h2>
        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.75)', marginBottom: '32px' }}>14 days free. Connect your eBay store in 60 seconds.</p>
        <Link href="/signup" style={{ display: 'inline-block', padding: '16px 32px', borderRadius: '8px', background: 'white', color: '#e8863f', fontSize: '16px', fontWeight: 700, textDecoration: 'none' }}>Get started free →</Link>
      </div>

      <footer style={{ background: '#0f172a', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2026 Palvento. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Integrations', '/integrations'], ['Pricing', '/pricing'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
    </div>
  )
}
