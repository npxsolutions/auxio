import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Best Multichannel Inventory Management Software UK (2026) — Compared',
  description: 'Comparing the best multichannel inventory management software for UK sellers in 2026: Auxio, Linnworks, Brightpearl, Baselinker, and Veeqo. Real pricing, features, and honest assessments.',
  keywords: ['multichannel inventory management software UK', 'best inventory management software UK', 'inventory management for eBay and Amazon UK', 'multichannel ecommerce software UK 2026', 'Linnworks alternative UK'],
}

const TOOLS = [
  { name: 'Auxio', verdict: 'Best for UK sellers who want the full operations stack', price: 'From £49/mo', trial: true, ukFocus: true, aiBuiltIn: true, procurementLoop: true, trueProfit: true, highlight: true },
  { name: 'Linnworks', verdict: 'Established mid-market platform, strong warehouse management', price: '£449+/mo', trial: false, ukFocus: false, aiBuiltIn: false, procurementLoop: true, trueProfit: false, highlight: false },
  { name: 'Brightpearl by Sage', verdict: 'Powerful retail OS for larger operations — but expensive and slow to set up', price: 'Custom only', trial: false, ukFocus: true, aiBuiltIn: false, procurementLoop: true, trueProfit: false, highlight: false },
  { name: 'Baselinker', verdict: 'Cheapest option — good for listing sync, weak on P&L and procurement', price: 'From ~£19/mo', trial: true, ukFocus: false, aiBuiltIn: false, procurementLoop: false, trueProfit: false, highlight: false },
  { name: 'Veeqo (Amazon)', verdict: 'Free, shipping-focused — best if Amazon is your main channel', price: 'Free', trial: true, ukFocus: false, aiBuiltIn: false, procurementLoop: false, trueProfit: false, highlight: false },
]

export default function BlogPostPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fff', color: '#0f172a' }}>

      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '0 48px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', textDecoration: 'none' }}>Auxio</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/blog" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', padding: '7px 14px' }}>← All guides</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: '7px', background: '#5b52f5', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Start free →</Link>
        </div>
      </nav>

      <article style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 48px 96px' }}>

        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Buyer's Guide · 2026</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: '12px', marginBottom: '20px' }}>
            Best Multichannel Inventory Management Software for UK Sellers (2026)
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7, marginBottom: '16px' }}>
            If you sell on eBay, Amazon, Shopify, and OnBuy simultaneously, you need software that keeps inventory in sync across all of them — and ideally tells you your real profit margin after fees. We compared the six most-used platforms for UK multichannel sellers.
          </p>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#94a3b8' }}>
            <span>Updated April 2026</span>
            <span>·</span>
            <span>12 min read</span>
          </div>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px 24px', marginBottom: '40px' }}>
          <strong style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '12px', color: '#334155' }}>Quick summary</strong>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: '14px', color: '#475569', lineHeight: 1.9 }}>
            <li><strong>Best overall for UK sellers:</strong> Auxio — full operations stack, AI included, from £49/mo</li>
            <li><strong>Best for mid-market / high volume:</strong> Linnworks — established, strong WMS, from £449/mo</li>
            <li><strong>Best for larger retailers:</strong> Brightpearl by Sage — enterprise retail OS, custom pricing</li>
            <li><strong>Best budget option:</strong> Baselinker — cheap listing sync, limited analytics</li>
            <li><strong>Best if Amazon is your primary channel:</strong> Veeqo — free, Amazon-native</li>
          </ul>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '16px' }}>What to look for in multichannel inventory software</h2>
        <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '16px' }}>
          The term "multichannel inventory management" covers a broad spectrum of tools, from basic listing sync tools to full commerce operations platforms. For most UK sellers, you need at minimum:
        </p>
        <ul style={{ fontSize: '16px', color: '#334155', lineHeight: 1.9, paddingLeft: '24px', marginBottom: '32px' }}>
          <li><strong>Real-time inventory sync</strong> across every channel — when you sell one unit anywhere, all channels update instantly</li>
          <li><strong>Order management</strong> — a unified inbox for all your orders, regardless of which channel they came from</li>
          <li><strong>True profit tracking</strong> — revenue minus marketplace fees, postage, COGS, and VAT. Revenue alone is meaningless.</li>
          <li><strong>Demand forecasting</strong> — to prevent stockouts and avoid over-ordering on slow-moving SKUs</li>
          <li><strong>Rules and automation</strong> — to handle repricing, feed rules, and channel-specific data transformations without manual work</li>
        </ul>

        <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '24px' }}>The 5 best options compared</h2>

        {TOOLS.map((tool) => (
          <div key={tool.name} style={{ border: tool.highlight ? '2px solid #5b52f5' : '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px', position: 'relative' }}>
            {tool.highlight && <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#5b52f5', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>Editor's pick</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{tool.name}</h3>
              <span style={{ fontSize: '13px', fontWeight: 600, color: tool.highlight ? '#5b52f5' : '#64748b', background: tool.highlight ? '#ede9fe' : '#f1f5f9', padding: '3px 10px', borderRadius: '20px' }}>{tool.price}</span>
            </div>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>{tool.verdict}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                ['Free trial', tool.trial],
                ['UK-focused', tool.ukFocus],
                ['AI built-in', tool.aiBuiltIn],
                ['Procurement loop', tool.procurementLoop],
                ['True P&L', tool.trueProfit],
              ].map(([label, val]) => (
                <span key={label as string} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: val ? '#dcfce7' : '#fee2e2', color: val ? '#166534' : '#991b1b', fontWeight: 500 }}>
                  {val ? '✓' : '✗'} {label}
                </span>
              ))}
            </div>
          </div>
        ))}

        <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '16px', marginTop: '48px' }}>What makes Auxio different</h2>
        <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '16px' }}>
          Most multichannel tools solve half the problem: they sync inventory and pull in orders. But they stop short of the full operations picture. You still need separate tools for purchase orders, demand forecasting, P&amp;L reporting, and advertising tracking.
        </p>
        <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.8, marginBottom: '16px' }}>
          Auxio is built as a Commerce Operations Platform — the single layer that manages the entire loop from supplier purchase order to channel listing to net profit. It's what Linnworks and Brightpearl are evolving towards, but available to UK sellers from £49/month today, with a self-serve setup that takes under 10 minutes.
        </p>

        <div style={{ background: '#ede9fe', borderRadius: '10px', padding: '24px', marginTop: '40px', marginBottom: '48px' }}>
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>Try Auxio free for 14 days</strong>
          <p style={{ fontSize: '14px', color: '#4c1d95', margin: '0 0 16px', lineHeight: 1.6 }}>No credit card. Connect your first channel in under 10 minutes. See your real profit margin before you decide.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '7px', background: '#5b52f5', color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Start free trial →</Link>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px' }}>Related guides</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/vs/linnworks" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>Auxio vs Linnworks — full comparison →</Link>
            <Link href="/vs/brightpearl" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>Auxio vs Brightpearl — full comparison →</Link>
            <Link href="/blog/how-to-calculate-true-profit-ecommerce" style={{ fontSize: '14px', color: '#5b52f5', textDecoration: 'none' }}>How to calculate true ecommerce profit (not just revenue) →</Link>
          </div>
        </div>
      </article>
    </div>
  )
}
