'use client'

// V2 — Editorial / Stripe-narrative scrollytelling
// Influences: stripe.com (long-form narrative, weight-300 display), vercel.com (restraint),
// linear.app (precision), editorial magazines (pull-quotes, alternating rhythm).
// Warm white #fafaf8, single accent purple #5b52f5, alternating dark/light sections.

import { useEffect, useState } from 'react'
import Link from 'next/link'

const C = {
  warmWhite:   '#fafaf8',
  paper:       '#f4f2ec',
  ink:         '#0f0e13',
  inkSoft:     '#1a1814',
  mute:        '#6b6864',
  muteSoft:    '#9a968f',
  rule:        'rgba(15,14,19,0.08)',
  ruleDark:    'rgba(255,255,255,0.08)',
  purple:      '#5b52f5',
  purpleSoft:  '#7c6af7',
  purpleTint:  'rgba(91,82,245,0.08)',
  cream:       '#f5f0e8',
  text50:      'rgba(255,255,255,0.55)',
  text30:      'rgba(255,255,255,0.32)',
}

const NAV = [
  { label: 'Product',      href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Blog',         href: '/blog' },
  { label: 'About',        href: '/about' },
]

const MARKETPLACES = [
  'eBay', 'Amazon US', 'Amazon UK', 'Amazon DE', 'Amazon FR', 'Amazon IT',
  'Amazon ES', 'Amazon CA', 'Amazon AU', 'Amazon JP', 'Shopify', 'Etsy',
  'Walmart', 'OnBuy', 'TikTok Shop', 'Mercado Libre', 'WooCommerce',
  'Facebook Marketplace', 'Rakuten', 'Cdiscount', 'Bol.com', 'Allegro',
]

const PILLARS = [
  {
    kicker: '01 — Inventory',
    title: 'One truth across every channel.',
    body: 'The moment a unit sells on eBay UK, the listing on Amazon DE decrements. So does Shopify, so does Walmart, so does the warehouse shelf. A single ledger, recalculated in milliseconds, that treats your stock the way a bank treats money — as something that must balance, everywhere, always. No more overselling. No more three-hour reconciliations at the end of the month. No more apologising to customers for an item you never had.',
    bullets: ['Real-time multichannel sync', 'Bundle & kit awareness', 'Warehouse + 3PL location logic', 'FBA, FBM, and self-fulfilled together'],
  },
  {
    kicker: '02 — Orders',
    title: 'Every order, every market, one queue.',
    body: 'Orders arrive in the currency of the marketplace they were placed on — dollars, pounds, euros, yen, Australian and Canadian dollars — and land in one unified inbox with the exchange already applied. Routing rules pick the right warehouse. Carrier selection picks the cheapest label. Packing slips, VAT invoices, and customs forms generate themselves. You ship. The system handles the rest.',
    bullets: ['5-currency ledger, USD home base', 'Rule-driven routing & carrier selection', 'Automatic VAT & customs docs', 'SLA tracking across marketplaces'],
  },
  {
    kicker: '03 — Procurement',
    title: 'The loop that closes itself.',
    body: 'Ninety days of real sales velocity become a forecast. The forecast becomes a reorder alert. The alert becomes a purchase order, sent to the right supplier, in their preferred format. Goods arrive, you scan, stock updates across every channel. The entire procurement cycle — from predicted demand to live listing — happens without a spreadsheet touching the process. Stockouts become a rounding error.',
    bullets: ['Velocity-based demand forecasting', 'Multi-supplier PO automation', 'Landed-cost capture on receipt', 'Lead-time aware reorder points'],
  },
  {
    kicker: '04 — Profit',
    title: 'The number behind the number.',
    body: 'Revenue is what your marketplace dashboard shows you. Profit is what is left after referral fees, FBA fees, shipping, packaging, COGS, VAT, advertising spend, returns, and refunds. Meridia subtracts all of it, on every order, in real time — and tells you your true net margin by SKU, by channel, by country, by month. Most sellers find they are making half of what they thought. The other half is where we pay for ourselves.',
    bullets: ['True net margin per SKU & channel', 'Ad spend attribution (Sponsored Ads, TikTok)', 'Return & refund leakage tracking', 'FX-aware P&L across 5 currencies'],
  },
]

const COMPETITORS = [
  {
    name: 'ChannelAdvisor',
    body: 'Enterprise-only, quote-gated, implementation measured in quarters. Powerful for nine-figure retailers who can afford a dedicated ops team to run it. Everyone else finds themselves paying six figures a year for features they never deploy and a contract that renews before they notice. Meridia is what channel management looks like when it is built for operators, not procurement departments.',
  },
  {
    name: 'Linnworks',
    body: 'The UK workhorse — capable at listing and order management, thin everywhere else. No native P&L, no procurement loop, no forecasting worth the name, and the price has climbed year over year without the product moving with it. Sellers arriving at Meridia from Linnworks describe the transition the same way: same money, an order of magnitude more platform.',
  },
  {
    name: 'Brightpearl',
    body: 'Built for retailers with a brick-and-mortar heritage and an ERP mindset. Heavy implementation, heavier price tag, and a UI that feels like a finance system with a commerce skin. Meridia is the inverse — commerce-native, operator-built, with the accounting rigour arriving as a natural consequence of tracking every order from the first currency to the last fee.',
  },
  {
    name: 'Feedonomics',
    body: 'A feed management specialist — excellent at pushing product data outward, silent on everything that happens after the sale. You still need an inventory system, an order system, a procurement system, and a P&L. Meridia is the single platform those four tools stop being necessary to string together.',
  },
]

const PLANS = [
  { name: 'Starter',  price: 59,  tag: 'For the first 1,000 orders a month.', features: ['Up to 2 channels', '1,000 orders/mo', 'Real-time inventory', 'Basic P&L', 'Email support'] },
  { name: 'Growth',   price: 159, tag: 'The operating system most sellers settle on.', highlight: true, features: ['Unlimited channels', '10,000 orders/mo', 'Procurement & forecasting', 'True net margin P&L', 'Priority support'] },
  { name: 'Scale',    price: 499, tag: 'Founding price — locks for life.', features: ['Unlimited everything', 'Dedicated success manager', 'Custom rules engine', 'API + webhooks', 'White-glove migration'] },
]

// ── Mock: Dashboard card ─────────────────────────────────────────────────────
function DashboardMock() {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: `1px solid ${C.rule}`,
      boxShadow: '0 30px 80px rgba(15,14,19,0.12), 0 8px 24px rgba(15,14,19,0.06)',
      overflow: 'hidden', fontSize: 13,
    }}>
      {/* chrome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C.rule}`, background: C.paper }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <span style={{ marginLeft: 16, color: C.mute, fontSize: 12 }}>auxio.app / operations</span>
      </div>
      {/* body */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 420 }}>
        <aside style={{ borderRight: `1px solid ${C.rule}`, padding: 18, fontSize: 13, color: C.mute }}>
          <div style={{ fontWeight: 600, color: C.ink, marginBottom: 14, letterSpacing: '-0.01em' }}>Meridia</div>
          {['Operations', 'Inventory', 'Orders', 'Procurement', 'Financials', 'Advertising', 'Settings'].map((l, i) => (
            <div key={l} style={{
              padding: '7px 10px', marginLeft: -10, marginRight: -6, borderRadius: 7,
              background: i === 0 ? C.purpleTint : 'transparent',
              color: i === 0 ? C.purple : C.mute, fontWeight: i === 0 ? 600 : 400,
              marginBottom: 2,
            }}>{l}</div>
          ))}
        </aside>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em' }}>Today</div>
              <div style={{ fontSize: 12, color: C.mute, marginTop: 2 }}>Sunday, 13 April — 14:22 UTC</div>
            </div>
            <div style={{ display: 'flex', gap: 6, fontSize: 11, fontWeight: 500 }}>
              {['$', '£', '€', 'A$', 'C$'].map((c, i) => (
                <span key={c} style={{
                  padding: '4px 9px', borderRadius: 999,
                  background: i === 0 ? C.ink : C.paper,
                  color: i === 0 ? '#fff' : C.mute,
                }}>{c}</span>
              ))}
            </div>
          </div>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { l: 'Revenue',    v: '$48,210', d: '+12.4%' },
              { l: 'Orders',     v: '1,284',    d: '+8.1%' },
              { l: 'Net margin', v: '24.6%',    d: '+3.2 pp' },
              { l: 'Stockouts',  v: '0',        d: '—' },
            ].map(k => (
              <div key={k.l} style={{ border: `1px solid ${C.rule}`, borderRadius: 9, padding: '11px 13px' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.mute }}>{k.l}</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: C.ink, marginTop: 4, letterSpacing: '-0.01em' }}>{k.v}</div>
                <div style={{ fontSize: 11, color: C.purple, marginTop: 2 }}>{k.d}</div>
              </div>
            ))}
          </div>
          {/* Recent orders */}
          <div style={{ border: `1px solid ${C.rule}`, borderRadius: 9, overflow: 'hidden' }}>
            <div style={{ padding: '10px 13px', borderBottom: `1px solid ${C.rule}`, fontSize: 11, color: C.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent orders</div>
            {[
              { ch: 'Amazon UK',      sku: 'WXR-2214-BLK', tot: '£42.00',   usd: '$52.74', st: 'Shipped' },
              { ch: 'eBay US',        sku: 'WXR-1180-RED', tot: '$38.99',   usd: '$38.99', st: 'Label' },
              { ch: 'Shopify EU',     sku: 'GRV-0901-NAT', tot: '€67.50',   usd: '$72.19', st: 'Picked' },
              { ch: 'Amazon AU',      sku: 'WXR-2214-BLK', tot: 'A$79.00',  usd: '$51.05', st: 'Shipped' },
              { ch: 'TikTok Shop',    sku: 'TWL-3301-GRY', tot: '$24.00',   usd: '$24.00', st: 'New' },
              { ch: 'Amazon CA',      sku: 'GRV-0901-NAT', tot: 'C$88.00',  usd: '$63.83', st: 'Picked' },
            ].map((o, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.8fr 0.8fr 0.7fr', padding: '10px 13px', borderTop: i === 0 ? 'none' : `1px solid ${C.rule}`, fontSize: 12.5, alignItems: 'center' }}>
                <div style={{ color: C.ink, fontWeight: 500 }}>{o.ch}</div>
                <div style={{ color: C.mute, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11.5 }}>{o.sku}</div>
                <div style={{ color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{o.tot}</div>
                <div style={{ color: C.mute, fontVariantNumeric: 'tabular-nums' }}>{o.usd}</div>
                <div><span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: o.st === 'New' ? C.purpleTint : C.paper, color: o.st === 'New' ? C.purple : C.mute }}>{o.st}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Mock: Inventory snippet ──────────────────────────────────────────────────
function InventoryMock() {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.rule}`, boxShadow: '0 20px 50px rgba(15,14,19,0.08)', padding: 18, fontSize: 12.5 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.mute, marginBottom: 10 }}>SKU · WXR-2214-BLK</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em', marginBottom: 14 }}>428 units · synced</div>
      {[
        { ch: 'eBay UK',      n: 128, bar: 0.95 },
        { ch: 'Amazon US',    n: 128, bar: 0.95 },
        { ch: 'Shopify',      n: 128, bar: 0.95 },
        { ch: 'Walmart US',   n: 44,  bar: 0.35 },
      ].map(r => (
        <div key={r.ch} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 40px', alignItems: 'center', gap: 10, margin: '8px 0' }}>
          <div style={{ color: C.mute }}>{r.ch}</div>
          <div style={{ height: 5, background: C.paper, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${r.bar * 100}%`, height: '100%', background: C.purple }} />
          </div>
          <div style={{ textAlign: 'right', color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{r.n}</div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: C.purple, marginTop: 12 }}>◉ Last sync 0.2s ago</div>
    </div>
  )
}

function OrdersMock() {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.rule}`, boxShadow: '0 20px 50px rgba(15,14,19,0.08)', padding: 18, fontSize: 12.5 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.mute, marginBottom: 12 }}>Unified inbox</div>
      {[
        { fl: '🇬🇧', id: '#A-28401', cur: '£42.00',  usd: '$52.74' },
        { fl: '🇺🇸', id: '#E-11802', cur: '$38.99',  usd: '$38.99' },
        { fl: '🇩🇪', id: '#S-00914', cur: '€67.50',  usd: '$72.19' },
        { fl: '🇦🇺', id: '#A-79330', cur: 'A$79.00', usd: '$51.05' },
        { fl: '🇨🇦', id: '#A-88201', cur: 'C$88.00', usd: '$63.83' },
      ].map((o, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: i === 0 ? 'none' : `1px solid ${C.rule}` }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 14 }}>{o.fl}</span>
            <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11.5, color: C.mute }}>{o.id}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: C.ink }}>{o.cur}</span>
            <span style={{ color: C.muteSoft }}>{o.usd}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProcurementMock() {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.rule}`, boxShadow: '0 20px 50px rgba(15,14,19,0.08)', padding: 18, fontSize: 12.5 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.mute, marginBottom: 10 }}>Reorder forecast · 30 days</div>
      <svg viewBox="0 0 280 90" style={{ width: '100%', height: 90 }}>
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={C.purple} stopOpacity="0.25" />
            <stop offset="100%" stopColor={C.purple} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,70 L28,60 L56,62 L84,48 L112,52 L140,38 L168,42 L196,28 L224,32 L252,22 L280,18 L280,90 L0,90 Z" fill="url(#g1)" />
        <path d="M0,70 L28,60 L56,62 L84,48 L112,52 L140,38 L168,42 L196,28 L224,32 L252,22 L280,18" stroke={C.purple} strokeWidth="1.5" fill="none" />
        <line x1="0" y1="54" x2="280" y2="54" stroke={C.rule} strokeDasharray="2 3" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: C.mute }}>
        <span>Velocity: 14.2 u/day</span>
        <span>Reorder in <span style={{ color: C.purple, fontWeight: 600 }}>6 days</span></span>
      </div>
      <div style={{ marginTop: 12, padding: '10px 12px', background: C.purpleTint, borderRadius: 8, fontSize: 12, color: C.ink }}>
        <span style={{ color: C.purple, fontWeight: 600 }}>PO-2041</span> — 600 units drafted to Shenzhen Trading Co.
      </div>
    </div>
  )
}

function ProfitMock() {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.rule}`, boxShadow: '0 20px 50px rgba(15,14,19,0.08)', padding: 18, fontSize: 12.5 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.mute, marginBottom: 10 }}>Order #A-28401 · true margin</div>
      {[
        { l: 'Gross revenue',    v: '$52.74', c: C.ink },
        { l: 'Amazon fee (15%)', v: '−$7.91', c: C.mute },
        { l: 'FBA fulfilment',   v: '−$4.20', c: C.mute },
        { l: 'COGS',             v: '−$18.00', c: C.mute },
        { l: 'Postage & pack',   v: '−$2.10', c: C.mute },
        { l: 'VAT',              v: '−$8.79', c: C.mute },
      ].map(r => (
        <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.rule}`, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color: C.mute }}>{r.l}</span>
          <span style={{ color: r.c }}>{r.v}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 }}>
        <span style={{ color: C.ink, fontWeight: 600 }}>Net profit</span>
        <span style={{ color: C.purple, fontWeight: 600, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>$11.74 · 22.3%</span>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LandingV2() {
  const [navScrolled, setNavScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pillarMocks = [<InventoryMock key="i" />, <OrdersMock key="o" />, <ProcurementMock key="pr" />, <ProfitMock key="p" />]

  return (
    <div style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif', background: C.warmWhite, color: C.inkSoft, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: navScrolled ? 'rgba(250,250,248,0.82)' : 'transparent',
        backdropFilter: navScrolled ? 'saturate(180%) blur(14px)' : 'none',
        borderBottom: navScrolled ? `1px solid ${C.rule}` : '1px solid transparent',
        transition: 'background 0.2s, border 0.2s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontSize: 20, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em', textDecoration: 'none' }}>Meridia</Link>
          <div style={{ display: 'flex', gap: 34, fontSize: 14, color: C.mute }}>
            {NAV.map(n => (
              <Link key={n.href} href={n.href} style={{ color: C.inkSoft, textDecoration: 'none' }}>{n.label}</Link>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{
              fontSize: 14, fontWeight: 500, color: '#fff', background: C.ink,
              padding: '9px 16px', borderRadius: 999, textDecoration: 'none',
            }}>Start free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 28px 80px' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.purple, fontWeight: 600, marginBottom: 28 }}>
          Commerce operations platform
        </div>
        <h1 style={{
          fontSize: 'clamp(44px, 7.2vw, 104px)', fontWeight: 300,
          color: C.ink, letterSpacing: '-0.035em', lineHeight: 1.02, margin: 0,
        }}>
          Every marketplace.<br />
          Every currency.<br />
          <span style={{ color: C.purple }}>One platform.</span>
        </h1>
        <p style={{ fontSize: 21, lineHeight: 1.55, color: C.mute, maxWidth: 680, marginTop: 38, fontWeight: 400 }}>
          Meridia is the operating layer for modern multichannel sellers — a single system of record for inventory, orders, procurement, and profit across eBay, Amazon, Shopify, Walmart, OnBuy, Etsy, TikTok Shop, and the two dozen other places your customers already buy. Five currencies reconciled in a single ledger. Ten-thousand orders a day in one queue. The entire back office, operated as one business instead of five.
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 40, flexWrap: 'wrap' }}>
          <Link href="/signup" style={{
            background: C.ink, color: '#fff', padding: '16px 28px', borderRadius: 999,
            fontSize: 15, fontWeight: 500, textDecoration: 'none',
            boxShadow: '0 4px 18px rgba(15,14,19,0.18)',
          }}>Start free — no card required</Link>
          <Link href="/contact" style={{
            background: 'transparent', color: C.ink, padding: '16px 24px', borderRadius: 999,
            fontSize: 15, fontWeight: 500, textDecoration: 'none',
            border: `1px solid ${C.rule}`,
          }}>Talk to the team →</Link>
        </div>
      </section>

      {/* ── Marketplace marquee ───────────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}`, padding: '28px 0', overflow: 'hidden', background: C.paper }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: C.mute, textAlign: 'center', marginBottom: 22, fontWeight: 600 }}>
          Selling on 24 marketplaces across 5 currencies
        </div>
        <div style={{
          display: 'flex', gap: 48, whiteSpace: 'nowrap', animation: 'auxio-marquee 60s linear infinite',
          fontSize: 15, color: C.inkSoft, fontWeight: 500,
        }}>
          {[...MARKETPLACES, ...MARKETPLACES].map((m, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.purple, opacity: 0.6 }} />
              {m}
            </span>
          ))}
        </div>
        <style>{`@keyframes auxio-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </section>

      {/* ── Story 1: The problem (dark) ───────────────────────────────────── */}
      <section style={{ background: C.ink, color: '#fff', padding: '140px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.purpleSoft, fontWeight: 600, marginBottom: 28 }}>
            The problem
          </div>
          <h2 style={{ fontSize: 'clamp(36px, 5.2vw, 68px)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.08, margin: 0 }}>
            Selling on five marketplaces is <span style={{ color: C.purpleSoft }}>five businesses</span> pretending to be one. Five inventory systems. Five P&Ls. Five truths.
          </h2>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: C.text50, marginTop: 36, maxWidth: 720 }}>
            The seller with a hundred SKUs on four channels has not built a multichannel business — they have built four single-channel businesses held together by spreadsheets, browser tabs, and the forbearance of a very patient operations manager. Stock drifts out of sync. Orders arrive in currencies nobody has converted. Marketplace fees quietly eat the margin nobody has calculated. The dashboard of each platform confidently reports a revenue number that, when you add the others to it, does not actually describe the business you are running.
          </p>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: C.text50, marginTop: 22, maxWidth: 720 }}>
            The tools that were meant to solve this — listings software, order management, ERP bolt-ons — each fix one seam while leaving the others open. You end up paying four vendors to half-solve one problem, and still reconciling at the end of the month by hand.
          </p>
        </div>
      </section>

      {/* ── Story 2: The platform (light) ─────────────────────────────────── */}
      <section style={{ padding: '140px 28px 120px', background: C.warmWhite }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.purple, fontWeight: 600, marginBottom: 28 }}>
            The platform
          </div>
          <h2 style={{ fontSize: 'clamp(36px, 5.2vw, 68px)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.08, margin: 0, maxWidth: 900, color: C.ink }}>
            One ledger. One queue. One number at the bottom of the page.
          </h2>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: C.mute, marginTop: 32, maxWidth: 680 }}>
            Meridia collapses four categories of software — channel management, order management, procurement, and financial analytics — into a single platform with one data model underneath. Everything you sell, everywhere you sell it, in the currency it arrived in and the currency it reports in. Below is what an operations home screen looks like when the whole business finally agrees with itself.
          </p>
          <div style={{ marginTop: 60 }}>
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* ── Pillars ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '60px 28px 120px', background: C.warmWhite }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {PILLARS.map((p, i) => {
            const right = i % 2 === 1
            return (
              <div key={p.kicker} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center',
                padding: '80px 0', borderTop: i === 0 ? 'none' : `1px solid ${C.rule}`,
              }}>
                <div style={{ order: right ? 2 : 1 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.purple, fontWeight: 600, marginBottom: 18 }}>
                    {p.kicker}
                  </div>
                  <h3 style={{ fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 300, letterSpacing: '-0.025em', lineHeight: 1.1, color: C.ink, margin: 0 }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: 17, lineHeight: 1.65, color: C.mute, marginTop: 22 }}>{p.body}</p>
                  <ul style={{ listStyle: 'none', padding: 0, marginTop: 26, display: 'grid', gap: 10 }}>
                    {p.bullets.map(b => (
                      <li key={b} style={{ fontSize: 14.5, color: C.inkSoft, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ width: 14, height: 1, background: C.purple }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ order: right ? 1 : 2 }}>{pillarMocks[i]}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Pull quote (dark) ─────────────────────────────────────────────── */}
      <section style={{ background: C.inkSoft, color: '#fff', padding: '160px 28px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 80, color: C.purpleSoft, lineHeight: 0.5, fontFamily: 'Georgia, serif', marginBottom: 20 }}>&ldquo;</div>
          <blockquote style={{ margin: 0, fontSize: 'clamp(28px, 3.8vw, 46px)', fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.28 }}>
            We ran eight years of a thirty-person operation on spreadsheets and four browser tabs. Inside a quarter of switching to Meridia our stockout rate fell by eighty percent and we discovered our real net margin was eleven points higher than the one we had been planning the business around. It is the first piece of software we have bought that changed how the company thinks, not just what the team does on a Tuesday.
          </blockquote>
          <div style={{ marginTop: 44, fontSize: 14, color: C.text50, letterSpacing: '0.04em' }}>
            PRIYA K. — HEAD OF OPERATIONS, HEALTH & BEAUTY · 500+ SKUs · FIVE CHANNELS
          </div>
        </div>
      </section>

      {/* ── Comparison ────────────────────────────────────────────────────── */}
      <section style={{ padding: '140px 28px', background: C.warmWhite }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.purple, fontWeight: 600, marginBottom: 24 }}>
            Why teams switch
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4.4vw, 56px)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0, maxWidth: 840, color: C.ink }}>
            A short honest word about the incumbents.
          </h2>
          <div style={{ marginTop: 70, display: 'grid', gap: 1, background: C.rule, border: `1px solid ${C.rule}`, borderRadius: 14, overflow: 'hidden' }}>
            {COMPETITORS.map(c => (
              <div key={c.name} style={{ background: '#fff', padding: '44px 40px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 40 }}>
                <div style={{ fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em' }}>{c.name}</div>
                <div style={{ fontSize: 16.5, lineHeight: 1.65, color: C.mute }}>{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 28px', background: C.paper }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.purple, fontWeight: 600, marginBottom: 20 }}>
              Pricing
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4.4vw, 56px)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0, color: C.ink }}>
              One platform. Three simple tiers.
            </h2>
            <p style={{ fontSize: 17, color: C.mute, marginTop: 18 }}>USD shown. Toggle to GBP, EUR, AUD, or CAD on the full pricing page.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {PLANS.map(p => (
              <div key={p.name} style={{
                background: '#fff', borderRadius: 16,
                border: p.highlight ? `1.5px solid ${C.purple}` : `1px solid ${C.rule}`,
                padding: 36, position: 'relative',
                boxShadow: p.highlight ? '0 20px 50px rgba(91,82,245,0.14)' : '0 6px 20px rgba(15,14,19,0.04)',
              }}>
                {p.highlight && (
                  <div style={{ position: 'absolute', top: -11, left: 36, background: C.purple, color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, letterSpacing: '0.06em' }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em' }}>{p.name}</div>
                <div style={{ fontSize: 13, color: C.mute, marginTop: 4 }}>{p.tag}</div>
                <div style={{ fontSize: 48, fontWeight: 300, color: C.ink, letterSpacing: '-0.03em', marginTop: 26, display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontSize: 24, color: C.mute }}>$</span>{p.price}
                  <span style={{ fontSize: 14, color: C.mute, fontWeight: 400, marginLeft: 4 }}>/ month</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'grid', gap: 10 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: 14, color: C.inkSoft, display: 'flex', gap: 10 }}>
                      <span style={{ color: C.purple }}>◦</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{
                  display: 'block', textAlign: 'center', marginTop: 28,
                  padding: '13px 18px', borderRadius: 999, textDecoration: 'none',
                  background: p.highlight ? C.ink : 'transparent',
                  color: p.highlight ? '#fff' : C.ink,
                  border: p.highlight ? 'none' : `1px solid ${C.rule}`,
                  fontSize: 14, fontWeight: 500,
                }}>Start free</Link>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/pricing" style={{ fontSize: 14, color: C.purple, textDecoration: 'none', fontWeight: 500 }}>See full pricing in GBP, EUR, AUD, CAD →</Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA (gradient) ──────────────────────────────────────────── */}
      <section style={{
        padding: '160px 28px',
        background: `radial-gradient(ellipse at 30% 0%, ${C.purple} 0%, #2b1e7a 40%, ${C.ink} 85%)`,
        color: '#fff', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(40px, 6vw, 84px)', fontWeight: 300, letterSpacing: '-0.035em', lineHeight: 1.04, margin: 0 }}>
            Run every marketplace<br />like a single business.
          </h2>
          <p style={{ fontSize: 19, color: C.text50, marginTop: 32, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Ten minutes to connect your first channel. Fourteen days on the house. No credit card, no onboarding call, no implementation project — just the platform, your data, and a number at the bottom of the page you can finally trust.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 44, flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              background: '#fff', color: C.ink, padding: '17px 32px', borderRadius: 999,
              fontSize: 15, fontWeight: 500, textDecoration: 'none',
            }}>Start free</Link>
            <Link href="/contact" style={{
              background: 'transparent', color: '#fff', padding: '17px 28px', borderRadius: 999,
              fontSize: 15, fontWeight: 500, textDecoration: 'none',
              border: `1px solid ${C.ruleDark}`,
            }}>Book a demo</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ background: C.ink, color: C.text50, padding: '60px 28px 40px', borderTop: `1px solid ${C.ruleDark}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, fontSize: 13 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 16, letterSpacing: '-0.02em' }}>Meridia</div>
          <div style={{ display: 'flex', gap: 28 }}>
            <Link href="/features" style={{ color: C.text50, textDecoration: 'none' }}>Product</Link>
            <Link href="/pricing" style={{ color: C.text50, textDecoration: 'none' }}>Pricing</Link>
            <Link href="/integrations" style={{ color: C.text50, textDecoration: 'none' }}>Integrations</Link>
            <Link href="/blog" style={{ color: C.text50, textDecoration: 'none' }}>Blog</Link>
            <Link href="/about" style={{ color: C.text50, textDecoration: 'none' }}>About</Link>
            <Link href="/privacy" style={{ color: C.text50, textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ color: C.text50, textDecoration: 'none' }}>Terms</Link>
          </div>
          <div style={{ color: C.text30 }}>© 2026 Meridia. Every marketplace. One platform.</div>
        </div>
      </footer>
    </div>
  )
}
