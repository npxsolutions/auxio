'use client'

import Link from 'next/link'

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'About',        href: '/about' },
]

const FEATURES = [
  {
    tag: 'Listings',
    headline: 'Create once. Publish to every channel.',
    body: 'Write a product listing one time and push it to eBay, Amazon, Shopify, TikTok Shop, and more — simultaneously. Auxio handles format differences, title character limits, required attributes, and category mapping for every platform automatically.',
    bullets: [
      'Channel-specific formatting applied automatically',
      'Bulk CSV import with intelligent column mapping',
      'Per-channel title, description and attribute rules',
      'Draft, schedule, or publish instantly',
    ],
    visual: 'listing',
    flip: false,
  },
  {
    tag: 'AI Agent',
    headline: 'Your listings, written and optimised by AI.',
    body: "Auxio's AI Agent writes channel-specific titles, bullet points, and descriptions trained on each platform's ranking signals. eBay keywords, Amazon A9 bullet points, Shopify brand copy — generated in seconds, not hours.",
    bullets: [
      'eBay: keyword-rich titles within 80-character limit',
      'Amazon: A9-optimised bullet points and descriptions',
      'Shopify: brand-focused, conversion-led copy',
      'One-click apply or review before publishing',
    ],
    visual: 'ai',
    flip: true,
  },
  {
    tag: 'Feed Rules',
    headline: 'Transform listings automatically at publish time.',
    body: 'Set conditional rules that fire when you publish. Auto-adjust prices, reformat titles, append keywords, remap categories, and fill missing attributes — per channel, without touching each listing manually.',
    bullets: [
      'IF/THEN rules per channel or globally',
      'Price adjustment rules (margin-based, channel markup)',
      'Title transformation (append keywords, trim, replace)',
      'Auto-categorisation based on product attributes',
    ],
    visual: 'rules',
    flip: false,
  },
  {
    tag: 'True Profit',
    headline: 'Revenue is vanity. Profit is sanity.',
    body: 'See the actual profit on every order after every cost — channel fees, FBA fees, shipping, ad spend, returns. Know which channels make money and which are quietly burning it.',
    bullets: [
      'Real profit per order, per channel, per product',
      'Channel fee deduction (eBay, Amazon, Shopify, etc.)',
      'Shipping and fulfilment cost tracking',
      'Profit trend dashboard and export',
    ],
    visual: 'profit',
    flip: true,
  },
  {
    tag: 'Inventory',
    headline: 'One stock level, synced everywhere in real time.',
    body: "Sell one unit on eBay, and your Shopify and Amazon quantities update instantly. Buffer rules protect you from overselling during peak periods. Set safety thresholds per channel so you're never caught short.",
    bullets: [
      'Real-time sync across all connected channels',
      'Channel-level buffer rules and safety stock',
      'Low stock alerts and reorder triggers',
      'Bundle and variant tracking',
    ],
    visual: 'inventory',
    flip: false,
  },
  {
    tag: 'Error Hub',
    headline: "Fix listing errors before they go live.",
    body: "Auxio's Error Hub flags every issue blocking a listing from going live — missing images, title too long, required category attributes empty, price below minimum. Fix in one place, republish in one click.",
    bullets: [
      'Per-channel error breakdown',
      'Missing attribute detection with suggested fixes',
      'Platform policy violation alerts',
      'Bulk error resolution tools',
    ],
    visual: 'errors',
    flip: true,
  },
  {
    tag: 'Social Intelligence',
    headline: 'See what content is winning in your niche.',
    body: "Scrape top-performing content from TikTok, Instagram, and YouTube for any keyword. Analyse hook patterns, content formats, and audience signals. Get AI-generated recommendations on what to create next.",
    bullets: [
      'Scrape TikTok, Instagram, YouTube by keyword',
      'Hook pattern analysis with engagement data',
      'Audience insight extraction from comments',
      'AI content recommendations based on real data',
    ],
    visual: 'social',
    flip: false,
  },
]

const VISUAL_MOCKUPS: Record<string, React.ReactNode> = {
  listing: (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e8e8e5', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Listing Preview</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {['eBay', 'Amazon', 'Shopify', 'TikTok Shop'].map((ch, i) => (
          <div key={ch} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: ['#FFE500', '#FF9900', '#96BF48', '#000'][i], color: ['#191919','white','white','white'][i] }}>{ch}</div>
        ))}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '6px' }}>Nike Air Max 90 — UK 10 — Triple White</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[['Price','£89.99'],['Stock','3 units'],['Status','✓ Live'],['Views','247']].map(([l,v]) => (
          <div key={l} style={{ background: '#f7f7f5', borderRadius: '6px', padding: '8px 10px' }}>
            <div style={{ fontSize: '10px', color: '#9b9b98', marginBottom: '2px' }}>{l}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  ),
  ai: (
    <div style={{ background: '#0f1117', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>AI Agent · Generating eBay title…</div>
      <div style={{ background: 'rgba(91,82,245,0.1)', border: '1px solid rgba(91,82,245,0.2)', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: '#a89ef8', marginBottom: '4px' }}>eBay Title (79/80 chars)</div>
        <div style={{ fontSize: '12px', color: '#f0f0f8', lineHeight: 1.5 }}>Nike Air Max 90 Triple White UK 10 Mens Trainers Sneakers 2024 Brand New OG</div>
      </div>
      <div style={{ background: 'rgba(255,153,0,0.08)', border: '1px solid rgba(255,153,0,0.2)', borderRadius: '8px', padding: '12px' }}>
        <div style={{ fontSize: '11px', color: '#fbbf24', marginBottom: '4px' }}>Amazon Bullet 1</div>
        <div style={{ fontSize: '12px', color: '#f0f0f8', lineHeight: 1.5 }}>ICONIC DESIGN: Classic Air Max 90 silhouette in all-white colourway with visible Air cushioning unit for all-day comfort</div>
      </div>
    </div>
  ),
  rules: (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e8e8e5' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feed Rule · eBay Pricing</div>
      {[
        { if: 'Channel = eBay', then: 'Price × 1.08', color: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' },
        { if: 'Stock < 2', then: 'Price × 1.15', color: '#fef9c3', border: '#fde047', text: '#854d0e' },
        { if: 'Category = Footwear', then: 'Append "Brand New" to title', color: '#dcfce7', border: '#86efac', text: '#166534' },
      ].map((r, i) => (
        <div key={i} style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ padding: '6px 10px', background: r.color, border: `1px solid ${r.border}`, borderRadius: '6px', fontSize: '11px', color: r.text, fontWeight: 500, flex: 1 }}>IF {r.if}</div>
          <div style={{ fontSize: '12px', color: '#9b9b98' }}>→</div>
          <div style={{ padding: '6px 10px', background: '#f7f7f5', border: '1px solid #e8e8e5', borderRadius: '6px', fontSize: '11px', color: '#191919', fontWeight: 500, flex: 1 }}>THEN {r.then}</div>
        </div>
      ))}
    </div>
  ),
  profit: (
    <div style={{ background: '#0f1117', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>Profit breakdown · Last 30 days</div>
      {[
        { label: 'Revenue',       value: '£12,840', color: '#f0f0f8' },
        { label: 'Channel fees',  value: '− £1,284', color: '#f87171' },
        { label: 'Shipping',      value: '− £962',   color: '#f87171' },
        { label: 'Ad spend',      value: '− £744',   color: '#f87171' },
        { label: 'COGS',          value: '− £6,420', color: '#f87171' },
        { label: 'True profit',   value: '£3,430', color: '#34d399' },
      ].map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: i === 5 ? '1px solid rgba(255,255,255,0.1)' : 'none', marginTop: i === 5 ? '4px' : 0 }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{r.label}</span>
          <span style={{ fontSize: i === 5 ? '14px' : '12px', fontWeight: i === 5 ? 700 : 500, color: r.color }}>{r.value}</span>
        </div>
      ))}
    </div>
  ),
  inventory: (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e8e8e5' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stock Sync · Live</div>
      {[
        { product: 'Air Max 90 UK10', total: 3, ch: [3, 3, 2], status: 'ok' },
        { product: 'Ultraboost UK9',  total: 1, ch: [1, 1, 0], status: 'low' },
        { product: 'New Balance UK11',total: 5, ch: [5, 5, 4], status: 'ok' },
      ].map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 2 ? '1px solid #f1f1ef' : 'none' }}>
          <div style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: '#191919' }}>{row.product}</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['eBay','AMZ','SFY'].map((ch, j) => (
              <div key={ch} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: row.ch[j] > 0 ? '#dcfce7' : '#fce8e6', color: row.ch[j] > 0 ? '#166534' : '#c9372c' }}>{ch} {row.ch[j]}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
  errors: (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e8e8e5' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Error Hub · 3 issues</div>
      {[
        { ch: 'Amazon', err: 'Missing bullet points (3 required)', sev: 'high' },
        { ch: 'eBay',   err: 'Title exceeds 80 characters by 12', sev: 'med' },
        { ch: 'Shopify',err: 'No images attached to listing',     sev: 'high' },
      ].map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px', borderRadius: '6px', background: e.sev === 'high' ? '#fef2f2' : '#fffbeb', border: `1px solid ${e.sev === 'high' ? '#fecaca' : '#fde68a'}`, marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: e.sev === 'high' ? '#dc2626' : '#d97706', marginTop: '1px', textTransform: 'uppercase' }}>{e.ch}</div>
          <div style={{ fontSize: '11px', color: '#374151', flex: 1 }}>{e.err}</div>
        </div>
      ))}
    </div>
  ),
  social: (
    <div style={{ background: '#0f1117', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>Top hook · "ecom shoes" · TikTok</div>
      <div style={{ marginBottom: '10px' }}>
        {[
          { cat: 'curiosity', hook: 'Nobody talks about this margin killer…', eng: '8.4%', color: '#a78bfa' },
          { cat: 'benefit',   hook: 'How I 3x\'d my eBay sales in 30 days',   eng: '7.1%', color: '#34d399' },
          { cat: 'problem',   hook: 'Stop wasting money on Amazon PPC',        eng: '6.8%', color: '#f87171' },
        ].map((h, i) => (
          <div key={i} style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: h.color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: '11px', color: '#f0f0f8' }}>{h.hook}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: h.color }}>{h.eng}</div>
          </div>
        ))}
      </div>
    </div>
  ),
}

export default function FeaturesPage() {
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
            <Link key={n.href} href={n.href} style={{ fontSize: '14px', color: n.href === '/features' ? '#5b52f5' : '#64748b', textDecoration: 'none', fontWeight: n.href === '/features' ? 500 : 400 }}>{n.label}</Link>
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
          PRODUCT FEATURES
        </div>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 20px', color: '#0f172a' }}>
          Everything you need to<br />sell smarter, not harder
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          From first listing to every marketplace — Auxio handles the complexity so you can focus on finding product.
        </p>
        <Link href="/signup" style={{ display: 'inline-block', padding: '14px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', color: 'white', fontSize: '15px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 24px rgba(91,82,245,0.35)' }}>
          Start free — no card required →
        </Link>
      </div>

      {/* Feature sections */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
        {FEATURES.map((f, i) => (
          <div key={f.tag} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', marginBottom: i < FEATURES.length - 1 ? '120px' : 0, direction: f.flip ? 'rtl' : 'ltr' }}>
            <div style={{ direction: 'ltr' }}>
              <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', background: 'rgba(91,82,245,0.08)', fontSize: '11px', fontWeight: 700, color: '#5b52f5', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>{f.tag}</div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '16px', lineHeight: 1.2 }}>{f.headline}</h2>
              <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.7, marginBottom: '24px' }}>{f.body}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {f.bullets.map(b => (
                  <li key={b} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px', fontSize: '14px', color: '#374151' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                      <circle cx="8" cy="8" r="7" fill="#dcfce7"/><path d="M5 8l2.5 2.5L11 5.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ direction: 'ltr' }}>
              {VISUAL_MOCKUPS[f.visual]}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ background: '#0f172a', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '40px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '16px' }}>Ready to simplify your multichannel selling?</h2>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>Join sellers already using Auxio to list faster, profit clearly, and grow without the chaos.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/signup" style={{ padding: '14px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', color: 'white', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>Start free trial →</Link>
          <Link href="/pricing" style={{ padding: '14px 28px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>View pricing</Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2026 Auxio. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Privacy', '/privacy'], ['Features', '/features'], ['Pricing', '/pricing'], ['Login', '/login']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
    </div>
  )
}
