'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'

interface Order {
  id: string
  channel: string
  external_id: string
  sku?: string
  title: string
  sale_price: number
  gross_revenue: number
  true_profit: number
  true_margin: number
  channel_fee: number
  shipping_cost: number
  supplier_cost: number
  order_date: string
  buyer_location?: string
}

interface Stats {
  totalRevenue: number
  totalProfit: number
  totalOrders: number
  byChannel: Record<string, { revenue: number; profit: number; orders: number }>
}

const CHANNEL_META: Record<string, { icon: string; color: string; bg: string; name: string; pill: string }> = {
  shopify: { icon: '🛍️', color: '#96BF48', bg: '#f3f9ec', name: 'Shopify', pill: '#96BF4820' },
  ebay:    { icon: '🛒', color: '#E53238', bg: '#fff3f3', name: 'eBay',    pill: '#E5323820' },
  amazon:  { icon: '📦', color: '#FF9900', bg: '#fffbf0', name: 'Amazon',  pill: '#FF990020' },
}

const DAY_OPTIONS = [7, 14, 30, 90]

function fmt(n: number) {
  return `£${n.toFixed(2)}`
}

function marginBadge(m: number): { color: string; bg: string; border: string } {
  if (m >= 25) return { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' }
  if (m >= 10) return { color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
  return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders]         = useState<Order[]>([])
  const [stats, setStats]           = useState<Stats | null>(null)
  const [loading, setLoading]       = useState(true)
  const [channel, setChannel]       = useState<string>('')
  const [days, setDays]             = useState(30)
  const [page, setPage]             = useState(1)
  const [total, setTotal]           = useState(0)
  const [syncing, setSyncing]       = useState(false)
  const [toast, setToast]           = useState('')
  const [rowHover, setRowHover]     = useState<string | null>(null)

  const PAGE_SIZE = 50

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ days: String(days), page: String(page) })
    if (channel) params.set('channel', channel)
    const res = await fetch(`/api/orders?${params}`)
    if (res.status === 401) { router.push('/login'); return }
    const json = await res.json()
    setOrders(json.orders || [])
    setStats(json.stats || null)
    setTotal(json.total || 0)
    setLoading(false)
  }, [channel, days, page, router])

  useEffect(() => { load() }, [load])

  async function syncOrders() {
    setSyncing(true)
    try {
      const results = await Promise.allSettled([
        fetch('/api/shopify/sync',       { method: 'POST' }).then(r => r.json()),
        fetch('/api/ebay/orders/sync',   { method: 'POST' }).then(r => r.json()),
      ])
      const msgs = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value.message)
        .filter(Boolean)
      showToast(msgs.join(' · ') || 'Sync complete')
      load()
    } catch {
      showToast('Sync failed — please try again')
    } finally {
      setSyncing(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', minHeight: '100vh', background: '#f8f4ec', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'white', color: '#1a1b22',
          border: '1px solid #e8e5df',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
          borderRadius: 10, padding: '14px 18px',
          fontSize: 13, fontWeight: 500, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 10,
          borderLeft: '3px solid #059669',
          fontFamily: 'inherit',
        }}>
          <span style={{ color: '#059669' }}>✓</span>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: '1000px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1b22', letterSpacing: '-0.03em', margin: 0 }}>Orders</h1>
              <p style={{ fontSize: 14, color: '#6b6e87', margin: '4px 0 0' }}>All sales across every connected channel.</p>
            </div>
            <button
              onClick={syncOrders}
              disabled={syncing}
              style={{
                background: '#e8863f', color: 'white', border: 'none',
                borderRadius: 8, padding: '10px 18px',
                fontSize: 13, fontWeight: 600, cursor: syncing ? 'wait' : 'pointer',
                fontFamily: 'inherit', opacity: syncing ? 0.7 : 1,
              }}
            >
              {syncing ? 'Syncing…' : '↻ Sync all channels'}
            </button>
          </div>

          {/* Stats strip */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                {
                  label: 'Total revenue',
                  value: fmt(stats.totalRevenue),
                  sub: `last ${days} days`,
                  accent: '#e8863f',
                },
                {
                  label: 'True profit',
                  value: fmt(stats.totalProfit),
                  sub: stats.totalRevenue > 0 ? `${((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)}% margin` : '—',
                  accent: '#059669',
                  valueColor: stats.totalProfit >= 0 ? '#059669' : '#dc2626',
                },
                {
                  label: 'Orders',
                  value: stats.totalOrders.toString(),
                  sub: `${days}-day window`,
                  accent: '#6b6e87',
                },
                {
                  label: 'Avg. order',
                  value: stats.totalOrders > 0 ? fmt(stats.totalRevenue / stats.totalOrders) : '£0',
                  sub: 'per transaction',
                  accent: '#6b6e87',
                },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'white',
                  border: '1px solid #e8e5df',
                  borderRadius: 12,
                  padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
                  borderLeft: `3px solid ${s.accent}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: (s as any).valueColor || '#1a1b22', letterSpacing: '-0.03em', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#9496b0', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Channel filter pills */}
          {stats && Object.keys(stats.byChannel).length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {Object.entries(stats.byChannel).map(([ch, s]) => {
                const meta = CHANNEL_META[ch] || { icon: '🏪', color: '#9496b0', bg: '#f8f4ec', name: ch, pill: '#f8f4ec' }
                const isActive = channel === ch
                return (
                  <div key={ch}
                    onClick={() => { setChannel(channel === ch ? '' : ch); setPage(1) }}
                    style={{
                      background: isActive ? meta.bg : 'white',
                      border: `1px solid ${isActive ? meta.color + '55' : '#e8e5df'}`,
                      borderRadius: 20,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: isActive ? `0 0 0 3px ${meta.color}18` : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{meta.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22' }}>{meta.name}</div>
                      <div style={{ fontSize: 11, color: '#6b6e87' }}>{s.orders} orders · {fmt(s.revenue)}</div>
                    </div>
                    {isActive && <span style={{ fontSize: 11, color: meta.color, fontWeight: 700 }}>✕</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Filters row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {/* Day range pills */}
            <div style={{ display: 'flex', gap: 4 }}>
              {DAY_OPTIONS.map(d => (
                <button key={d} onClick={() => { setDays(d); setPage(1) }}
                  style={{
                    background: days === d ? '#e8863f' : 'white',
                    color: days === d ? 'white' : '#6b6e87',
                    border: `1px solid ${days === d ? '#e8863f' : '#e8e5df'}`,
                    borderRadius: 20,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: days === d ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>
                  {d}d
                </button>
              ))}
            </div>
            {channel && (
              <button onClick={() => { setChannel(''); setPage(1) }}
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✕ {CHANNEL_META[channel]?.name || channel}
              </button>
            )}
            <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9496b0' }}>
              {total} {total === 1 ? 'order' : 'orders'}
            </div>
          </div>

          {/* Orders table */}
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px 88px 80px 80px 90px', padding: '10px 20px', borderBottom: '1px solid #f0ede8', background: '#fafaf9' }}>
              {['Item', 'Revenue', 'Profit', 'Margin', 'Channel', 'Date'].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#6b6e87', fontSize: 14 }}>Loading orders…</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: '#f8f4ec', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>📭</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1b22', marginBottom: 6 }}>No orders yet</div>
                <div style={{ fontSize: 13, color: '#6b6e87', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>Connect a channel and sync to see your orders here.</div>
                <button onClick={syncOrders} style={{
                  background: '#e8863f', color: 'white', border: 'none',
                  borderRadius: 8, padding: '10px 18px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Sync channels now
                </button>
              </div>
            ) : (
              orders.map((order, i) => {
                const meta = CHANNEL_META[order.channel] || { icon: '🏪', color: '#9496b0', name: order.channel }
                const badge = marginBadge(order.true_margin)
                const isHovered = rowHover === order.id
                return (
                  <div
                    key={order.id}
                    onMouseEnter={() => setRowHover(order.id)}
                    onMouseLeave={() => setRowHover(null)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 88px 88px 80px 80px 90px',
                      padding: '12px 20px',
                      borderBottom: i < orders.length - 1 ? '1px solid #f0ede8' : 'none',
                      alignItems: 'center',
                      background: isHovered ? '#f9f8f6' : 'white',
                      transition: 'background 0.1s',
                    }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1b22', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.title}</div>
                      {order.sku && <div style={{ fontSize: 11, color: '#9496b0', marginTop: 1, fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>SKU: {order.sku}</div>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>{fmt(order.gross_revenue)}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: order.true_profit >= 0 ? '#059669' : '#dc2626', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>{fmt(order.true_profit)}</div>
                    <div>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: badge.color,
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        padding: '3px 8px',
                        borderRadius: 100,
                        fontFamily: 'var(--font-mono), ui-monospace, monospace',
                      }}>
                        {order.true_margin?.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b6e87' }}>
                      <span>{meta.icon}</span>
                      <span>{meta.name}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9496b0' }}>
                      {new Date(order.order_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? '#9496b0' : '#1a1b22', fontFamily: 'inherit' }}>
                ← Prev
              </button>
              <span style={{ fontSize: 13, color: '#6b6e87' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? '#9496b0' : '#1a1b22', fontFamily: 'inherit' }}>
                Next →
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
