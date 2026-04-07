'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ListingError {
  id: string
  listing_id: string
  channel: string
  error_message: string
  updated_at: string
  title: string
  sku: string | null
  resolved?: boolean
}

interface OrderError {
  id: string
  channel: string
  status: string
  error_message: string
  updated_at: string
  external_id: string
  resolved?: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHANNEL_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  ebay:    { bg: '#fff0e6', color: '#d9730d', label: 'eBay' },
  shopify: { bg: '#e8f1fb', color: '#2383e2', label: 'Shopify' },
  amazon:  { bg: '#fff3e6', color: '#d9730d', label: 'Amazon' },
}

function getChannelBadge(channel: string) {
  return CHANNEL_BADGE[channel?.toLowerCase()] ?? { bg: '#f1f1ef', color: '#787774', label: channel ?? 'Unknown' }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: string }) {
  const badge = getChannelBadge(channel)
  return (
    <span style={{
      display: 'inline-block',
      background: badge.bg,
      color: badge.color,
      fontSize: '11px',
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: '100px',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {badge.label}
    </span>
  )
}

// ─── Fix Side Panel ───────────────────────────────────────────────────────────

interface SidePanelProps {
  error: ListingError | null
  onClose: () => void
  onResolved: (id: string) => void
}

function SidePanel({ error, onClose, onResolved }: SidePanelProps) {
  const [fixValue, setFixValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const show = error !== null

  useEffect(() => {
    setFixValue('')
    setSaveError('')
  }, [error?.id])

  async function handleSave() {
    if (!error || !fixValue.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/listings/${error.listing_id}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: extractFieldName(error.error_message),
          value: fixValue.trim(),
          channel: error.channel,
        }),
      })
      if (res.ok) {
        onResolved(error.id)
        onClose()
      } else {
        const d = await res.json().catch(() => ({}))
        setSaveError(d.error || 'Failed to save fix')
      }
    } catch {
      setSaveError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  function extractFieldName(msg: string) {
    // Heuristic: "Missing: Brand" → "brand"
    const m = msg.match(/missing[:\s]+([a-zA-Z _]+)/i)
    if (m) return m[1].trim().toLowerCase().replace(/\s+/g, '_')
    return 'value'
  }

  const fieldLabel = error ? extractFieldName(error.error_message) : 'value'

  return (
    <>
      {/* Backdrop */}
      {show && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.15)',
            zIndex: 99,
          }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: '420px',
        background: 'white',
        borderLeft: '1px solid #e8e8e5',
        zIndex: 100,
        padding: '32px',
        overflowY: 'auto',
        transform: show ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.2s ease',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        {error && (
          <>
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Fix Error
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#191919', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.3 }}>
                  {error.error_message.length > 50
                    ? error.error_message.slice(0, 50) + '…'
                    : error.error_message}
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#9b9b98', cursor: 'pointer', padding: '0', lineHeight: 1, marginTop: '2px' }}
              >
                ×
              </button>
            </div>

            {/* Product + channel */}
            <div style={{ background: '#f5f3ef', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919', marginBottom: '4px' }}>{error.title}</div>
              {error.sku && <div style={{ fontSize: '12px', color: '#9b9b98', marginBottom: '8px' }}>SKU: {error.sku}</div>}
              <ChannelBadge channel={error.channel} />
            </div>

            {/* WHAT */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#c9372c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                WHAT
              </div>
              <div style={{ fontSize: '13px', color: '#191919', lineHeight: 1.5 }}>
                {error.error_message}
              </div>
            </div>

            {/* WHERE */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#d9730d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                WHERE
              </div>
              <div style={{ fontSize: '13px', color: '#191919', lineHeight: 1.5 }}>
                {error.title}{error.sku ? ` (${error.sku})` : ''} on{' '}
                <strong>{getChannelBadge(error.channel).label}</strong>
              </div>
            </div>

            {/* WHY */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#2383e2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                WHY — {getChannelBadge(error.channel).label} requirement
              </div>
              <div style={{ fontSize: '13px', color: '#787774', lineHeight: 1.5 }}>
                {getChannelBadge(error.channel).label} requires this field to be present and valid
                before the listing can be published. Missing or invalid values prevent the
                item from appearing in search results.
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#e8e8e5', marginBottom: '24px' }} />

            {/* FIX */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f7b6c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                FIX
              </div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#191919', marginBottom: '6px', textTransform: 'capitalize' }}>
                {fieldLabel.replace(/_/g, ' ')}
              </label>
              <input
                type="text"
                value={fixValue}
                onChange={e => setFixValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder={`Enter ${fieldLabel.replace(/_/g, ' ')}…`}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: '1px solid #e8e8e5',
                  borderRadius: '7px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  color: '#191919',
                  outline: 'none',
                  background: 'white',
                }}
              />
            </div>

            {saveError && (
              <div style={{ fontSize: '12px', color: '#c9372c', marginBottom: '12px' }}>{saveError}</div>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={handleSave}
                disabled={saving || !fixValue.trim()}
                style={{
                  flex: 1,
                  background: saving || !fixValue.trim() ? '#c0c0bc' : '#191919',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: saving || !fixValue.trim() ? 'default' : 'pointer',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  transition: 'background 0.15s',
                }}
              >
                {saving ? 'Saving…' : 'Save Fix'}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  color: '#787774',
                  cursor: 'pointer',
                  padding: '11px 4px',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── Bulk Fix Modal ───────────────────────────────────────────────────────────

interface BulkFixModalProps {
  errors: ListingError[]
  onClose: () => void
  onAllResolved: (ids: string[]) => void
}

function BulkFixModal({ errors, onClose, onAllResolved }: BulkFixModalProps) {
  const [fixValue, setFixValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const commonField = useMemo(() => {
    if (errors.length === 0) return 'value'
    const fields = errors.map(e => {
      const m = e.error_message.match(/missing[:\s]+([a-zA-Z _]+)/i)
      return m ? m[1].trim().toLowerCase() : 'value'
    })
    const unique = new Set(fields)
    return unique.size === 1 ? [...unique][0] : ''
  }, [errors])

  async function handleApplyAll() {
    if (!fixValue.trim() || !commonField) return
    setSaving(true)
    const ids: string[] = []
    await Promise.allSettled(
      errors.map(async e => {
        try {
          const res = await fetch(`/api/listings/${e.listing_id}/fix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field: commonField, value: fixValue.trim(), channel: e.channel }),
          })
          if (res.ok) ids.push(e.id)
        } catch { /* ignore */ }
      })
    )
    setSaving(false)
    setDone(true)
    setTimeout(() => {
      onAllResolved(ids)
      onClose()
    }, 800)
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }}
      />
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '480px',
        maxWidth: '90vw',
        zIndex: 201,
        fontFamily: 'Inter, -apple-system, sans-serif',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#191919', margin: 0, letterSpacing: '-0.02em' }}>
            Fix {errors.length} listing {errors.length === 1 ? 'error' : 'errors'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#9b9b98', cursor: 'pointer' }}>×</button>
        </div>

        {/* Affected products */}
        <div style={{ background: '#f5f3ef', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', maxHeight: '160px', overflowY: 'auto' }}>
          {errors.slice(0, 20).map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ChannelBadge channel={e.channel} />
              <span style={{ fontSize: '12px', color: '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
            </div>
          ))}
          {errors.length > 20 && (
            <div style={{ fontSize: '12px', color: '#9b9b98', marginTop: '4px' }}>…and {errors.length - 20} more</div>
          )}
        </div>

        {commonField ? (
          <>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#191919', marginBottom: '6px', textTransform: 'capitalize' }}>
              {commonField.replace(/_/g, ' ')} — apply to all
            </label>
            <input
              type="text"
              value={fixValue}
              onChange={e => setFixValue(e.target.value)}
              placeholder={`Enter ${commonField.replace(/_/g, ' ')} for all products…`}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid #e8e8e5',
                borderRadius: '7px',
                padding: '10px 12px',
                fontSize: '13px',
                fontFamily: 'Inter, -apple-system, sans-serif',
                color: '#191919',
                outline: 'none',
                marginBottom: '16px',
              }}
            />
          </>
        ) : (
          <div style={{ fontSize: '13px', color: '#787774', marginBottom: '16px', padding: '10px 12px', background: '#fff3e6', borderRadius: '7px' }}>
            These errors have different fields — use individual Fix buttons to resolve each.
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleApplyAll}
            disabled={saving || done || !fixValue.trim() || !commonField}
            style={{
              flex: 1,
              background: done ? '#0f7b6c' : saving || !fixValue.trim() || !commonField ? '#c0c0bc' : '#191919',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '11px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: saving || !fixValue.trim() || !commonField ? 'default' : 'pointer',
              fontFamily: 'Inter, -apple-system, sans-serif',
              transition: 'background 0.2s',
            }}
          >
            {done ? '✓ Applied' : saving ? 'Applying…' : 'Apply to All'}
          </button>
          <button
            onClick={onClose}
            style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '8px', padding: '11px 18px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', color: '#191919' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Error Group Section ──────────────────────────────────────────────────────

interface ErrorGroupProps {
  title: string
  icon: string
  errors: ListingError[]
  selected: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: (ids: string[]) => void
  onFix: (error: ListingError) => void
  onFixAll: () => void
}

function ErrorGroup({
  title, icon, errors, selected,
  onToggleSelect, onToggleSelectAll, onFix, onFixAll
}: ErrorGroupProps) {
  const [collapsed, setCollapsed] = useState(false)
  const ids = errors.map(e => e.id)
  const allChecked = ids.length > 0 && ids.every(id => selected.has(id))

  if (errors.length === 0) return null

  return (
    <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
      {/* Group header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        background: '#fafafa',
        borderBottom: collapsed ? 'none' : '1px solid #e8e8e5',
        cursor: 'pointer',
        userSelect: 'none',
      }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>{icon}</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#c9372c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {title}
          </span>
          <span style={{
            background: '#fce8e6', color: '#c9372c',
            fontSize: '11px', fontWeight: 700,
            padding: '1px 7px', borderRadius: '100px',
          }}>
            {errors.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={e => { e.stopPropagation(); onFixAll() }}
            style={{
              background: '#191919', color: 'white',
              border: 'none', borderRadius: '6px',
              padding: '6px 12px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            Fix All ▾
          </button>
          <span style={{ fontSize: '13px', color: '#9b9b98', transform: collapsed ? 'rotate(-90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>
            ▾
          </span>
        </div>
      </div>

      {/* Table */}
      {!collapsed && (
        <>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 90px 1fr 110px 80px',
            gap: '0',
            padding: '8px 20px',
            borderBottom: '1px solid #f1f1ef',
            background: '#fafafa',
          }}>
            <div>
              <input
                type="checkbox"
                checked={allChecked}
                onChange={() => onToggleSelectAll(ids)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            {['Product', 'Channel', 'Error', 'Last seen', ''].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {errors.map((error, i) => (
            <div
              key={error.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr 90px 1fr 110px 80px',
                gap: '0',
                padding: '12px 20px',
                borderBottom: i < errors.length - 1 ? '1px solid #f7f7f5' : 'none',
                alignItems: 'center',
                background: selected.has(error.id) ? '#fafafa' : 'white',
                transition: 'background 0.1s',
              }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selected.has(error.id)}
                  onChange={() => onToggleSelect(error.id)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <div style={{ minWidth: 0, paddingRight: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {error.title}
                </div>
                {error.sku && (
                  <div style={{ fontSize: '11px', color: '#9b9b98', marginTop: '1px' }}>SKU: {error.sku}</div>
                )}
              </div>
              <div>
                <ChannelBadge channel={error.channel} />
              </div>
              <div style={{ fontSize: '12px', color: '#787774', paddingRight: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {error.error_message}
              </div>
              <div style={{ fontSize: '12px', color: '#9b9b98' }}>
                {fmtDate(error.updated_at)}
              </div>
              <div>
                <button
                  onClick={() => onFix(error)}
                  style={{
                    background: 'white',
                    color: '#2383e2',
                    border: '1px solid #2383e2',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Fix →
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ErrorsPage() {
  const router = useRouter()

  const [listingErrors, setListingErrors] = useState<ListingError[]>([])
  const [orderErrors, setOrderErrors]     = useState<OrderError[]>([])
  const [loading, setLoading]             = useState(true)
  const [toast, setToast]                 = useState('')

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>('')
  const [typeFilter, setTypeFilter]       = useState<string>('')
  const [showResolved, setShowResolved]   = useState(false)

  // Selected rows
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Side panel
  const [panelError, setPanelError] = useState<ListingError | null>(null)

  // Bulk fix modal
  const [bulkFixGroup, setBulkFixGroup] = useState<ListingError[] | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  useEffect(() => {
    fetch('/api/errors')
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then(d => {
        if (!d) return
        setListingErrors((d.listing_errors || []).map((e: ListingError) => ({ ...e, resolved: false })))
        setOrderErrors((d.order_errors || []).map((e: OrderError) => ({ ...e, resolved: false })))
      })
      .catch(() => showToast('Failed to load errors'))
      .finally(() => setLoading(false))
  }, [router])

  function markResolved(id: string) {
    setListingErrors(prev => prev.map(e => e.id === id ? { ...e, resolved: true } : e))
    setOrderErrors(prev => prev.map(e => e.id === id ? { ...e, resolved: true } : e))
    showToast('Error resolved')
  }

  function markAllResolved(ids: string[]) {
    const set = new Set(ids)
    setListingErrors(prev => prev.map(e => set.has(e.id) ? { ...e, resolved: true } : e))
    showToast(`${ids.length} errors resolved`)
  }

  // Filtered views
  const visibleListingErrors = useMemo(() => {
    let out = listingErrors
    if (!showResolved) out = out.filter(e => !e.resolved)
    if (channelFilter) out = out.filter(e => e.channel?.toLowerCase() === channelFilter)
    if (typeFilter && typeFilter !== 'listing') out = []
    return out
  }, [listingErrors, showResolved, channelFilter, typeFilter])

  const visibleOrderErrors = useMemo(() => {
    let out = orderErrors
    if (!showResolved) out = out.filter((e: any) => !e.resolved)
    if (channelFilter) out = out.filter(e => e.channel?.toLowerCase() === channelFilter)
    if (typeFilter && typeFilter !== 'order') out = []
    return out
  }, [orderErrors, showResolved, channelFilter, typeFilter])

  const totalVisible = visibleListingErrors.length + visibleOrderErrors.length
  const totalAll = listingErrors.length + orderErrors.length

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function toggleSelectAll(ids: string[]) {
    setSelected(prev => {
      const n = new Set(prev)
      const allIn = ids.every(id => n.has(id))
      if (allIn) {
        ids.forEach(id => n.delete(id))
      } else {
        ids.forEach(id => n.add(id))
      }
      return n
    })
  }

  const selectStyle = {
    background: 'white',
    border: '1px solid #e8e8e5',
    borderRadius: '7px',
    padding: '7px 10px',
    fontSize: '13px',
    color: '#191919',
    fontFamily: 'Inter, -apple-system, sans-serif',
    cursor: 'pointer',
    outline: 'none',
  } as const

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f5f3ef', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#191919', color: 'white', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 300 }}>
          {toast}
        </div>
      )}

      {/* Side panel */}
      <SidePanel
        error={panelError}
        onClose={() => setPanelError(null)}
        onResolved={markResolved}
      />

      {/* Bulk fix modal */}
      {bulkFixGroup && (
        <BulkFixModal
          errors={bulkFixGroup}
          onClose={() => setBulkFixGroup(null)}
          onAllResolved={ids => { markAllResolved(ids); setBulkFixGroup(null) }}
        />
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: '1040px' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                Error Hub
              </h1>
              <p style={{ fontSize: '14px', color: '#787774' }}>
                Review and resolve issues across all channels.
              </p>
            </div>
            {totalAll > 0 && (
              <div style={{
                background: '#fce8e6',
                color: '#c9372c',
                fontSize: '13px',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: '100px',
                letterSpacing: '-0.01em',
              }}>
                {totalAll} {totalAll === 1 ? 'error' : 'errors'}
              </div>
            )}
          </div>

          {/* ── Filter bar ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="">All Channels</option>
              <option value="shopify">Shopify</option>
              <option value="ebay">eBay</option>
              <option value="amazon">Amazon</option>
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="">All Types</option>
              <option value="listing">Listing Errors</option>
              <option value="order">Order Errors</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#787774', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showResolved}
                onChange={e => setShowResolved(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Show resolved
            </label>

            {(channelFilter || typeFilter) && (
              <button
                onClick={() => { setChannelFilter(''); setTypeFilter('') }}
                style={{ background: '#f1f1ef', border: 'none', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', color: '#787774', cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}
              >
                Clear filters
              </button>
            )}

            <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#9b9b98' }}>
              {loading ? 'Loading…' : `${totalVisible} issue${totalVisible !== 1 ? 's' : ''} shown`}
            </div>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div style={{ padding: '64px', textAlign: 'center', color: '#787774', fontSize: '14px' }}>
              Loading errors…
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && totalVisible === 0 && (
            <div style={{
              background: 'white',
              border: '1px solid #e8e8e5',
              borderRadius: '12px',
              padding: '64px 40px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>✅</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#191919', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                All caught up
              </div>
              <div style={{ fontSize: '14px', color: '#787774' }}>
                No errors found across your channels.
              </div>
            </div>
          )}

          {/* ── Listing Errors group ── */}
          {!loading && (typeFilter === '' || typeFilter === 'listing') && (
            <ErrorGroup
              title="Listing Errors"
              icon="⚠"
              errors={visibleListingErrors}
              selected={selected}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onFix={error => setPanelError(error)}
              onFixAll={() => setBulkFixGroup(visibleListingErrors)}
            />
          )}

          {/* ── Order Errors group ── */}
          {!loading && (typeFilter === '' || typeFilter === 'order') && visibleOrderErrors.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
              {/* Group header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px',
                background: '#fafafa',
                borderBottom: '1px solid #e8e8e5',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>📦</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#c9372c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Order Errors
                  </span>
                  <span style={{ background: '#fce8e6', color: '#c9372c', fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '100px' }}>
                    {visibleOrderErrors.length}
                  </span>
                </div>
              </div>

              {/* Order table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 1fr 110px', gap: '0', padding: '8px 20px', borderBottom: '1px solid #f1f1ef', background: '#fafafa' }}>
                {['Order ID', 'Channel', 'Error', 'Last seen'].map(h => (
                  <div key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                ))}
              </div>

              {visibleOrderErrors.map((error, i) => (
                <div
                  key={error.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px 1fr 110px',
                    gap: '0',
                    padding: '12px 20px',
                    borderBottom: i < visibleOrderErrors.length - 1 ? '1px solid #f7f7f5' : 'none',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#191919' }}>
                    {error.external_id || error.id}
                  </div>
                  <div><ChannelBadge channel={error.channel} /></div>
                  <div style={{ fontSize: '12px', color: '#787774', paddingRight: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {error.error_message || 'Unknown error'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9b9b98' }}>
                    {fmtDate(error.updated_at)}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
