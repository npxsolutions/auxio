import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Amazon Multichannel Listing Software — Global Sellers | Palvento',
  description: 'Sync your Amazon listings to eBay, Shopify, and OnBuy with Palvento. Track true profit after Amazon fees, automate repricing, and manage all orders in one place — across US, UK, EU, and AU marketplaces.',
  keywords: ['Amazon listing software', 'Amazon multichannel software', 'Amazon eBay sync', 'sell on Amazon tool', 'global Amazon seller software', 'Amazon SP-API multichannel'],
}

const NAV = [
  { label: 'Features', href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing', href: '/pricing' },
]

const FEATURES = [
  { icon: '🔄', title: 'List once, publish everywhere', desc: 'Create a product in Palvento and publish to Amazon, eBay, Shopify, and OnBuy simultaneously. One update, all channels.' },
  { icon: '📊', title: 'Amazon fee-aware profit', desc: 'Referral fees, FBA fulfilment, advertising spend — Palvento deducts them all so you see actual margin per ASIN, not just revenue.' },
  { icon: '⚡', title: 'Real-time inventory sync', desc: 'A sale on eBay instantly decrements your Amazon inventory. Avoid suspension-risking oversells on either channel.' },
  { icon: '🤖', title: 'AI listing optimisation', desc: 'Generate Amazon-compliant titles, bullet points, and descriptions following A9 best practices — keyword-rich, search-ready.' },
  { icon: '📈', title: 'Profit-floor repricing', desc: 'Stay competitive in the Buy Box without racing to zero. Set a minimum margin and let Palvento reprice within those bounds.' },
  { icon: '📦', title: 'Unified order management', desc: 'Amazon, eBay, and Shopify orders in one inbox. Bulk-print labels for USPS, Royal Mail, DHL, Australia Post and more, update tracking, handle returns — without switching tabs.' },
]

const FAQS = [
  { q: 'Does Palvento work with multiple Amazon marketplaces?', a: 'Yes. We support Amazon.com, Amazon.co.uk, Amazon.de, Amazon.fr, Amazon.it, Amazon.es, Amazon.ca, and Amazon.com.au out of the box. Additional marketplaces (JP, MX, BR) are on the roadmap for late 2026.' },
  { q: 'Does it work with FBA or only FBM?', a: 'Both. Palvento reads your FBA inventory levels from Amazon and factors FBA fulfilment fees into profit calculations automatically.' },
  { q: 'Can I import my existing Amazon catalogue?', a: 'Yes. When you connect Amazon, Palvento imports your existing ASINs, listings, and inventory levels. Nothing is overwritten until you tell us to.' },
  { q: 'What Amazon fees does profit tracking include?', a: 'Referral fees, FBA fulfilment fees (if applicable), and advertising spend you log manually or via the Ads API connection. We are working on Ads API auto-import.' },
  { q: 'Is there a risk to my Amazon account?', a: 'No. Palvento uses Amazon\'s official Selling Partner API (SP-API) with authorised credentials. We operate within Amazon\'s terms of service.' },
  { q: 'What\'s the price?', a: 'Plans start at $149/month including Amazon, eBay, and Shopify. Billing available in USD, GBP, EUR, AUD or CAD. See full pricing at palvento.io/pricing. 14-day free trial, no card required.' },
]

export default function AmazonIntegrationPage() {
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
            <span style={{ fontSize: '16px' }}>📦</span> Amazon Integration
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'white', marginBottom: '24px' }}>
            Amazon + eBay + Shopify.<br />
            <span style={{ color: '#a3e635' }}>One dashboard, one truth.</span>
          </h1>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '40px', maxWidth: '680px', margin: '0 auto 40px' }}>
            Stop switching between Seller Central and eBay. Manage every channel, see true profit on every order, and let AI optimise your listings — all from Palvento.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/signup" style={{ padding: '14px 28px', borderRadius: '8px', background: '#a3e635', color: '#0f172a', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>Start free — no card needed →</Link>
            <Link href="/contact" style={{ padding: '14px 28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>Book a demo</Link>
          </div>
          <p style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>14-day free trial · No credit card · Official Amazon SP-API</p>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '12px', color: '#0f172a' }}>Everything Amazon sellers need</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '16px', marginBottom: '48px' }}>Connect Amazon once. Then never think about switching tabs again.</p>
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

      {/* Channels strip */}
      <div style={{ background: '#f7f3eb', borderTop: '1px solid #ede9e0', borderBottom: '1px solid #ede9e0', padding: '48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>All channels connected to the same dashboard</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['📦', 'Amazon'], ['🛒', 'eBay'], ['🛍️', 'Shopify'], ['🏪', 'OnBuy'], ['🎨', 'Etsy'], ['🌐', 'WooCommerce']].map(([icon, name]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'white', border: '1px solid #e8e8e5', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                <span>{icon}</span> {name}
              </div>
            ))}
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
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '16px' }}>Connect Amazon and eBay today</h2>
        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.75)', marginBottom: '32px' }}>14 days free. No credit card. Cancel any time.</p>
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
