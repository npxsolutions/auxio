/**
 * Generates 5 Shopify App Store feature screenshots at the 1600×1200 spec.
 * Each is a headline + product-UI mock + caption layout in the v9 palette.
 *
 *   01 Feed validator       — the headline value prop
 *   02 Per-channel P&L      — margin proof point
 *   03 Category suggester   — AI differentiator
 *   04 Install timeline     — the 10-minute story
 *   05 Pricing transparency — five currencies, flat, no % of GMV
 *
 * Outputs SVG (source) + PNG (Shopify-ready) to public/marketing/app-store/.
 *
 * Usage: npx tsx scripts/generate-app-store-screens.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const OUT_DIR = join('public', 'marketing', 'app-store')

const W = 1600
const H = 1200

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
  accentGlow:'rgba(232,134,63,0.35)',
  emerald: '#0e7c5a',
  amber:   '#b5651d',
  red:     '#b32718',
  rule:    'rgba(11,15,26,0.10)',
  ruleDk:  'rgba(11,15,26,0.20)',
}

const sans = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace'

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Shared header: eyebrow + chevron mark top-right
function chrome(n: number, eyebrow: string): string {
  return `
  <g>
    <text x="96" y="112" font-family="${mono}" font-size="22" fill="${C.accent}" letter-spacing="2.4" font-weight="600">§ 0${n} · ${escXml(eyebrow.toUpperCase())}</text>
    <line x1="96" y1="134" x2="176" y2="134" stroke="${C.accent}" stroke-width="2"/>
    <g transform="translate(1450 80)">
      <path d="M2 42 L24 6 L46 42 L36 42 L24 22 L12 42 Z" fill="${C.ink}"/>
      <rect x="18" y="34" width="12" height="4" rx="0.6" fill="${C.accent}"/>
    </g>
  </g>`
}

// Shared footer with palvento.com
function foot(caption: string): string {
  return `
  <g transform="translate(96 ${H - 80})">
    <line x1="0" y1="-18" x2="${W - 192}" y2="-18" stroke="${C.rule}" stroke-width="1"/>
    <g transform="translate(0 10)">
      <path d="M0 26 L14 2 L28 26 L22 26 L14 12 L6 26 Z" fill="${C.ink}"/>
      <rect x="10.5" y="20.5" width="7" height="2.5" rx="0.4" fill="${C.accent}"/>
      <text x="40" y="22" font-family="${sans}" font-size="24" font-weight="600" fill="${C.ink}" letter-spacing="-0.3">palvento.com</text>
    </g>
    <text x="${W - 192}" y="32" font-family="${mono}" font-size="14" fill="${C.muted}" text-anchor="end" letter-spacing="0.6">${escXml(caption)}</text>
  </g>`
}

// Window chrome block for product UI mocks
function windowChrome(y: number, title: string): string {
  return `
  <g>
    <rect x="96" y="${y}" width="${W - 192}" height="50" fill="${C.raised}" stroke="${C.rule}" stroke-width="1" rx="10 10 0 0"/>
    <g transform="translate(120 ${y + 18})">
      <circle cx="0" cy="7" r="6" fill="${C.red}" opacity="0.55"/>
      <circle cx="20" cy="7" r="6" fill="${C.amber}" opacity="0.55"/>
      <circle cx="40" cy="7" r="6" fill="${C.emerald}" opacity="0.55"/>
    </g>
    <text x="${W / 2}" y="${y + 32}" font-family="${mono}" font-size="14" fill="${C.muted}" text-anchor="middle" letter-spacing="0.4">${escXml(title)}</text>
  </g>`
}

// ── 01 — Feed validator ──────────────────────────────────────────────────
function screen01_validator(): string {
  const rows = [
    { sev: 'error',   sku: 'HOODIE-BLK-L',  msg: 'Missing GTIN · Amazon', fix: 'Suggest UPC-A · Fix' },
    { sev: 'warning', sku: 'CANDLE-FIG-04', msg: 'Banned word "free" · TikTok', fix: 'Rewrite · Fix' },
    { sev: 'ok',      sku: 'SOAP-LVND-200', msg: '14 checks passed', fix: 'Synced · 0:02' },
    { sev: 'ok',      sku: 'MUG-CER-RED',   msg: '14 checks passed', fix: 'Synced · 0:04' },
  ]

  const panelY = 580
  const panelH = 420
  const rowH = 78

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${chrome(1, 'Feed validator')}
  <g>
    <text x="96" y="240" font-family="${sans}" font-size="72" font-weight="600" fill="${C.ink}" letter-spacing="-2.4">Catch feed errors</text>
    <text x="96" y="320" font-family="${sans}" font-size="72" font-weight="600" fill="${C.ink}" letter-spacing="-2.4">before the <tspan fill="${C.accent}">marketplace rejects them.</tspan></text>
    <text x="96" y="400" font-family="${sans}" font-size="24" fill="${C.muted}" letter-spacing="-0.3">Per-channel pre-flight checks — GTIN, image resolution, banned words, category attributes, policy IDs.</text>
    <text x="96" y="432" font-family="${sans}" font-size="24" fill="${C.muted}" letter-spacing="-0.3">The error and the exact fix in one panel, before anything hits the marketplace.</text>
  </g>

  ${windowChrome(panelY - 50, 'palvento.com/dashboard · Feed validator')}
  <rect x="96" y="${panelY}" width="${W - 192}" height="${panelH}" fill="${C.surface}" stroke="${C.rule}" stroke-width="1"/>

  <!-- Panel header -->
  <g transform="translate(124 ${panelY + 20})">
    <text x="0" y="16" font-family="${mono}" font-size="13" fill="${C.faint}" letter-spacing="1.4">EBAY · 4 LISTINGS · 2 ERRORS CAUGHT</text>
    <text x="0" y="48" font-family="${sans}" font-size="24" font-weight="500" fill="${C.ink}" letter-spacing="-0.3">Pre-flight check · live</text>
  </g>
  <g transform="translate(${W - 140} ${panelY + 42})">
    <rect x="-110" y="-20" width="110" height="32" rx="6" fill="${C.accentSft}" stroke="${C.accent}" stroke-width="1"/>
    <text x="-55" y="2" font-family="${mono}" font-size="12" font-weight="600" fill="${C.accent}" text-anchor="middle" letter-spacing="0.8">2 TO FIX</text>
  </g>

  <!-- Rows -->
  ${rows.map((r, i) => {
    const y = panelY + 110 + i * rowH
    const dot = r.sev === 'error' ? C.red : r.sev === 'warning' ? C.amber : C.emerald
    const bg = r.sev === 'error' ? 'rgba(179,39,24,0.04)' : r.sev === 'warning' ? 'rgba(181,101,29,0.04)' : C.surface
    const border = r.sev === 'error' ? `rgba(179,39,24,0.3)` : r.sev === 'warning' ? `rgba(181,101,29,0.3)` : C.rule
    return `
    <g>
      <rect x="124" y="${y}" width="${W - 248}" height="${rowH - 14}" rx="8" fill="${bg}" stroke="${border}" stroke-width="1"/>
      <circle cx="152" cy="${y + (rowH - 14) / 2}" r="5" fill="${dot}"/>
      <text x="176" y="${y + 26}" font-family="${mono}" font-size="15" fill="${C.ink}" font-weight="500" letter-spacing="0.2">${escXml(r.sku)}</text>
      <text x="176" y="${y + 48}" font-family="${sans}" font-size="15" fill="${C.muted}" letter-spacing="-0.1">${escXml(r.msg)}</text>
      <text x="${W - 148}" y="${y + 38}" font-family="${mono}" font-size="13" fill="${dot}" text-anchor="end" font-weight="600" letter-spacing="0.4">${escXml(r.fix)}</text>
    </g>`
  }).join('')}

  ${foot('Amazon · eBay · TikTok Shop · Etsy · Walmart · Google Shopping')}
</svg>`
}

// ── 02 — Per-channel P&L ─────────────────────────────────────────────────
function screen02_pnl(): string {
  const rows = [
    { ch: 'Shopify',         rev: 124400, fees: 3610, net: 120790, margin: 97.1, units: 842, trend: [52,58,61,60,65,72,78,82,88,92,98] },
    { ch: 'eBay',            rev: 32100,  fees: 4190, net: 27910,  margin: 86.9, units: 289, trend: [40,44,41,48,45,50,47,52,55,58,61] },
    { ch: 'Google Shopping', rev: 88200,  fees: 2310, net: 85890,  margin: 97.4, units: 612, trend: [30,35,42,48,55,58,62,68,72,78,88] },
  ]

  const panelY = 560
  const tableHead = panelY + 130
  const rowH = 76

  const sparkline = (points: number[], color: string, width = 120, height = 28) => {
    const max = Math.max(...points); const min = Math.min(...points); const range = max - min || 1
    const step = width / (points.length - 1)
    const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(height - ((v - min) / range) * height).toFixed(1)}`).join(' ')
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${chrome(2, 'Per-channel P&L')}
  <g>
    <text x="96" y="240" font-family="${sans}" font-size="72" font-weight="600" fill="${C.ink}" letter-spacing="-2.4">See which channel</text>
    <text x="96" y="320" font-family="${sans}" font-size="72" font-weight="600" fill="${C.ink}" letter-spacing="-2.4">actually <tspan fill="${C.accent}">made you money.</tspan></text>
    <text x="96" y="400" font-family="${sans}" font-size="24" fill="${C.muted}" letter-spacing="-0.3">Line-item fee attribution reconciled into contribution margin per SKU per channel —</text>
    <text x="96" y="432" font-family="${sans}" font-size="24" fill="${C.muted}" letter-spacing="-0.3">FBA removal, eBay insertion, TikTok Shop commission, all tagged against the orders they belong to.</text>
  </g>

  ${windowChrome(panelY - 50, 'palvento.com/dashboard · P&L')}
  <rect x="96" y="${panelY}" width="${W - 192}" height="${H - 200 - panelY}" fill="${C.surface}" stroke="${C.rule}" stroke-width="1"/>

  <!-- Panel header -->
  <g transform="translate(124 ${panelY + 20})">
    <text x="0" y="16" font-family="${mono}" font-size="13" fill="${C.faint}" letter-spacing="1.4">OCTOBER 2026 · 31 DAYS · 1,743 ORDERS</text>
    <text x="0" y="56" font-family="${sans}" font-size="32" font-weight="600" fill="${C.ink}" letter-spacing="-0.6">$244,700 net · <tspan fill="${C.emerald}">93.9% margin</tspan></text>
  </g>
  <g transform="translate(${W - 140} ${panelY + 46})">
    ${['Day','Week','Month','YTD'].map((l, i) => `
      <rect x="${-((4 - i) * 78)}" y="-18" width="70" height="28" rx="6" fill="${i === 2 ? C.accentSft : 'transparent'}" stroke="${i === 2 ? 'rgba(232,134,63,0.4)' : C.rule}" stroke-width="1"/>
      <text x="${-((4 - i) * 78) + 35}" y="0" font-family="${mono}" font-size="12" fill="${i === 2 ? C.accent : C.muted}" text-anchor="middle" letter-spacing="0.4" font-weight="${i === 2 ? 600 : 500}">${l}</text>`).join('')}
  </g>

  <!-- Table head -->
  <g transform="translate(124 ${tableHead})">
    <text x="0" y="0" font-family="${mono}" font-size="11" fill="${C.faint}" letter-spacing="1.4">CHANNEL</text>
    <text x="400" y="0" font-family="${mono}" font-size="11" fill="${C.faint}" text-anchor="end" letter-spacing="1.4">REVENUE</text>
    <text x="560" y="0" font-family="${mono}" font-size="11" fill="${C.faint}" text-anchor="end" letter-spacing="1.4">FEES</text>
    <text x="720" y="0" font-family="${mono}" font-size="11" fill="${C.faint}" text-anchor="end" letter-spacing="1.4">NET</text>
    <text x="860" y="0" font-family="${mono}" font-size="11" fill="${C.faint}" text-anchor="end" letter-spacing="1.4">MARGIN</text>
    <text x="980" y="0" font-family="${mono}" font-size="11" fill="${C.faint}" text-anchor="end" letter-spacing="1.4">UNITS</text>
    <text x="1280" y="0" font-family="${mono}" font-size="11" fill="${C.faint}" text-anchor="end" letter-spacing="1.4">30-DAY</text>
  </g>

  <!-- Rows -->
  ${rows.map((r, i) => {
    const y = tableHead + 40 + i * rowH
    return `
    <g>
      <line x1="124" y1="${y - 10}" x2="${W - 124}" y2="${y - 10}" stroke="${C.rule}" stroke-width="1"/>
      <g transform="translate(124 ${y + 26})">
        <circle cx="10" cy="-4" r="5" fill="${C.accent}"/>
        <text x="28" y="0" font-family="${sans}" font-size="20" font-weight="500" fill="${C.ink}" letter-spacing="-0.2">${escXml(r.ch)}</text>
        <text x="400" y="0" font-family="${mono}" font-size="18" fill="${C.ink}" text-anchor="end" letter-spacing="0.2">$${r.rev.toLocaleString()}</text>
        <text x="560" y="0" font-family="${mono}" font-size="18" fill="${C.muted}" text-anchor="end" letter-spacing="0.2">$${r.fees.toLocaleString()}</text>
        <text x="720" y="0" font-family="${mono}" font-size="19" fill="${C.ink}" text-anchor="end" font-weight="600" letter-spacing="0.2">$${r.net.toLocaleString()}</text>
        <text x="860" y="0" font-family="${mono}" font-size="18" fill="${r.margin > 90 ? C.emerald : C.amber}" text-anchor="end" letter-spacing="0.2">${r.margin.toFixed(1)}%</text>
        <text x="980" y="0" font-family="${mono}" font-size="18" fill="${C.muted}" text-anchor="end" letter-spacing="0.2">${r.units}</text>
        <g transform="translate(1160 -22)">${sparkline(r.trend, r.margin > 90 ? C.emerald : C.amber)}</g>
      </g>
    </g>`
  }).join('')}

  ${foot('FBA removal · eBay insertion · TikTok Shop commission · reconciled per SKU')}
</svg>`
}

// ── 03 — Category suggester ──────────────────────────────────────────────
function screen03_category(): string {
  const suggestions = [
    { conf: 96, path: 'Apparel & Accessories › Men\'s Clothing › Tops › Hoodies & Sweatshirts', ch: 'Amazon', why: 'Title match + image category' },
    { conf: 87, path: 'Clothing, Shoes & Accessories › Men › Men\'s Clothing › Activewear › Hoodies', ch: 'eBay', why: 'Attribute match · size + colour' },
    { conf: 78, path: 'Men\'s Apparel › Outerwear › Hoodies', ch: 'TikTok Shop', why: 'Style tag match' },
  ]
  const panelY = 560
  const rowH = 130

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${chrome(3, 'AI category suggester')}
  <g>
    <text x="96" y="240" font-family="${sans}" font-size="72" font-weight="600" fill="${C.ink}" letter-spacing="-2.4">Stop mapping <tspan fill="${C.accent}">30,000</tspan></text>
    <text x="96" y="320" font-family="${sans}" font-size="72" font-weight="600" fill="${C.ink}" letter-spacing="-2.4">Amazon categories by hand.</text>
    <text x="96" y="400" font-family="${sans}" font-size="24" fill="${C.muted}" letter-spacing="-0.3">AI narrows Amazon, eBay, TikTok Shop and Etsy taxonomies to the top three picks per channel with</text>
    <text x="96" y="432" font-family="${sans}" font-size="24" fill="${C.muted}" letter-spacing="-0.3">confidence scores and the reason. You confirm or override. The next product inherits the mapping.</text>
  </g>

  ${windowChrome(panelY - 50, 'palvento.com/listings/hoodie-blk-l · Category')}
  <rect x="96" y="${panelY}" width="${W - 192}" height="${H - 200 - panelY}" fill="${C.surface}" stroke="${C.rule}" stroke-width="1"/>

  <!-- Product header -->
  <g transform="translate(124 ${panelY + 24})">
    <rect x="0" y="0" width="84" height="84" rx="10" fill="${C.raised}" stroke="${C.rule}" stroke-width="1"/>
    <text x="42" y="52" font-family="${sans}" font-size="28" fill="${C.muted}" text-anchor="middle">👕</text>
    <g transform="translate(104 16)">
      <text x="0" y="18" font-family="${mono}" font-size="12" fill="${C.faint}" letter-spacing="1.4">SKU · HOODIE-BLK-L · $48</text>
      <text x="0" y="48" font-family="${sans}" font-size="26" font-weight="500" fill="${C.ink}" letter-spacing="-0.3">Men\'s Black Hoodie · Large · Organic Cotton</text>
    </g>
  </g>

  <!-- Suggestions -->
  ${suggestions.map((s, i) => {
    const y = panelY + 140 + i * rowH
    const barW = (s.conf / 100) * (W - 248 - 200)
    return `
    <g>
      <rect x="124" y="${y}" width="${W - 248}" height="${rowH - 18}" rx="10" fill="${i === 0 ? C.accentSft : C.raised}" stroke="${i === 0 ? `rgba(232,134,63,0.4)` : C.rule}" stroke-width="1"/>
      <g transform="translate(148 ${y + 20})">
        <text x="0" y="16" font-family="${mono}" font-size="12" fill="${i === 0 ? C.accent : C.faint}" letter-spacing="1.2" font-weight="600">${escXml(s.ch.toUpperCase())} · SUGGESTION ${i + 1}</text>
        <text x="0" y="44" font-family="${sans}" font-size="18" fill="${C.ink}" font-weight="500" letter-spacing="-0.15">${escXml(s.path)}</text>
        <text x="0" y="70" font-family="${sans}" font-size="14" fill="${C.muted}" letter-spacing="-0.1">${escXml(s.why)}</text>
      </g>
      <!-- confidence bar -->
      <g transform="translate(${W - 440} ${y + 34})">
        <text x="0" y="0" font-family="${mono}" font-size="13" fill="${C.faint}" letter-spacing="0.6">CONFIDENCE</text>
        <rect x="0" y="12" width="${W - 248 - 260}" height="8" rx="4" fill="${C.rule}"/>
        <rect x="0" y="12" width="${(s.conf / 100) * (W - 248 - 260)}" height="8" rx="4" fill="${i === 0 ? C.accent : C.muted}"/>
        <text x="0" y="42" font-family="${mono}" font-size="20" fill="${C.ink}" font-weight="600" letter-spacing="-0.4">${s.conf}%</text>
      </g>
      ${i === 0 ? `<g transform="translate(${W - 220} ${y + 48})">
        <rect x="0" y="-20" width="90" height="36" rx="6" fill="${C.accent}"/>
        <text x="45" y="4" font-family="${sans}" font-size="14" fill="#ffffff" font-weight="500" text-anchor="middle" letter-spacing="-0.1">Accept ✓</text>
      </g>` : ''}
    </g>`
  }).join('')}

  ${foot('30,000+ Amazon nodes · 18,000 eBay · 8,000 TikTok Shop — narrowed to 3 per channel')}
</svg>`
}

// ── 04 — Install timeline ────────────────────────────────────────────────
function screen04_install(): string {
  const steps = [
    { t: '0:00', title: 'Install from Shopify App Store',    d: 'One click from the admin. No API keys to paste.' },
    { t: '0:45', title: 'OAuth two-way sync',                 d: 'Products, inventory, orders flow both directions.' },
    { t: '2:30', title: 'Catalogue imports',                  d: 'Up to 10,000 SKUs in under two minutes.' },
    { t: '6:15', title: 'First listing pushed to eBay',       d: 'Category suggested, validator green, pushed.' },
    { t: '9:00', title: 'Live. First order flows back.',      d: 'Channel-tagged, contribution margin updates per SKU.' },
  ]
  const startY = 560

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${chrome(4, 'Install speed')}
  <g>
    <text x="96" y="240" font-family="${sans}" font-size="72" font-weight="600" fill="${C.ink}" letter-spacing="-2.4">Install → first listing live</text>
    <text x="96" y="320" font-family="${sans}" font-size="72" font-weight="600" fill="${C.ink}" letter-spacing="-2.4">in <tspan fill="${C.accent}">under ten minutes.</tspan></text>
    <text x="96" y="400" font-family="${sans}" font-size="24" fill="${C.muted}" letter-spacing="-0.3">Measured across 38 test installs. No sales call, no solutions architect, no 30-day kickoff.</text>
    <text x="96" y="432" font-family="${sans}" font-size="24" fill="${C.muted}" letter-spacing="-0.3">Published pricing. Cancel any time.</text>
  </g>

  <!-- Timeline -->
  <line x1="240" y1="${startY + 20}" x2="240" y2="${startY + steps.length * 100}" stroke="${C.rule}" stroke-width="2"/>
  <line x1="240" y1="${startY + 20}" x2="240" y2="${startY + (steps.length - 0.5) * 100}" stroke="${C.accent}" stroke-width="2"/>

  ${steps.map((s, i) => {
    const y = startY + i * 100 + 20
    return `
    <g>
      <text x="200" y="${y + 8}" font-family="${mono}" font-size="18" fill="${C.ink}" text-anchor="end" font-weight="500" letter-spacing="0.3">${s.t}</text>
      <circle cx="240" cy="${y}" r="10" fill="${C.accent}"/>
      <circle cx="240" cy="${y}" r="18" fill="none" stroke="${C.accent}" stroke-width="2" stroke-opacity="0.25"/>
      <g transform="translate(284 ${y - 6})">
        <text x="0" y="0" font-family="${sans}" font-size="26" font-weight="500" fill="${C.ink}" letter-spacing="-0.3">${escXml(s.title)}</text>
        <text x="0" y="30" font-family="${sans}" font-size="17" fill="${C.muted}" letter-spacing="-0.1">${escXml(s.d)}</text>
      </g>
    </g>`
  }).join('')}

  ${foot('Shopify App Store OAuth · 38 test installs averaged · no card required')}
</svg>`
}

// ── 05 — Pricing transparency ────────────────────────────────────────────
function screen05_pricing(): string {
  const tiers = [
    { name: 'Starter',    price: 149,  tag: '1 channel',                  popular: false },
    { name: 'Growth',     price: 349,  tag: '5 channels · most adopted',  popular: true  },
    { name: 'Scale',      price: 799,  tag: 'Unlimited channels',         popular: false },
    { name: 'Enterprise', price: 2000, tag: 'From · SSO · SLA',           popular: false },
  ]
  const cardW = (W - 192 - 48) / 4
  const cardH = 420
  const startY = 580

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${chrome(5, 'Pricing')}
  <g>
    <text x="96" y="240" font-family="${sans}" font-size="72" font-weight="600" fill="${C.ink}" letter-spacing="-2.4">Published pricing.</text>
    <text x="96" y="320" font-family="${sans}" font-size="72" font-weight="600" fill="${C.ink}" letter-spacing="-2.4">Five currencies. <tspan fill="${C.accent}">No % of GMV.</tspan></text>
    <text x="96" y="400" font-family="${sans}" font-size="24" fill="${C.muted}" letter-spacing="-0.3">Flat monthly. No per-order fees above plan. No quote-form floor.</text>
    <text x="96" y="432" font-family="${sans}" font-size="24" fill="${C.muted}" letter-spacing="-0.3">Toggle between USD, GBP, EUR, AUD, CAD — each priced to a clean number in that currency.</text>
  </g>

  <!-- Currency toggle mockup -->
  <g transform="translate(96 520)">
    <rect x="0" y="0" width="420" height="40" rx="8" fill="${C.surface}" stroke="${C.rule}" stroke-width="1"/>
    ${['USD','GBP','EUR','AUD','CAD'].map((c, i) => `
      <rect x="${4 + i * 82}" y="4" width="78" height="32" rx="6" fill="${i === 0 ? C.accent : 'transparent'}"/>
      <text x="${4 + i * 82 + 39}" y="25" font-family="${mono}" font-size="14" font-weight="600" fill="${i === 0 ? '#ffffff' : C.muted}" text-anchor="middle" letter-spacing="0.6">${c}</text>`).join('')}
  </g>

  <!-- Price cards -->
  ${tiers.map((t, i) => {
    const x = 96 + i * (cardW + 16)
    return `
    <g>
      <rect x="${x}" y="${startY}" width="${cardW}" height="${cardH}" rx="14"
        fill="${t.popular ? C.accentSft : C.surface}"
        stroke="${t.popular ? 'rgba(232,134,63,0.5)' : C.rule}"
        stroke-width="${t.popular ? 1.5 : 1}"/>
      ${t.popular ? `
      <rect x="${x + 20}" y="${startY - 14}" width="140" height="28" rx="14" fill="${C.surface}" stroke="${C.accent}" stroke-width="1"/>
      <text x="${x + 90}" y="${startY + 4}" font-family="${mono}" font-size="11" fill="${C.accent}" font-weight="600" text-anchor="middle" letter-spacing="1.2">MOST ADOPTED</text>
      ` : ''}
      <g transform="translate(${x + 28} ${startY + 40})">
        <text x="0" y="18" font-family="${mono}" font-size="12" fill="${C.faint}" letter-spacing="1.4">${escXml(t.tag.toUpperCase())}</text>
        <text x="0" y="60" font-family="${sans}" font-size="28" font-weight="600" fill="${C.ink}" letter-spacing="-0.3">${t.name}</text>
        <g transform="translate(0 120)">
          <text x="0" y="0" font-family="${sans}" font-size="64" font-weight="600" fill="${C.ink}" letter-spacing="-2.4">$${t.price}</text>
          <text x="0" y="24" font-family="${mono}" font-size="14" fill="${C.muted}" letter-spacing="0.4">/ MONTH · FLAT</text>
        </g>
        <rect x="0" y="170" width="${cardW - 56}" height="44" rx="8" fill="${t.popular ? C.accent : C.raised}"/>
        <text x="${(cardW - 56) / 2}" y="198" font-family="${sans}" font-size="14" font-weight="500" fill="${t.popular ? '#ffffff' : C.ink}" text-anchor="middle" letter-spacing="-0.1">${t.name === 'Enterprise' ? 'Talk to sales' : 'Start free trial'} →</text>
        <g transform="translate(0 240)">
          <text x="0" y="0" font-family="${mono}" font-size="11" fill="${C.faint}" letter-spacing="1.2">INCLUDES</text>
          ${['All feed validation rules','14-day free trial','No card required','Cancel any time'].map((f, j) => `
          <g transform="translate(0 ${20 + j * 22})">
            <circle cx="6" cy="7" r="6" fill="${t.popular ? C.accentSft : C.raised}"/>
            <path d="M3 7 L5 9 L9 5" stroke="${t.popular ? C.accent : C.muted}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
            <text x="20" y="11" font-family="${sans}" font-size="13" fill="${C.muted}" letter-spacing="-0.1">${f}</text>
          </g>`).join('')}
        </g>
      </g>
    </g>`
  }).join('')}

  ${foot('14-day free trial · No card required · Cancel any time · USD · GBP · EUR · AUD · CAD')}
</svg>`
}

// ── Orchestrate ──────────────────────────────────────────────────────────
const screens: Array<{ slug: string; render: () => string }> = [
  { slug: 'screen-01-validator',  render: screen01_validator },
  { slug: 'screen-02-pnl',        render: screen02_pnl       },
  { slug: 'screen-03-category',   render: screen03_category  },
  { slug: 'screen-04-install',    render: screen04_install   },
  { slug: 'screen-05-pricing',    render: screen05_pricing   },
]

mkdirSync(OUT_DIR, { recursive: true })
let count = 0
for (const s of screens) {
  const svg = s.render()
  writeFileSync(join(OUT_DIR, `${s.slug}.svg`), svg, 'utf8')

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1600 },
    font: { loadSystemFonts: true },
  })
  const png = resvg.render().asPng()
  writeFileSync(join(OUT_DIR, `${s.slug}.png`), png)
  count++
}

console.log(`Wrote ${count} App Store screens (SVG + PNG) to ${OUT_DIR}`)
