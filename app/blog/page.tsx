import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Multichannel Selling Guides for Global Sellers | Auxio',
  description: 'Practical guides on selling on eBay, Amazon, Shopify, and OnBuy worldwide. Profit tracking, listing optimisation, and multichannel strategy for sellers in the US, UK, EU, and beyond.',
}

const NAV = [
  { label: 'Features', href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing', href: '/pricing' },
]

const POSTS = [
  {
    slug: 'multichannel-inventory-management-software-uk',
    category: "Buyer's Guide",
    title: 'Best Multichannel Inventory Management Software for Global Sellers (2026)',
    excerpt: 'Auxio, Linnworks, Brightpearl, ChannelAdvisor, Feedonomics, and Veeqo — compared honestly. Real pricing, real feature gaps, and who each tool is actually built for.',
    date: '13 April 2026',
    readTime: '12 min',
    featured: true,
  },
  {
    slug: 'what-is-a-commerce-operations-platform',
    category: 'Explainer',
    title: 'What Is a Commerce Operations Platform? (2026 Definition)',
    excerpt: 'The term replacing "multichannel tool" and "order management system". What it means, what it includes, and why it commands a premium acquisition multiple.',
    date: '13 April 2026',
    readTime: '8 min',
    featured: true,
  },
  {
    slug: 'linnworks-alternative',
    category: 'Comparison',
    title: 'The Best Linnworks Alternative for Global Sellers in 2026',
    excerpt: 'Linnworks starts at $549/mo with a 40-day onboarding project. Here\'s what to switch to — and how the migration actually works.',
    date: '12 April 2026',
    readTime: '9 min',
    featured: false,
  },
  {
    slug: 'how-to-calculate-true-profit-ecommerce',
    category: 'Profit Tracking',
    title: 'How to Calculate True Ecommerce Profit (Not Just Revenue)',
    excerpt: 'The complete formula: selling price minus every fee, COGS, postage, sales tax/VAT, and ad spend. With worked examples for eBay, Amazon FBA, and Shopify.',
    date: '11 April 2026',
    readTime: '10 min',
    featured: false,
  },
  {
    slug: 'true-profit-ebay-uk',
    category: 'Profit Tracking',
    title: 'The true cost of selling on eBay worldwide in 2026 (and how to calculate your real profit)',
    excerpt: 'Most eBay sellers overestimate their margin by 30–40%. Here\'s every fee you need to account for — and a formula to calculate what you actually made on each sale.',
    date: '7 April 2026',
    readTime: '7 min',
    featured: false,
  },
  {
    slug: 'multichannel-selling-uk-guide',
    category: 'Strategy',
    title: 'How to sell on eBay, Amazon, and Shopify at the same time without losing your mind',
    excerpt: 'A step-by-step guide to setting up multichannel selling as an independent seller — without needing enterprise software or a warehouse team.',
    date: '3 April 2026',
    readTime: '9 min',
    featured: false,
  },
  {
    slug: 'onbuy-guide-uk-sellers',
    category: 'Channels',
    title: 'OnBuy for multichannel sellers: is it worth it in 2026?',
    excerpt: 'OnBuy charges lower commission than eBay and Amazon. We analyse whether it\'s worth adding as a channel — including real fee comparisons and category performance data.',
    date: '1 April 2026',
    readTime: '6 min',
    featured: false,
  },
  {
    slug: 'ebay-listing-title-guide',
    category: 'Listing Optimisation',
    title: 'How to write eBay titles that rank in Cassini search (with examples)',
    excerpt: 'eBay\'s Cassini search algorithm rewards structured, keyword-rich titles. Here\'s the exact formula used by top-selling accounts — and how to apply it at scale.',
    date: '28 March 2026',
    readTime: '5 min',
    featured: false,
  },
  {
    slug: 'amazon-fees-uk-breakdown',
    category: 'Profit Tracking',
    title: 'Every Amazon fee explained — referral, FBA, closing, and advertising',
    excerpt: 'A complete breakdown of what Amazon takes from each sale in 2026, by category, across US / UK / EU marketplaces. Includes a free profit calculator template.',
    date: '25 March 2026',
    readTime: '8 min',
    featured: false,
  },
  {
    slug: 'best-multichannel-software-uk',
    category: 'Comparisons',
    title: 'Best multichannel selling software for global sellers in 2026',
    excerpt: 'Comparing Auxio, Linnworks, ChannelAdvisor, Brightpearl, and Feedonomics on price, features, and support. An honest review from sellers who\'ve used all of them.',
    date: '20 March 2026',
    readTime: '11 min',
    featured: false,
  },
]

const CATEGORIES = ['All', 'Strategy', 'Profit Tracking', 'Channels', 'Listing Optimisation', 'Comparisons']

export default function BlogPage() {
  const [featured, rest] = [POSTS.filter(p => p.featured), POSTS.filter(p => !p.featured)]

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0f172a' }}>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8e5', padding: '0 48px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>A</div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>Auxio</span>
        </Link>
        <div style={{ display: 'flex', gap: '32px' }}>
          {NAV.map(n => <Link key={n.href} href={n.href} style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none' }}>{n.label}</Link>)}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Start free →</Link>
        </div>
      </nav>

      {/* Header */}
      <div style={{ paddingTop: '100px', paddingBottom: '48px', maxWidth: '1100px', margin: '0 auto', padding: '100px 48px 48px' }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: 'rgba(91,82,245,0.08)', border: '1px solid rgba(91,82,245,0.15)', fontSize: '12px', color: '#5b52f5', fontWeight: 600, marginBottom: '16px' }}>
          THE BLOG
        </div>
        <h1 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: '12px' }}>
          Sell smarter. Keep more.
        </h1>
        <p style={{ fontSize: '17px', color: '#64748b', lineHeight: 1.7, maxWidth: '600px' }}>
          Practical guides for multichannel sellers — profit tracking, eBay and Amazon optimisation, and honest tool comparisons.
        </p>
      </div>

      {/* Categories */}
      <div style={{ borderTop: '1px solid #f1f1ef', borderBottom: '1px solid #f1f1ef', padding: '0 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '8px', padding: '12px 0', overflowX: 'auto' }}>
          {CATEGORIES.map((c, i) => (
            <div key={c} style={{ padding: '6px 14px', borderRadius: '20px', background: i === 0 ? '#0f172a' : 'transparent', border: i === 0 ? 'none' : '1px solid #e8e8e5', fontSize: '13px', color: i === 0 ? 'white' : '#64748b', fontWeight: i === 0 ? 600 : 400, cursor: 'pointer', flexShrink: 0 }}>{c}</div>
          ))}
        </div>
      </div>

      {/* Featured posts */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 48px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {featured.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block', padding: '32px', background: '#09090b', borderRadius: '16px', color: 'white' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>{post.category}</div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'white', lineHeight: 1.3, letterSpacing: '-0.01em', marginBottom: '12px' }}>{post.title}</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '20px' }}>{post.excerpt}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{post.date}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>·</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{post.readTime} read</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Rest of posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#f1f1ef', borderRadius: '14px', overflow: 'hidden', marginBottom: '80px' }}>
          {rest.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', background: 'white', gap: '24px' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#fafaf9'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'white'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{post.category}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4, marginBottom: '4px' }}>{post.title}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{post.excerpt}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{post.date}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{post.readTime} read</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Email signup */}
      <div style={{ background: '#f7f3eb', borderTop: '1px solid #ede9e0', padding: '64px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '10px' }}>Selling tips, every two weeks</h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>Practical guides for multichannel sellers. No fluff, no sales pitch. Unsubscribe any time.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="email" placeholder="your@email.com" style={{ flex: 1, padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
            <button style={{ padding: '11px 20px', borderRadius: '8px', background: '#0f172a', color: 'white', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Subscribe →</button>
          </div>
        </div>
      </div>

      <footer style={{ background: '#0f172a', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2026 Auxio. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Features', '/features'], ['Pricing', '/pricing'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } a:hover h3 { color: #5b52f5; }`}</style>
    </div>
  )
}
