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

const CHANNEL_META: Record<string, { icon: string; color: string; bg: string; name: string }> = {
  shopify: { icon: '🛍️', color: '#96BF48', bg: '#f5faee', name: 'Shopify' },
  ebay:    { icon: '🛒', color: '#E53238', bg: '#fff5f5', name: 'eBay' },
  amazon:  { icon: '📦', color: '#FF9900', bg: '#fffbf0', name: 'Amazon' },
}

const DAY_OPTIONS = [7, 14, 30, 90]

function fmt(n: number) {
  return `£${n.toFixed(2)}`
}

function marginColor(m: number) {
  if (m >= 25) return '#0f7b6c'
  if (m >= 10) return '#b45309'
  return '#c9372c'
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
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f5f3ef', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#191919', color: 'white', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 200 }}>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: '1000px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', letterSpacing: '-0.02em', marginBottom: '4px' }}>Orders</h1>
              <p style={{ fontSize: '14px', color: '#787774' }}>All sales across every connected channel.</p>
            </div>
            <button
              onClick={syncOrders}
              disabled={syncing}
              style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: syncing ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: syncing ? 0.7 : 1 }}
            >
              {syncing ? 'Syncing…' : '↻ Sync all channels'}
            </button>
          </div>

          {/* Stats strip */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Total revenue', value: fmt(stats.totalRevenue), sub: `last ${days} days` },
                { label: 'True profit',   value: fmt(stats.totalProfit),  sub: stats.totalRevenue > 0 ? `${((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)}% margin` : '—', color: stats.totalProfit >= 0 ? '#0f7b6c' : '#c9372c' },
                { label: 'Orders',        value: stats.totalOrders.toString(), sub: `${days}-day window` },
                { label: 'Avg. order',    value: stats.totalOrders > 0 ? fmt(stats.totalRevenue / stats.totalOrders) : '£0', sub: 'per transaction' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{s.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: (s as any).color || '#191919', letterSpacing: '-0.02em' }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: '#9b9b98', marginTop: '2px' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Channel breakdown */}
          {stats && Object.keys(stats.byChannel).length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {Object.entries(stats.byChannel).map(([ch, s]) => {
                const meta = CHANNEL_META[ch] || { icon: '🏪', color: '#9b9b98', bg: '#f1f1ef', name: ch }
                return (
                  <div key={ch}
                    onClick={() => { setChannel(channel === ch ? '' : ch); setPage(1) }}
                    style={{ background: channel === ch ? meta.bg : 'white', border: `1px solid ${channel === ch ? meta.color + '44' : '#e8e8e5'}`, borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span>{meta.icon}</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#191919' }}>{meta.name}</div>
                      <div style={{ fontSize: '11px', color: '#787774' }}>{s.orders} orders · {fmt(s.revenue)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Filters row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', background: 'white', border: '1px solid #e8e8e5', borderRadius: '7px', overflow: 'hidden' }}>
              {DAY_OPTIONS.map(d => (
                <button key={d} onClick={() => { setDays(d); setPage(1) }}
                  style={{ background: days === d ? '#191919' : 'transparent', color: days === d ? 'white' : '#787774', border: 'none', padding: '7px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {d}d
                </button>
              ))}
            </div>
            {channel && (
              <button onClick={() => { setChannel(''); setPage(1) }}
                style={{ background: '#fce8e6', color: '#c9372c', border: 'none', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                ✕ {CHANNEL_META[channel]?.name || channel}
              </button>
            )}
            <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#9b9b98' }}>
              {total} {total === 1 ? 'order' : 'orders'}
            </div>
          </div>

          {/* Orders table */}
          <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 70px 90px', gap: '0', padding: '10px 20px', borderBottom: '1px solid #f1f1ef', background: '#fafafa' }}>
              {['Item', 'Revenue', 'Profit', 'Margin', 'Channel', 'Date'].map(h => (
                <div key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#787774', fontSize: '14px' }}>Loading orders…</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📭</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#191919', marginBottom: '6px' }}>No orders yet</div>
                <div style={{ fontSize: '13px', color: '#787774', marginBottom: '20px' }}>Connect a channel and sync to see your orders here.</div>
                <button onClick={syncOrders} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '7px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Sync channels now
                </button>
              </div>
            ) : (
              orders.map((order, i) => {
                const meta = CHANNEL_META[order.channel] || { icon: '🏪', color: '#9b9b98', name: order.channel }
                return (
                  <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 70px 90px', gap: '0', padding: '12px 20px', borderBottom: i < orders.length - 1 ? '1px solid #f7f7f5' : 'none', alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.title}</div>
                      {order.sku && <div style={{ fontSize: '11px', color: '#9b9b98', marginTop: '1px' }}>SKU: {order.sku}</div>}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>{fmt(order.gross_revenue)}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: order.true_profit >= 0 ? '#0f7b6c' : '#c9372c' }}>{fmt(order.true_profit)}</div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: marginColor(order.true_margin), background: '#f5f3ef', padding: '2px 7px', borderRadius: '4px' }}>
                        {order.true_margin?.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#787774' }}>
                      <span>{meta.icon}</span>
                      <span>{meta.name}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#9b9b98' }}>
                      {new Date(order.order_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? '#c0c0bc' : '#191919', fontFamily: 'Inter, sans-serif' }}>
                ← Prev
              </button>
              <span style={{ fontSize: '13px', color: '#787774' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? '#c0c0bc' : '#191919', fontFamily: 'Inter, sans-serif' }}>
                Next →
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
