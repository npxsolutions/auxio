'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d'

interface ChannelRow {
  channel: string
  gmv: number
  fees: number
  cogs: number
  shipping: number
  returns: number
  netProfit: number
  marginPct: number
  vsPrev: number
}

interface SkuRow {
  product: string
  sku: string
  revenue: number
  marginPct: number
  unitsSold: number
  channel: string
}

interface MarginLeak {
  id: string
  title: string
  detail: string
  impact: string
  severity: 'high' | 'medium' | 'warning'
  action: string
}

// ─── Mock data per period ─────────────────────────────────────────────────────

const PERIOD_DATA: Record<Period, {
  gmv: number; netRevenue: number; netProfit: number; blendedMargin: number
  gmvTrend: number; revTrend: number; profitTrend: number; marginTrend: number
  fees: number; cogs: number; shipping: number; returns: number
  channels: ChannelRow[]
  skus: SkuRow[]
}> = {
  '7d': {
    gmv: 5840, netRevenue: 5190, netProfit: 1920, blendedMargin: 32.9,
    gmvTrend: 8.4, revTrend: 9.1, profitTrend: 11.2, marginTrend: 0.8,
    fees: 467, cogs: 2334, shipping: 292, returns: 292,
    channels: [
      { channel: 'eBay',    gmv: 2340, fees: 187, cogs: 936,  shipping: 117, returns: 117, netProfit: 748,  marginPct: 31.9, vsPrev: 5.2  },
      { channel: 'Amazon',  gmv: 2100, fees: 189, cogs: 840,  shipping: 105, returns: 105, netProfit: 672,  marginPct: 32.0, vsPrev: 12.4 },
      { channel: 'Shopify', gmv: 1400, fees:  91, cogs: 558,  shipping:  70, returns:  70, netProfit: 500,  marginPct: 35.7, vsPrev: 8.9  },
    ],
    skus: [
      { product: 'Sony WH-1000XM5', sku: 'SKU-8821', revenue: 760, marginPct: 34.2, unitsSold: 4, channel: 'eBay' },
      { product: 'Apple AirPods Pro (2nd Gen)', sku: 'SKU-3340', revenue: 685, marginPct: 29.8, unitsSold: 3, channel: 'Amazon' },
      { product: 'Logitech MX Master 3S', sku: 'SKU-5512', revenue: 540, marginPct: 38.5, unitsSold: 6, channel: 'eBay' },
      { product: 'Samsung Galaxy Buds2 Pro', sku: 'SKU-7703', revenue: 450, marginPct: 27.3, unitsSold: 3, channel: 'Amazon' },
      { product: 'Anker PowerCore 26800', sku: 'SKU-2291', revenue: 360, marginPct: 42.1, unitsSold: 8, channel: 'Shopify' },
    ],
  },
  '30d': {
    gmv: 24840, netRevenue: 22100, netProfit: 8420, blendedMargin: 33.9,
    gmvTrend: 12.0, revTrend: 11.4, profitTrend: 14.8, marginTrend: 1.2,
    fees: 1987, cogs: 9936, shipping: 1242, returns: 1242,
    channels: [
      { channel: 'eBay',    gmv: 9950,  fees: 796, cogs: 3980, shipping: 497, returns: 497, netProfit: 3184, marginPct: 32.0, vsPrev: 9.3  },
      { channel: 'Amazon',  gmv: 8940,  fees: 804, cogs: 3576, shipping: 447, returns: 447, netProfit: 2862, marginPct: 32.0, vsPrev: 16.7 },
      { channel: 'Shopify', gmv: 5950,  fees: 387, cogs: 2380, shipping: 298, returns: 298, netProfit: 2374, marginPct: 39.9, vsPrev: 11.2 },
    ],
    skus: [
      { product: 'Sony WH-1000XM5', sku: 'SKU-8821', revenue: 3230, marginPct: 34.2, unitsSold: 17, channel: 'eBay' },
      { product: 'Apple AirPods Pro (2nd Gen)', sku: 'SKU-3340', revenue: 2975, marginPct: 29.8, unitsSold: 13, channel: 'Amazon' },
      { product: 'Logitech MX Master 3S', sku: 'SKU-5512', revenue: 2430, marginPct: 38.5, unitsSold: 27, channel: 'eBay' },
      { product: 'Samsung Galaxy Buds2 Pro', sku: 'SKU-7703', revenue: 1950, marginPct: 27.3, unitsSold: 13, channel: 'Amazon' },
      { product: 'Anker PowerCore 26800', sku: 'SKU-2291', revenue: 1575, marginPct: 42.1, unitsSold: 35, channel: 'Shopify' },
    ],
  },
  '90d': {
    gmv: 74200, netRevenue: 66100, netProfit: 25440, blendedMargin: 34.3,
    gmvTrend: 18.5, revTrend: 17.2, profitTrend: 21.4, marginTrend: 2.1,
    fees: 5936, cogs: 29680, shipping: 3710, returns: 3710,
    channels: [
      { channel: 'eBay',    gmv: 29700, fees: 2376, cogs: 11880, shipping: 1485, returns: 1485, netProfit: 9504, marginPct: 32.0, vsPrev: 14.2 },
      { channel: 'Amazon',  gmv: 26700, fees: 2403, cogs: 10680, shipping: 1335, returns: 1335, netProfit: 8544, marginPct: 32.0, vsPrev: 22.1 },
      { channel: 'Shopify', gmv: 17800, fees: 1157, cogs: 7120,  shipping:  890, returns:  890, netProfit: 7392, marginPct: 41.5, vsPrev: 17.9 },
    ],
    skus: [
      { product: 'Sony WH-1000XM5', sku: 'SKU-8821', revenue: 9690, marginPct: 34.2, unitsSold: 51, channel: 'eBay' },
      { product: 'Apple AirPods Pro (2nd Gen)', sku: 'SKU-3340', revenue: 8925, marginPct: 29.8, unitsSold: 39, channel: 'Amazon' },
      { product: 'Logitech MX Master 3S', sku: 'SKU-5512', revenue: 7290, marginPct: 38.5, unitsSold: 81, channel: 'eBay' },
      { product: 'Samsung Galaxy Buds2 Pro', sku: 'SKU-7703', revenue: 5850, marginPct: 27.3, unitsSold: 39, channel: 'Amazon' },
      { product: 'Anker PowerCore 26800', sku: 'SKU-2291', revenue: 4725, marginPct: 42.1, unitsSold: 105, channel: 'Shopify' },
    ],
  },
}

const MARGIN_LEAKS: MarginLeak[] = [
  {
    id: 'ml1',
    title: 'High return rate on SKU-1234',
    detail: 'USB-C Hub Multiport returned 18% of orders this month — above the 8% category average.',
    impact: '£230/month',
    severity: 'high',
    action: 'Review listing',
  },
  {
    id: 'ml2',
    title: 'eBay fees increased 2.1% this month',
    detail: 'Final value fees rose from 12.0% to 14.1% on Electronics — check your fee category assignments.',
    impact: '£180 impact',
    severity: 'medium',
    action: 'View fee breakdown',
  },
  {
    id: 'ml3',
    title: '5 listings priced below cost',
    detail: 'SKU-4421, SKU-7712, SKU-0093, SKU-2287, SKU-8834 are selling at a net loss after fees and shipping.',
    impact: 'Immediate action needed',
    severity: 'warning',
    action: 'Fix prices',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtGBP(n: number, decimals = 0) {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function marginColor(pct: number): { color: string; bg: string; border: string } {
  if (pct >= 20) return { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' }
  if (pct >= 10) return { color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
  return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
}

function trendBadge(val: number) {
  const pos = val >= 0
  return {
    label: `${pos ? '+' : ''}${val.toFixed(1)}% vs last period`,
    color: pos ? '#059669' : '#dc2626',
    bg: pos ? '#ecfdf5' : '#fef2f2',
  }
}

const CHANNEL_PILL: Record<string, { bg: string; color: string; border: string }> = {
  eBay:    { bg: '#fff3f3', color: '#c0392b', border: '#fecaca' },
  Amazon:  { bg: '#fffbf0', color: '#b45309', border: '#fde68a' },
  Shopify: { bg: '#f0fdf4', color: '#15803d', border: '#a7f3d0' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [period, setPeriod] = useState<Period>('30d')
  const data = PERIOD_DATA[period]

  // Auth guard
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
  }, [])

  // Try to fetch real dashboard stats; silently fall back to mock
  useEffect(() => {
    fetch('/api/dashboard/stats').catch(() => { /* use mock */ })
  }, [period])

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#9496b0',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  // Waterfall bar widths (proportional to GMV)
  const waterfallItems = [
    { label: 'GMV',          value: data.gmv,         color: '#5b52f5', textColor: 'white', type: 'base' },
    { label: 'Channel Fees', value: data.fees,         color: '#f87171', textColor: 'white', type: 'minus' },
    { label: 'COGS',         value: data.cogs,         color: '#fb923c', textColor: 'white', type: 'minus' },
    { label: 'Shipping',     value: data.shipping,     color: '#fbbf24', textColor: '#1a1b22', type: 'minus' },
    { label: 'Returns',      value: data.returns,      color: '#e879f9', textColor: 'white', type: 'minus' },
    { label: 'Net Profit',   value: data.netProfit,    color: '#34d399', textColor: '#1a1b22', type: 'result' },
  ]

  const maxVal = data.gmv

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <AppSidebar />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', margin: 0, letterSpacing: '-0.02em' }}>
              Analytics
            </h1>
            <p style={{ fontSize: 13, color: '#6b6e87', margin: '4px 0 0', lineHeight: 1.5 }}>
              GMV → Net Profit breakdown across all your channels.
            </p>
          </div>

          {/* Period tabs */}
          <div style={{
            display: 'flex', background: 'white',
            border: '1px solid #e8e5df', borderRadius: 10, padding: 3, gap: 2,
          }}>
            {(['7d', '30d', '90d'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  fontSize: 13, fontWeight: period === p ? 600 : 400,
                  background: period === p ? '#5b52f5' : 'transparent',
                  color: period === p ? 'white' : '#6b6e87',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total GMV', value: fmtGBP(data.gmv), trend: data.gmvTrend },
            { label: 'Net Revenue', value: fmtGBP(data.netRevenue), trend: data.revTrend, sub: 'after channel fees' },
            { label: 'Net Profit', value: fmtGBP(data.netProfit), trend: data.profitTrend },
            { label: 'Blended Margin', value: `${data.blendedMargin}%`, trend: data.marginTrend },
          ].map(kpi => {
            const tb = trendBadge(kpi.trend)
            return (
              <div key={kpi.label} style={{
                background: 'white', border: '1px solid #e8e5df', borderRadius: 12,
                padding: '18px 20px',
              }}>
                <div style={{ ...labelStyle, marginBottom: 10 }}>{kpi.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1b22', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {kpi.value}
                </div>
                {kpi.sub && (
                  <div style={{ fontSize: 11, color: '#9496b0', marginTop: 3 }}>{kpi.sub}</div>
                )}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  marginTop: 10,
                  background: tb.bg, color: tb.color,
                  fontSize: 11, fontWeight: 600,
                  padding: '3px 8px', borderRadius: 100,
                }}>
                  {kpi.trend >= 0
                    ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7L5 3l3 4"/></svg>
                    : <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3L5 7l3-4"/></svg>
                  }
                  {tb.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Waterfall chart ── */}
        <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>Profit Waterfall</div>
            <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>
              How GMV flows through to Net Profit after deductions
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {waterfallItems.map((item, idx) => {
              const widthPct = (item.value / maxVal) * 100
              const isMinus = item.type === 'minus'
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 110, fontSize: 12, color: '#6b6e87', textAlign: 'right', flexShrink: 0 }}>
                    {isMinus && <span style={{ color: '#f87171', marginRight: 2 }}>−</span>}
                    {item.label}
                  </div>
                  <div style={{ flex: 1, background: '#f5f3ef', borderRadius: 6, height: 32, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: 6,
                      display: 'flex', alignItems: 'center',
                      paddingLeft: 10, boxSizing: 'border-box',
                      minWidth: 60,
                      transition: 'width 0.4s ease',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: item.textColor, whiteSpace: 'nowrap' }}>
                        {fmtGBP(item.value)}
                      </span>
                    </div>
                  </div>
                  <div style={{ width: 70, fontSize: 12, color: '#9496b0', flexShrink: 0 }}>
                    {item.type !== 'base' && item.type !== 'result'
                      ? `${((item.value / data.gmv) * 100).toFixed(1)}% of GMV`
                      : item.type === 'result'
                      ? `${data.blendedMargin}% margin`
                      : ''
                    }
                  </div>
                </div>
              )
            })}
          </div>

          {/* Divider before result */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e8e5df', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Net margin retained:
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
              {data.blendedMargin}% — {fmtGBP(data.netProfit)} from {fmtGBP(data.gmv)} GMV
            </div>
          </div>
        </div>

        {/* ── Channel profitability table ── */}
        <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e5df' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>Channel Profitability</div>
            <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>Breakdown by sales channel for the selected period</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#faf9f7' }}>
                {['Channel', 'GMV', 'Fees', 'COGS', 'Shipping', 'Net Profit', 'Margin %', 'vs Last Period'].map(col => (
                  <th key={col} style={{
                    padding: '10px 16px', textAlign: col === 'Channel' ? 'left' : 'right',
                    fontSize: 11, fontWeight: 700, color: '#9496b0',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: '1px solid #e8e5df', whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.channels.map((row, idx) => {
                const mc = marginColor(row.marginPct)
                const vp = trendBadge(row.vsPrev)
                const pill = CHANNEL_PILL[row.channel] || { bg: '#f5f3ef', color: '#6b6e87', border: '#e8e5df' }
                return (
                  <tr key={row.channel} style={{ borderBottom: '1px solid #f0ede8' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: pill.bg, color: pill.color, border: `1px solid ${pill.border}`,
                        borderRadius: 100, fontSize: 11, fontWeight: 600, padding: '2px 9px',
                      }}>
                        {row.channel}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#1a1b22' }}>{fmtGBP(row.gmv)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#dc2626' }}>−{fmtGBP(row.fees)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#d97706' }}>−{fmtGBP(row.cogs)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6b6e87' }}>−{fmtGBP(row.shipping)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{fmtGBP(row.netProfit)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{
                        background: mc.bg, color: mc.color, border: `1px solid ${mc.border}`,
                        borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '2px 8px',
                      }}>
                        {row.marginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{
                        background: vp.bg, color: vp.color,
                        borderRadius: 100, fontSize: 11, fontWeight: 600, padding: '2px 8px',
                      }}>
                        +{row.vsPrev}%
                      </span>
                    </td>
                  </tr>
                )
              })}

              {/* Totals row */}
              {(() => {
                const totGmv = data.channels.reduce((s, r) => s + r.gmv, 0)
                const totFees = data.channels.reduce((s, r) => s + r.fees, 0)
                const totCogs = data.channels.reduce((s, r) => s + r.cogs, 0)
                const totShip = data.channels.reduce((s, r) => s + r.shipping, 0)
                const totProfit = data.channels.reduce((s, r) => s + r.netProfit, 0)
                const totMargin = (totProfit / totGmv) * 100
                return (
                  <tr style={{ background: '#faf9f7', borderTop: '2px solid #e8e5df' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1a1b22', fontSize: 12 }}>Total</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#1a1b22' }}>{fmtGBP(totGmv)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>−{fmtGBP(totFees)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#d97706' }}>−{fmtGBP(totCogs)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#6b6e87' }}>−{fmtGBP(totShip)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{fmtGBP(totProfit)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{
                        ...marginColor(totMargin),
                        borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '2px 8px',
                        border: `1px solid ${marginColor(totMargin).border}`,
                      }}>
                        {totMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }} />
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* ── Top 5 SKUs ── */}
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e5df' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>Top 5 SKUs by Profit</div>
              <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>Best-performing products this period</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#faf9f7' }}>
                  {['Product', 'Revenue', 'Margin', 'Units', 'Channel'].map(col => (
                    <th key={col} style={{
                      padding: '8px 14px',
                      textAlign: col === 'Product' ? 'left' : 'right',
                      fontSize: 10, fontWeight: 700, color: '#9496b0',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      borderBottom: '1px solid #e8e5df',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.skus.map((sku, idx) => {
                  const mc = marginColor(sku.marginPct)
                  const pill = CHANNEL_PILL[sku.channel] || { bg: '#f5f3ef', color: '#6b6e87', border: '#e8e5df' }
                  return (
                    <tr key={sku.sku} style={{ borderBottom: idx < data.skus.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1b22', lineHeight: 1.2 }}>{sku.product}</div>
                        <div style={{ fontSize: 10, color: '#9496b0', marginTop: 1 }}>{sku.sku}</div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#1a1b22' }}>{fmtGBP(sku.revenue)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span style={{
                          background: mc.bg, color: mc.color, border: `1px solid ${mc.border}`,
                          borderRadius: 100, fontSize: 10, fontWeight: 700, padding: '1px 6px',
                        }}>
                          {sku.marginPct}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#6b6e87' }}>{sku.unitsSold}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span style={{
                          background: pill.bg, color: pill.color, border: `1px solid ${pill.border}`,
                          borderRadius: 100, fontSize: 10, fontWeight: 600, padding: '1px 7px',
                        }}>
                          {sku.channel}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Margin Leaks ── */}
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e5df', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.5 1.5L13.5 12H1.5L7.5 1.5Z"/>
                <path d="M7.5 6v3"/>
                <circle cx="7.5" cy="10.5" r="0.6" fill="#f59e0b" stroke="none"/>
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>Margin Leaks Detected</div>
                <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 1 }}>Issues eating into your profitability</div>
              </div>
            </div>

            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MARGIN_LEAKS.map(leak => {
                const severityMap = {
                  high:    { border: '#fecaca', bg: '#fef2f2', dot: '#dc2626', impact: '#dc2626' },
                  medium:  { border: '#fde68a', bg: '#fffbeb', dot: '#d97706', impact: '#d97706' },
                  warning: { border: '#c7c3fb', bg: '#f0effd', dot: '#5b52f5', impact: '#5b52f5' },
                }
                const s = severityMap[leak.severity]
                return (
                  <div key={leak.id} style={{
                    border: `1px solid ${s.border}`,
                    background: s.bg,
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>{leak.title}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.impact, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {leak.impact}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#6b6e87', margin: '0 0 10px', lineHeight: 1.5, paddingLeft: 13 }}>
                      {leak.detail}
                    </p>
                    <div style={{ paddingLeft: 13 }}>
                      <button style={{
                        background: '#1a1b22', color: 'white',
                        border: 'none', borderRadius: 6,
                        padding: '5px 12px', fontSize: 11, fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        {leak.action}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
