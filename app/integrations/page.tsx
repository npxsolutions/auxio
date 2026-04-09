'use client'

import Link from 'next/link'

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Blog',          href: '/blog' },
  { label: 'About',        href: '/about' },
]

const CHANNELS = [
  {
    category: 'Marketplaces',
    items: [
      { name: 'eBay',         status: 'live',    desc: 'UK, US, DE, AU — list, sync stock and orders in real time', color: '#FFE500', textColor: '#191919' },
      { name: 'Amazon',       status: 'live',    desc: 'FBA, FBM, and Seller Fulfilled Prime support', color: '#FF9900', textColor: '#191919' },
      { name: 'Etsy',         status: 'live',    desc: 'Handmade, vintage, and craft product listings', color: '#F56400', textColor: 'white' },
      { name: 'OnBuy',        status: 'live',    desc: 'UK-focused marketplace for fast-growing sellers', color: '#003087', textColor: 'white' },
      { name: 'Walmart',      status: 'beta',    desc: 'US marketplace for approved sellers', color: '#0071CE', textColor: 'white' },
      { name: 'TikTok Shop',  status: 'live',    desc: 'Social commerce with direct checkout in-app', color: '#191919', textColor: 'white' },
    ],
  },
  {
    category: 'Ecommerce Platforms',
    items: [
      { name: 'Shopify',       status: 'live',    desc: 'Full two-way sync: products, orders, inventory', color: '#96BF48', textColor: 'white' },
      { name: 'WooCommerce',   status: 'live',    desc: 'WordPress-native store integration', color: '#7F54B3', textColor: 'white' },
      { name: 'BigCommerce',   status: 'live',    desc: 'Mid-market store management and sync', color: '#34313F', textColor: 'white' },
    ],
  },
  {
    category: 'Advertising',
    items: [
      { name: 'Google Shopping', status: 'live',    desc: 'Optimised product feed for Shopping and Performance Max', color: '#4285F4', textColor: 'white' },
      { name: 'Facebook Ads',    status: 'live',    desc: 'Dynamic product catalogue for retargeting and prospecting', color: '#1877F2', textColor: 'white' },
      { name: 'TikTok Ads',      status: 'beta',    desc: 'Product catalogue for TikTok Shopping ads', color: '#191919', textColor: 'white' },
    ],
  },
  {
    category: 'Coming Soon',
    items: [
      { name: 'Zalando',    status: 'soon', desc: 'Europe\'s leading fashion marketplace', color: '#FF6900', textColor: 'white' },
      { name: 'Wayfair',    status: 'soon', desc: 'Home goods and furniture marketplace', color: '#7B2D8B', textColor: 'white' },
      { name: 'Not On The High Street', status: 'soon', desc: 'Premium UK marketplace for independent sellers', color: '#B40068', textColor: 'white' },
      { name: 'ASOS Marketplace', status: 'soon', desc: 'Fashion-forward UK marketplace', color: '#191919', textColor: 'white' },
    ],
  },
]

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  live:  { bg: '#dcfce7', color: '#16a34a', label: 'Live' },
  beta:  { bg: '#fef9c3', color: '#854d0e', label: 'Beta' },
  soon:  { bg: '#f1f5f9', color: '#64748b', label: 'Coming soon' },
}

export default function IntegrationsPage() {
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
            <Link key={n.href} href={n.href} style={{ fontSize: '14px', color: n.href === '/integrations' ? '#5b52f5' : '#64748b', textDecoration: 'none', fontWeight: n.href === '/integrations' ? 500 : 400 }}>{n.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Start free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center', background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)', borderBottom: '1px solid #f1f1ef' }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: 'rgba(91,82,245,0.08)', border: '1px solid rgba(91,82,245,0.15)', fontSize: '12px', color: '#5b52f5', fontWeight: 600, marginBottom: '20px', letterSpacing: '0.02em' }}>
          INTEGRATIONS
        </div>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 20px', color: '#0f172a' }}>
          Connect every channel<br />you sell on
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '520px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          Auxio integrates with the marketplaces, stores, and ad platforms where your customers are. One platform, every channel.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/signup" style={{ padding: '14px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', color: 'white', fontSize: '15px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 24px rgba(91,82,245,0.35)' }}>Start connecting →</Link>
          <Link href="/contact" style={{ padding: '14px 28px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#374151', fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>Request an integration</Link>
        </div>
      </div>

      {/* Integration grid */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
        {CHANNELS.map(group => (
          <div key={group.category} style={{ marginBottom: '64px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.01em' }}>{group.category}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {group.items.map(ch => {
                const s = STATUS_STYLE[ch.status]
                return (
                  <div key={ch.name} style={{ border: '1px solid #e8e8e5', borderRadius: '12px', padding: '20px', transition: 'box-shadow 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: ch.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: ch.textColor, flexShrink: 0 }}>
                          {ch.name[0]}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{ch.name}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{ch.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Request integration */}
        <div style={{ background: 'linear-gradient(135deg, rgba(91,82,245,0.06), rgba(124,106,247,0.06))', border: '1px solid rgba(91,82,245,0.15)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Don't see your platform?</h3>
          <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px' }}>We add new integrations every month. Tell us what you need and we'll prioritise it.</p>
          <Link href="/contact" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '8px', background: '#0f172a', color: 'white', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Request integration →</Link>
        </div>
      </div>

      {/* How connection works */}
      <div style={{ background: '#fafafa', borderTop: '1px solid #f1f1ef', borderBottom: '1px solid #f1f1ef', padding: '80px 48px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '16px' }}>Connected in under 2 minutes</h2>
          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '48px' }}>No developer needed. No API keys. No complex setup. Just OAuth and you're live.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {[
              { step: '1', title: 'Click Connect', desc: 'Find your channel in Settings → Channels and click Connect.' },
              { step: '2', title: 'Authorise', desc: 'Log in to your eBay, Amazon, or Shopify account. Auxio gets read/write access.' },
              { step: '3', title: 'Start listing', desc: 'Your channel is live. Create a listing and publish to it in one click.' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '18px', margin: '0 auto 16px' }}>{s.step}</div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{s.title}</h4>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
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
