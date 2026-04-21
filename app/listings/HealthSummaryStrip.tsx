'use client'

/**
 * Listing-health summary strip + per-row badge + drawer.
 * Cream/ink/cobalt palette, Instrument-Serif-friendly typography.
 * Mounted at the top of /listings (additive — does not rewrite the page).
 */
import { useEffect, useMemo, useState } from 'react'
import { createClient as createSupabaseClient } from '../lib/supabase-client'

type HealthRow = {
  listing_id: string
  channel: string
  health_score: number
  errors_count: number
  warnings_count: number
  issues: any
  last_validated_at: string | null
}

const CREAM = '#f8f4ec'
const INK = '#0b0f1a'
const COBALT = '#e8863f'
const EMERALD = '#0f8a5b'
const AMBER = '#b88404'
const OXBLOOD = '#a4243b'

export function bandFor(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Healthy', color: EMERALD, bg: '#e3f4ec' }
  if (score >= 50) return { label: 'Warnings', color: AMBER, bg: '#fbf3df' }
  return { label: 'Errors', color: OXBLOOD, bg: '#f5e1e5' }
}

export function HealthBadge({ score, onClick }: { score: number; onClick?: () => void }) {
  const b = bandFor(score)
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 8px',
        background: b.bg,
        color: b.color,
        border: 'none',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'Geist, Inter, sans-serif',
        letterSpacing: '0.02em',
      }}
      title={`Health ${score}/100`}
    >
      {score}
    </button>
  )
}

export function useListingHealth(): {
  rows: HealthRow[]
  byListing: Map<string, HealthRow>
  totals: { errors: number; warnings: number; healthy: number }
  reload: () => void
} {
  const [rows, setRows] = useState<HealthRow[]>([])
  const sb = useMemo(() => createSupabaseClient(), [])

  const reload = async () => {
    const { data } = await sb
      .from('listing_health')
      .select('listing_id, channel, health_score, errors_count, warnings_count, issues, last_validated_at')
    setRows((data ?? []) as HealthRow[])
  }

  useEffect(() => { reload() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  const byListing = useMemo(() => {
    const m = new Map<string, HealthRow>()
    for (const r of rows) {
      const prev = m.get(r.listing_id)
      if (!prev || r.health_score < prev.health_score) m.set(r.listing_id, r)
    }
    return m
  }, [rows])

  const totals = useMemo(() => {
    let errors = 0, warnings = 0, healthy = 0
    for (const r of byListing.values()) {
      if (r.errors_count > 0) errors++
      else if (r.warnings_count > 0) warnings++
      else healthy++
    }
    return { errors, warnings, healthy }
  }, [byListing])

  return { rows, byListing, totals, reload }
}

export function HealthSummaryStrip({
  totals, activeFilter, onFilter,
}: {
  totals: { errors: number; warnings: number; healthy: number }
  activeFilter: 'all' | 'errors' | 'warnings' | 'healthy'
  onFilter: (f: 'all' | 'errors' | 'warnings' | 'healthy') => void
}) {
  const Chip = ({ id, label, count, color }: { id: any; label: string; count: number; color: string }) => {
    const active = activeFilter === id
    return (
      <button
        onClick={() => onFilter(id)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 999,
          background: active ? INK : CREAM,
          color: active ? CREAM : INK,
          border: `1.5px solid ${active ? INK : '#dcd6c8'}`,
          fontFamily: 'Geist, Inter, sans-serif',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          letterSpacing: '0.01em',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
        {label}
        <span style={{ opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      </button>
    )
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '14px 16px', marginBottom: 16,
        background: CREAM, border: '1px solid #e6dfce', borderRadius: 12,
      }}
    >
      <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 17, color: INK, marginRight: 6, letterSpacing: '-0.01em' }}>
        Listing health
      </div>
      <Chip id="errors"   label="Publish errors" count={totals.errors}   color={OXBLOOD} />
      <Chip id="warnings" label="Warnings"       count={totals.warnings} color={AMBER} />
      <Chip id="healthy"  label="Healthy"        count={totals.healthy}  color={EMERALD} />
      {activeFilter !== 'all' && (
        <button
          onClick={() => onFilter('all')}
          style={{
            background: 'transparent', border: 'none', color: COBALT,
            fontFamily: 'Geist, Inter, sans-serif', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', textDecoration: 'underline',
          }}
        >Clear</button>
      )}
    </div>
  )
}

export function HealthDrawer({
  open, onClose, listingId, listingTitle,
}: {
  open: boolean; onClose: () => void; listingId: string | null; listingTitle: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [validation, setValidation] = useState<any | null>(null)
  const [autofixState, setAutofixState] = useState<Record<string, 'idle' | 'pending' | 'done' | 'error'>>({})
  const [suggestions, setSuggestions] = useState<Array<{ ebayCategoryId: string; ebayCategoryPath: string; confidence: number; source: string; reason?: string }>>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [aspectsLoading, setAspectsLoading] = useState(false)

  const load = async () => {
    if (!listingId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/health`, { method: 'POST' })
      const j = await res.json()
      setValidation(j.validation)
    } finally { setLoading(false) }
  }

  const loadSuggestions = async () => {
    if (!listingId) return
    setSuggestLoading(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/suggest-category`)
      const j = await res.json()
      setSuggestions(j.suggestions ?? [])
    } finally { setSuggestLoading(false) }
  }

  const applySuggestion = async (ebayCategoryId: string) => {
    if (!listingId) return
    await fetch(`/api/listings/${listingId}/autofix`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule: 'EBAY_CATEGORY_MAPPED', categoryId: ebayCategoryId }),
    }).catch(() => {})
    await load()
  }

  const enrichAspects = async () => {
    if (!listingId) return
    setAspectsLoading(true)
    try {
      await fetch(`/api/listings/${listingId}/enrich-aspects?channel=ebay`, { method: 'POST' })
      await load()
    } finally { setAspectsLoading(false) }
  }

  useEffect(() => {
    if (open && listingId) load()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [open, listingId])

  if (!open) return null

  const issues: any[] = validation?.issues ?? []

  const AUTO_FIX_HANDLERS: Record<string, () => Promise<void>> = {
    EBAY_GTIN_REQUIRED: async () => {
      // Apply Shopify barcode as GTIN — server-side endpoint not in this bundle.
      await fetch(`/api/listings/${listingId}/autofix`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: 'EBAY_GTIN_REQUIRED' }),
      }).catch(() => {})
    },
    EBAY_CONDITION_SET: async () => {
      await fetch(`/api/listings/${listingId}/autofix`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: 'EBAY_CONDITION_SET' }),
      }).catch(() => {})
    },
    EBAY_CATEGORY_MAPPED: async () => {
      await fetch(`/api/listings/${listingId}/autofix`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: 'EBAY_CATEGORY_MAPPED' }),
      }).catch(() => {})
    },
  }

  const runAutoFix = async (ruleId: string) => {
    setAutofixState(s => ({ ...s, [ruleId]: 'pending' }))
    try {
      const handler = AUTO_FIX_HANDLERS[ruleId]
      if (handler) await handler()
      setAutofixState(s => ({ ...s, [ruleId]: 'done' }))
      await load()
    } catch {
      setAutofixState(s => ({ ...s, [ruleId]: 'error' }))
    }
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 460,
        background: 'white', borderLeft: `1px solid #e6dfce`, zIndex: 600,
        boxShadow: '-12px 0 32px rgba(11,15,26,0.08)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Geist, Inter, sans-serif',
      }}
    >
      <div style={{ padding: '20px 22px', borderBottom: '1px solid #efe9d9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#5a6072', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Listing health · eBay</div>
          <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 22, color: INK, lineHeight: 1.15, marginTop: 4, letterSpacing: '-0.01em' }}>
            {listingTitle ?? '—'}
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: INK }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <div style={{ padding: '18px 22px', flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ color: '#5a6072', fontSize: 13 }}>Validating…</div>}
        {!loading && validation && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <HealthBadge score={validation.healthScore} />
              <span style={{ fontSize: 12, color: '#5a6072' }}>{issues.length} issue{issues.length === 1 ? '' : 's'}</span>
              <button
                onClick={load}
                style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #d8d2c2', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: COBALT, fontSize: 12, fontWeight: 600 }}
              >Revalidate</button>
            </div>
            {issues.length === 0 && (
              <div style={{ fontSize: 13, color: EMERALD, fontWeight: 500 }}>All checks pass — ready to publish.</div>
            )}
            {issues.map((i: any, idx: number) => {
              const sev = i.rule.severity
              const sevColor = sev === 'error' ? OXBLOOD : sev === 'warning' ? AMBER : COBALT
              const fixState = autofixState[i.rule.id] ?? 'idle'
              return (
                <div key={`${i.rule.id}-${idx}`} style={{ padding: '12px 0', borderBottom: '1px solid #f1ecde' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 999, background: sevColor }} />
                    <span style={{ fontSize: 11, color: sevColor, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{sev}</span>
                    <span style={{ fontSize: 11, color: '#8b8e9a', fontFamily: 'monospace' }}>{i.rule.id}</span>
                  </div>
                  <div style={{ fontSize: 14, color: INK, lineHeight: 1.45 }}>{i.rule.message}</div>
                  <div style={{ fontSize: 12, color: '#5a6072', marginTop: 4 }}>{i.rule.remediation}</div>
                  {i.detail && (
                    <div style={{ fontSize: 11, color: '#8b8e9a', marginTop: 4, fontFamily: 'monospace' }}>{i.detail}</div>
                  )}
                  {i.rule.id === 'EBAY_CATEGORY_MAPPED' && (
                    <div style={{ marginTop: 10, padding: 10, background: CREAM, borderRadius: 8, border: '1px solid #e6dfce' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontSize: 11, color: '#5a6072', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Suggested categories</div>
                        <button
                          onClick={loadSuggestions}
                          disabled={suggestLoading}
                          style={{ background: 'transparent', border: 'none', color: COBALT, fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                        >{suggestLoading ? 'Finding…' : suggestions.length ? 'Refresh' : 'Suggest 3'}</button>
                      </div>
                      {suggestions.length === 0 && !suggestLoading && (
                        <div style={{ fontSize: 12, color: '#5a6072' }}>Run suggestions to see the top 3 eBay categories for this listing.</div>
                      )}
                      {suggestions.map(s => (
                        <div key={s.ebayCategoryId} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderTop: '1px solid #efe9d9' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: INK, lineHeight: 1.35 }}>{s.ebayCategoryPath}</div>
                            <div style={{ fontSize: 11, color: '#8b8e9a', marginTop: 2 }}>
                              id {s.ebayCategoryId} · {s.source} · {Math.round(s.confidence * 100)}% confidence
                            </div>
                            {s.reason && <div style={{ fontSize: 11, color: '#5a6072', marginTop: 2, fontStyle: 'italic' }}>{s.reason}</div>}
                          </div>
                          <button
                            onClick={() => applySuggestion(s.ebayCategoryId)}
                            style={{ padding: '5px 10px', background: COBALT, color: 'white', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                          >Use this</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Aspect rules: show enrichment button */}
                  {(i.rule.id === 'EBAY_BRAND_ASPECT' || i.rule.id === 'EBAY_CONDITION_SET') && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={enrichAspects}
                        disabled={aspectsLoading}
                        style={{ padding: '6px 12px', background: INK, color: CREAM, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: aspectsLoading ? 'wait' : 'pointer' }}
                      >{aspectsLoading ? 'Filling…' : 'Fill from Shopify + AI'}</button>
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    {i.rule.autoFixable && AUTO_FIX_HANDLERS[i.rule.id] ? (
                      <button
                        onClick={() => runAutoFix(i.rule.id)}
                        disabled={fixState === 'pending' || fixState === 'done'}
                        style={{
                          padding: '6px 12px',
                          background: fixState === 'done' ? EMERALD : COBALT,
                          color: 'white', border: 'none', borderRadius: 8,
                          fontSize: 12, fontWeight: 600,
                          cursor: fixState === 'pending' ? 'wait' : 'pointer',
                          opacity: fixState === 'done' ? 0.85 : 1,
                        }}
                      >
                        {fixState === 'done' ? 'Fixed' : fixState === 'pending' ? 'Fixing…' : 'Auto-fix'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#8b8e9a' }}>Manual fix required</span>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
