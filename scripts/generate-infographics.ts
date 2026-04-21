/**
 * Generates 5 vertical LinkedIn infographics for Palvento:
 *
 *   01 — Feed rejections: 4 error types account for most rejections
 *   02 — Same SKU, 3 different margins (per-channel pricing)
 *   03 — 10 minutes vs 30–90 days (install speed vs enterprise tier)
 *   04 — The taxonomy problem (56k+ marketplace categories)
 *   05 — TikTok Shop isn't just fashion (5 non-fashion categories growing)
 *
 * Canvas: 1080×1350 (LinkedIn portrait, 4:5). Palette: v9 warm cream +
 * burnished orange. Outputs SVG (source) + PNG (LinkedIn-ready) to
 * public/marketing/infographics/.
 *
 * Usage: npx tsx scripts/generate-infographics.ts
 *
 * Honesty notes — where stats come from:
 *   01 rejection breakdown: internal audit of one operator (60 days / 417
 *      rejections). Labelled as such on the card.
 *   02 fee numbers: published marketplace fee schedules (Shopify 2.9%+1.39,
 *      eBay 12.9%+0.30, Amazon 15% referral + FBA). Computed on $48.
 *   03 10-min install: Palvento's own measurement (38 test installs). 30–90
 *      day comparison from published enterprise-tier onboarding docs.
 *   04 category counts: Amazon Browse Tree Guide (~30k nodes), eBay
 *      Taxonomy API (~18k), TikTok Shop Partner Centre (~8k).
 *   05 TikTok Shop category growth: Palvento operator-interview sample.
 *      Labelled as illustrative.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const OUT_DIR = join('public', 'marketing', 'infographics')

// ── Canvas + palette ──────────────────────────────────────────────────────
const W = 1080
const H = 1350

const C = {
  bg:      '#f8f4ec',
  surface: '#ffffff',
  raised:  '#fdfaf2',
  ink:     '#0b0f1a',
  muted:   '#5a6171',
  faint:   '#8b8e9d',
  accent:  '#e8863f',
  accentDk:'#c46f2a',
  accentSft:'rgba(232,134,63,0.12)',
  accentGlow:'rgba(232,134,63,0.28)',
  emerald: '#0e7c5a',
  amber:   '#b5651d',
  red:     '#b32718',
  rule:    'rgba(11,15,26,0.10)',
}

const sans = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace'

// ── Shared primitives ─────────────────────────────────────────────────────
function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Header block — eyebrow + chevron mark
function header(n: number, total: number, kind: string): string {
  return `
  <g>
    <text x="72" y="88" font-family="${mono}" font-size="22" fill="${C.faint}" letter-spacing="2.4" font-weight="500">PALVENTO · § ${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')} · ${kind.toUpperCase()}</text>
    <line x1="72" y1="108" x2="160" y2="108" stroke="${C.accent}" stroke-width="2"/>
    <g transform="translate(960 60)">
      <path d="M2 32 L18 4 L34 32 L27 32 L18 16.5 L9 32 Z" fill="${C.ink}"/>
      <rect x="13.5" y="25.5" width="9" height="3" rx="0.5" fill="${C.accent}"/>
    </g>
  </g>`
}

// Footer block — palvento.com + tagline
function footer(caption?: string): string {
  return `
  <g>
    ${caption ? `<text x="72" y="${H - 106}" font-family="${mono}" font-size="18" fill="${C.muted}" letter-spacing="0.6">${escXml(caption)}</text>` : ''}
    <line x1="72" y1="${H - 80}" x2="${W - 72}" y2="${H - 80}" stroke="${C.rule}" stroke-width="1"/>
    <g transform="translate(72 ${H - 54})">
      <path d="M0 26 L14 2 L28 26 L22 26 L14 12 L6 26 Z" fill="${C.ink}"/>
      <rect x="10.5" y="20.5" width="7" height="2.5" rx="0.4" fill="${C.accent}"/>
      <text x="40" y="22" font-family="${sans}" font-size="24" font-weight="600" fill="${C.ink}" letter-spacing="-0.4">palvento.com</text>
    </g>
    <text x="${W - 72}" y="${H - 36}" font-family="${mono}" font-size="14" fill="${C.faint}" text-anchor="end" letter-spacing="0.8">Multichannel feed management for Shopify-led sellers</text>
  </g>`
}

// ── 01 — Feed rejections ──────────────────────────────────────────────────
function feedRejections(): string {
  const errors = [
    { pct: 34, label: 'Missing GTIN',       detail: 'UPC / EAN / barcode format errors' },
    { pct: 22, label: 'Image too small',    detail: 'Below the marketplace pixel floor' },
    { pct: 15, label: 'Category mismatch',  detail: 'Wrong browse node / taxonomy' },
    { pct: 10, label: 'Banned words',       detail: '"Free", "guaranteed", claim copy' },
  ]
  const barStartY = 720
  const barH = 58
  const barGap = 18
  const barMax = W - 72 - 72
  const barLabelX = 72

  const bars = errors.map((e, i) => {
    const y = barStartY + i * (barH + barGap)
    const width = (e.pct / 50) * barMax // scale so 50% = full width
    return `
    <g>
      <rect x="${barLabelX}" y="${y}" width="${width}" height="${barH}" fill="${C.accent}" rx="6"/>
      <rect x="${barLabelX + width - 1}" y="${y}" width="1" height="${barH}" fill="${C.accentDk}"/>
      <text x="${barLabelX + 22}" y="${y + barH / 2 + 6}" font-family="${sans}" font-size="22" font-weight="500" fill="#ffffff" letter-spacing="-0.3">${escXml(e.label)}</text>
      <text x="${barLabelX + width + 16}" y="${y + 24}" font-family="${mono}" font-size="32" font-weight="500" fill="${C.ink}" letter-spacing="-0.6">${e.pct}%</text>
      <text x="${barLabelX + width + 16}" y="${y + 48}" font-family="${sans}" font-size="15" fill="${C.muted}" letter-spacing="-0.1">${escXml(e.detail)}</text>
    </g>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${header(1, 5, 'Insight')}
  <g>
    <text x="72" y="260" font-family="${sans}" font-size="92" font-weight="600" fill="${C.ink}" letter-spacing="-4">81%</text>
    <text x="72" y="360" font-family="${sans}" font-size="52" font-weight="600" fill="${C.ink}" letter-spacing="-1.8">of marketplace feed rejections</text>
    <text x="72" y="418" font-family="${sans}" font-size="52" font-weight="600" fill="${C.ink}" letter-spacing="-1.8">come from <tspan fill="${C.accent}">just four</tspan> error types.</text>
  </g>
  <text x="72" y="500" font-family="${sans}" font-size="22" fill="${C.muted}" letter-spacing="-0.3">Audit of one Shopify operator — 60 days, 417 rejections across Amazon, eBay &amp; TikTok Shop.</text>

  <g transform="translate(0 180)">
    ${bars}
  </g>

  <g transform="translate(72 ${H - 200})">
    <rect x="0" y="0" width="${W - 144}" height="76" rx="10" fill="${C.surface}" stroke="${C.rule}" stroke-width="1"/>
    <circle cx="30" cy="38" r="5" fill="${C.accent}"/>
    <text x="50" y="34" font-family="${mono}" font-size="12" font-weight="600" fill="${C.accent}" letter-spacing="1.4">PALVENTO CATCHES ALL FOUR AT INGEST</text>
    <text x="50" y="56" font-family="${sans}" font-size="18" fill="${C.ink}" letter-spacing="-0.2">Before the marketplace ever sees the feed — not after the listing gets suppressed.</text>
  </g>
  ${footer('Source: Palvento operator audit · 417 rejections · Q1 2026')}
</svg>`
}

// ── 02 — Same SKU, 3 different margins ────────────────────────────────────
function channelMargins(): string {
  const rows = [
    { ch: 'Shopify',         list: 48, fee: 2.78, net: 45.22, color: C.emerald, feeNote: '2.9% + $0.30' },
    { ch: 'eBay',            list: 48, fee: 6.49, net: 41.51, color: C.amber,   feeNote: '12.9% + $0.30' },
    { ch: 'Amazon (FBA)',    list: 48, fee: 10.80, net: 37.20, color: C.amber,  feeNote: '15% + $3.60 FBA' },
  ]
  const rowH = 150
  const startY = 680

  const cards = rows.map((r, i) => {
    const y = startY + i * (rowH + 18)
    const netWidth = (r.net / 48) * (W - 144 - 140)
    return `
    <g>
      <rect x="72" y="${y}" width="${W - 144}" height="${rowH - 18}" rx="12" fill="${C.surface}" stroke="${C.rule}" stroke-width="1"/>
      <text x="100" y="${y + 42}" font-family="${sans}" font-size="28" font-weight="600" fill="${C.ink}" letter-spacing="-0.4">${escXml(r.ch)}</text>
      <text x="100" y="${y + 72}" font-family="${mono}" font-size="16" fill="${C.muted}" letter-spacing="0.2">Fee · ${escXml(r.feeNote)} = $${r.fee.toFixed(2)}</text>
      <g transform="translate(100 ${y + 94})">
        <rect x="0" y="0" width="${W - 144 - 140}" height="22" rx="4" fill="${C.rule}"/>
        <rect x="0" y="0" width="${netWidth}" height="22" rx="4" fill="${r.color}"/>
      </g>
      <text x="${W - 72 - 20}" y="${y + 52}" font-family="${sans}" font-size="40" font-weight="600" fill="${C.ink}" text-anchor="end" letter-spacing="-1">$${r.net.toFixed(2)}</text>
      <text x="${W - 72 - 20}" y="${y + 82}" font-family="${mono}" font-size="14" fill="${C.muted}" text-anchor="end" letter-spacing="0.3">${((r.net / 48) * 100).toFixed(1)}% NET</text>
    </g>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${header(2, 5, 'Pricing')}
  <g>
    <text x="72" y="260" font-family="${sans}" font-size="64" font-weight="600" fill="${C.ink}" letter-spacing="-2.2">Same SKU.</text>
    <text x="72" y="330" font-family="${sans}" font-size="64" font-weight="600" fill="${C.accent}" letter-spacing="-2.2">Three different nets.</text>
  </g>
  <text x="72" y="420" font-family="${sans}" font-size="24" fill="${C.muted}" letter-spacing="-0.3">$48 list price. Same catalogue row. What you actually keep after fees, per channel:</text>
  <text x="72" y="540" font-family="${mono}" font-size="14" fill="${C.faint}" letter-spacing="1.6">FEE SOURCES · SHOPIFY + EBAY + AMAZON PUBLISHED 2026 RATES</text>

  ${cards}

  <g transform="translate(72 ${H - 200})">
    <rect x="0" y="0" width="${W - 144}" height="76" rx="10" fill="${C.accentSft}" stroke="${C.accent}" stroke-width="1"/>
    <circle cx="30" cy="38" r="5" fill="${C.accent}"/>
    <text x="50" y="34" font-family="${mono}" font-size="12" font-weight="600" fill="${C.accent}" letter-spacing="1.4">$8 PER-UNIT MARGIN GAP · AMAZON vs SHOPIFY</text>
    <text x="50" y="56" font-family="${sans}" font-size="18" fill="${C.ink}" letter-spacing="-0.2">Per-channel pricing floors close it. Set once, enforced at sync.</text>
  </g>
  ${footer('Sources: Shopify, eBay, Amazon FBA published 2026 fee schedules')}
</svg>`
}

// ── 03 — 10 minutes vs 30–90 days ─────────────────────────────────────────
function installSpeed(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${header(3, 5, 'Install')}
  <g>
    <text x="72" y="260" font-family="${sans}" font-size="56" font-weight="600" fill="${C.ink}" letter-spacing="-1.8">From Shopify install to</text>
    <text x="72" y="322" font-family="${sans}" font-size="56" font-weight="600" fill="${C.ink}" letter-spacing="-1.8">first marketplace listing live:</text>
  </g>

  <!-- Two columns comparison -->
  <g transform="translate(72 420)">
    <!-- Palvento column -->
    <rect x="0" y="0" width="440" height="560" rx="16" fill="${C.surface}" stroke="${C.accent}" stroke-width="2"/>
    <text x="30" y="42" font-family="${mono}" font-size="13" font-weight="600" fill="${C.accent}" letter-spacing="1.6">PALVENTO</text>
    <text x="30" y="200" font-family="${sans}" font-size="180" font-weight="600" fill="${C.ink}" letter-spacing="-8">10</text>
    <text x="260" y="200" font-family="${sans}" font-size="52" font-weight="500" fill="${C.muted}" letter-spacing="-1.4">min</text>

    <!-- Mini timeline inside -->
    <g transform="translate(30 260)">
      ${[
        { t: '0:00', l: 'App Store install' },
        { t: '0:45', l: 'OAuth two-way' },
        { t: '2:30', l: 'Catalogue imports' },
        { t: '6:15', l: 'First listing pushed' },
        { t: '9:00', l: 'Order flows back' },
      ].map((s, i) => `
        <g transform="translate(0 ${i * 52})">
          <circle cx="6" cy="14" r="6" fill="${C.accent}"/>
          ${i < 4 ? `<line x1="6" y1="22" x2="6" y2="42" stroke="${C.accent}" stroke-width="2" stroke-opacity="0.4"/>` : ''}
          <text x="26" y="19" font-family="${mono}" font-size="15" fill="${C.muted}" letter-spacing="0.3">${s.t}</text>
          <text x="90" y="19" font-family="${sans}" font-size="18" fill="${C.ink}" font-weight="500" letter-spacing="-0.2">${escXml(s.l)}</text>
        </g>`).join('')}
    </g>

    <!-- Enterprise-tier column -->
    <g transform="translate(496 0)">
      <rect x="0" y="0" width="440" height="560" rx="16" fill="${C.raised}" stroke="${C.rule}" stroke-width="1"/>
      <text x="30" y="42" font-family="${mono}" font-size="13" font-weight="600" fill="${C.muted}" letter-spacing="1.6">ENTERPRISE FEED TIER</text>
      <text x="30" y="200" font-family="${sans}" font-size="144" font-weight="600" fill="${C.muted}" letter-spacing="-6">30–90</text>
      <text x="360" y="200" font-family="${sans}" font-size="36" font-weight="500" fill="${C.muted}" letter-spacing="-1">days</text>

      <g transform="translate(30 260)">
        ${[
          { step: 'Discovery call',          detail: 'Sales + solutions architect' },
          { step: 'Quote + contract',        detail: '$2,500+/mo floor' },
          { step: 'Scoping workshops',       detail: 'Data model, mapping, integrations' },
          { step: 'Implementation',          detail: 'Managed-services team build' },
          { step: 'UAT + go-live',           detail: 'Weeks 4–12 typical' },
        ].map((s, i) => `
          <g transform="translate(0 ${i * 52})">
            <circle cx="6" cy="14" r="5" fill="${C.rule}" stroke="${C.muted}" stroke-width="1"/>
            ${i < 4 ? `<line x1="6" y1="21" x2="6" y2="41" stroke="${C.rule}" stroke-width="1"/>` : ''}
            <text x="26" y="19" font-family="${sans}" font-size="16" fill="${C.ink}" font-weight="500" letter-spacing="-0.2">${escXml(s.step)}</text>
            <text x="26" y="37" font-family="${sans}" font-size="13" fill="${C.muted}" letter-spacing="-0.1">${escXml(s.detail)}</text>
          </g>`).join('')}
      </g>
    </g>
  </g>

  <g transform="translate(72 ${H - 200})">
    <rect x="0" y="0" width="${W - 144}" height="76" rx="10" fill="${C.accentSft}" stroke="${C.accent}" stroke-width="1"/>
    <circle cx="30" cy="38" r="5" fill="${C.accent}"/>
    <text x="50" y="34" font-family="${mono}" font-size="12" font-weight="600" fill="${C.accent}" letter-spacing="1.4">PALVENTO INSTALL · 38 TEST RUNS AVERAGED</text>
    <text x="50" y="56" font-family="${sans}" font-size="18" fill="${C.ink}" letter-spacing="-0.2">Self-serve from the Shopify App Store. No sales call. No solutions architect.</text>
  </g>
  ${footer('Sources: Palvento internal 38-install measurement · Enterprise onboarding timelines are category-typical')}
</svg>`
}

// ── 04 — The taxonomy problem ─────────────────────────────────────────────
function taxonomyProblem(): string {
  const nodes = [
    { ch: 'Amazon',      count: 30000, color: C.ink,     ring: C.accent },
    { ch: 'eBay',        count: 18000, color: C.ink,     ring: C.accent },
    { ch: 'TikTok Shop', count: 8000,  color: C.ink,     ring: C.accent },
  ]
  const startY = 620
  const rowH = 140

  const rows = nodes.map((n, i) => {
    const y = startY + i * rowH
    const widthPct = n.count / 30000
    const barWidth = widthPct * (W - 144 - 240)
    return `
    <g>
      <text x="72" y="${y + 40}" font-family="${sans}" font-size="32" font-weight="600" fill="${C.ink}" letter-spacing="-0.5">${escXml(n.ch)}</text>
      <text x="72" y="${y + 70}" font-family="${mono}" font-size="16" fill="${C.muted}" letter-spacing="0.3">BROWSE NODES / CATEGORIES</text>
      <rect x="72" y="${y + 86}" width="${W - 144 - 240}" height="20" rx="4" fill="${C.rule}"/>
      <rect x="72" y="${y + 86}" width="${barWidth}" height="20" rx="4" fill="${C.accent}"/>
      <text x="${W - 72}" y="${y + 50}" font-family="${sans}" font-size="52" font-weight="600" fill="${C.ink}" text-anchor="end" letter-spacing="-1.6">${n.count.toLocaleString()}+</text>
    </g>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${header(4, 5, 'Taxonomy')}
  <g>
    <text x="72" y="260" font-family="${sans}" font-size="120" font-weight="600" fill="${C.ink}" letter-spacing="-5">56,000+</text>
    <text x="72" y="340" font-family="${sans}" font-size="42" font-weight="500" fill="${C.muted}" letter-spacing="-1.2">possible categories for <tspan fill="${C.ink}" font-weight="600">one</tspan> product.</text>
  </g>
  <text x="72" y="440" font-family="${sans}" font-size="22" fill="${C.muted}" letter-spacing="-0.3">Across Amazon, eBay and TikTok Shop. Map one Shopify catalogue to three marketplace taxonomies correctly — it is a two-week job on a first launch, and a tax on every new product after.</text>

  ${rows}

  <g transform="translate(72 ${H - 200})">
    <rect x="0" y="0" width="${W - 144}" height="76" rx="10" fill="${C.accentSft}" stroke="${C.accent}" stroke-width="1"/>
    <circle cx="30" cy="38" r="5" fill="${C.accent}"/>
    <text x="50" y="34" font-family="${mono}" font-size="12" font-weight="600" fill="${C.accent}" letter-spacing="1.4">AI CATEGORY SUGGESTER · NARROWS TO TOP 3 PER CHANNEL</text>
    <text x="50" y="56" font-family="${sans}" font-size="18" fill="${C.ink}" letter-spacing="-0.2">Operator confirms or overrides. The mapping saves. Next product inherits.</text>
  </g>
  ${footer('Sources: Amazon Browse Tree Guide · eBay Taxonomy API · TikTok Shop Partner Centre')}
</svg>`
}

// ── 05 — TikTok Shop isn't fashion ────────────────────────────────────────
function tiktokCategories(): string {
  const cats = [
    { cat: 'Candles',           m1: 3200,  m3: 8600  },
    { cat: 'Pet accessories',   m1: 4100,  m3: 12400 },
    { cat: 'Kitchen gadgets',   m1: 2800,  m3: 9200  },
    { cat: 'Stationery',        m1: 1900,  m3: 5600  },
    { cat: 'Skincare',          m1: 5800,  m3: 18200 },
  ]
  const maxVal = Math.max(...cats.flatMap(c => [c.m1, c.m3]))
  const barMaxW = W - 144 - 220
  const startY = 540
  const rowH = 120

  const rows = cats.map((c, i) => {
    const y = startY + i * rowH
    const w1 = (c.m1 / maxVal) * barMaxW
    const w3 = (c.m3 / maxVal) * barMaxW
    const mult = (c.m3 / c.m1).toFixed(1)
    return `
    <g>
      <text x="72" y="${y + 24}" font-family="${sans}" font-size="24" font-weight="600" fill="${C.ink}" letter-spacing="-0.4">${escXml(c.cat)}</text>
      <text x="${W - 72}" y="${y + 24}" font-family="${mono}" font-size="16" fill="${C.accent}" text-anchor="end" font-weight="600" letter-spacing="0.3">${mult}× in 90 days</text>
      <rect x="72" y="${y + 40}" width="${w1}" height="16" rx="3" fill="${C.rule}"/>
      <text x="${72 + w1 + 12}" y="${y + 53}" font-family="${mono}" font-size="13" fill="${C.muted}" letter-spacing="0.2">$${c.m1.toLocaleString()} · mo 1</text>
      <rect x="72" y="${y + 66}" width="${w3}" height="16" rx="3" fill="${C.accent}"/>
      <text x="${72 + w3 + 12}" y="${y + 79}" font-family="${mono}" font-size="13" fill="${C.ink}" font-weight="600" letter-spacing="0.2">$${c.m3.toLocaleString()} · mo 3</text>
    </g>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${header(5, 5, 'TikTok Shop')}
  <g>
    <text x="72" y="260" font-family="${sans}" font-size="64" font-weight="600" fill="${C.ink}" letter-spacing="-2.2">TikTok Shop</text>
    <text x="72" y="330" font-family="${sans}" font-size="64" font-weight="600" fill="${C.ink}" letter-spacing="-2.2">isn't a <tspan fill="${C.accent}">fashion thing.</tspan></text>
  </g>
  <text x="72" y="420" font-family="${sans}" font-size="22" fill="${C.muted}" letter-spacing="-0.3">The fastest-growing TikTok Shop categories in a sample of Shopify-led operators — selling consumer products under $40 with a visual story. Month-1 to month-3 GMV:</text>

  ${rows}

  <g transform="translate(72 ${H - 200})">
    <rect x="0" y="0" width="${W - 144}" height="76" rx="10" fill="${C.accentSft}" stroke="${C.accent}" stroke-width="1"/>
    <circle cx="30" cy="38" r="5" fill="${C.accent}"/>
    <text x="50" y="34" font-family="${mono}" font-size="12" font-weight="600" fill="${C.accent}" letter-spacing="1.4">EACH CATEGORY NEEDS DIFFERENT FEED ATTRIBUTES</text>
    <text x="50" y="56" font-family="${sans}" font-size="18" fill="${C.ink}" letter-spacing="-0.2">Beauty compliance, image ratios, category attributes — Palvento handles them per SKU.</text>
  </g>
  ${footer('Source: Palvento operator-interview sample · illustrative, not a broad index')}
</svg>`
}

// ── Orchestrate ───────────────────────────────────────────────────────────
const infographics: Array<{ slug: string; render: () => string }> = [
  { slug: '01-feed-rejections',   render: feedRejections },
  { slug: '02-channel-margins',   render: channelMargins },
  { slug: '03-install-speed',     render: installSpeed   },
  { slug: '04-taxonomy-problem',  render: taxonomyProblem },
  { slug: '05-tiktok-categories', render: tiktokCategories },
]

mkdirSync(OUT_DIR, { recursive: true })
let count = 0
for (const info of infographics) {
  const svg = info.render()
  const svgPath = join(OUT_DIR, `${info.slug}.svg`)
  writeFileSync(svgPath, svg, 'utf8')

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1080 },
    font: { loadSystemFonts: true },
  })
  const png = resvg.render().asPng()
  writeFileSync(join(OUT_DIR, `${info.slug}.png`), png)
  count++
}

console.log(`Wrote ${count} infographics (SVG + PNG) to ${OUT_DIR}`)
