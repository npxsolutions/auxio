'use client'

/**
 * EnrichmentPanel — AI-powered data enrichment side panel.
 *
 * Shows current field values vs AI-suggested improvements side-by-side.
 * Before/After diff view with Accept / Reject / Edit per field.
 * Uses Palvento design system: cobalt for AI suggestions, oxblood for removed,
 * emerald for added text.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  P, CARD, MONO, LABEL, HEADING, NUMBER,
  BTN_PRIMARY, BTN_SECONDARY, SECTION_HEADER,
} from '../lib/design-system'

// ── Types ────────────────────────────────────────────────────────────────────

type FieldComparison = {
  before: unknown
  after: unknown
}

type EnrichmentResult = {
  listingId: string
  channel: string
  enrichedData: Record<string, unknown>
  comparison: Record<string, FieldComparison>
  enrichmentScore: number
  usage: {
    used: number
    quota: number | 'unlimited'
    remaining: number | 'unlimited'
  }
}

type FieldDecision = 'pending' | 'accepted' | 'rejected' | 'edited'

type FieldState = {
  decision: FieldDecision
  editedValue?: unknown
}

type EnrichmentPanelProps = {
  open: boolean
  onClose: () => void
  listingIds: string[]
  listingTitle?: string
  onApply: (listingId: string, fields: Record<string, unknown>) => Promise<void>
}

const CHANNEL_OPTIONS = [
  { value: 'amazon', label: 'Amazon' },
  { value: 'ebay', label: 'eBay' },
  { value: 'etsy', label: 'Etsy' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'tiktok', label: 'TikTok' },
]

const FIELD_OPTIONS = [
  { value: 'title', label: 'Title' },
  { value: 'description', label: 'Description' },
  { value: 'bulletPoints', label: 'Bullet points' },
  { value: 'attributes', label: 'Attributes' },
  { value: 'searchTerms', label: 'Search terms' },
  { value: 'category', label: 'Category' },
  { value: 'tags', label: 'Tags' },
  { value: 'gtinHint', label: 'GTIN lookup' },
]

const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  bulletPoints: 'Bullet Points',
  attributes: 'Attributes',
  searchTerms: 'Search Terms',
  category: 'Category',
  tags: 'Tags',
  gtinHint: 'GTIN Hint',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '(empty)'
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
  }
  return String(val)
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max) + '...'
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EnrichmentPanel({
  open,
  onClose,
  listingIds,
  listingTitle,
  onApply,
}: EnrichmentPanelProps) {
  const isBulk = listingIds.length > 1
  const [channel, setChannel] = useState('amazon')
  const [selectedFields, setSelectedFields] = useState<string[]>(['title', 'description', 'attributes'])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalToProcess, setTotalToProcess] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Single-listing result
  const [result, setResult] = useState<EnrichmentResult | null>(null)
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({})

  // Bulk results
  const [bulkResults, setBulkResults] = useState<EnrichmentResult[]>([])
  const [bulkIndex, setBulkIndex] = useState(0)

  // Applying state
  const [applying, setApplying] = useState(false)

  // Reset on open
  useEffect(() => {
    if (open) {
      setResult(null)
      setBulkResults([])
      setBulkIndex(0)
      setFieldStates({})
      setError(null)
      setLoading(false)
      setProgress(0)
    }
  }, [open, listingIds.join(',')])

  const toggleField = (f: string) => {
    setSelectedFields(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    )
  }

  const runEnrichment = useCallback(async () => {
    if (selectedFields.length === 0) return
    setLoading(true)
    setError(null)
    setProgress(0)

    try {
      if (isBulk) {
        setTotalToProcess(listingIds.length)
        const res = await fetch('/api/enrichment/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingIds,
            fields: selectedFields,
            channel,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Enrichment failed')
          setLoading(false)
          return
        }
        const successResults: EnrichmentResult[] = data.results
          .filter((r: any) => r.status === 'success')
          .map((r: any) => ({
            listingId: r.listingId,
            channel,
            enrichedData: r.enrichedData,
            comparison: r.comparison,
            enrichmentScore: r.enrichmentScore,
            usage: data.usage,
          }))
        setBulkResults(successResults)
        setBulkIndex(0)
        setProgress(data.total)
        if (successResults.length > 0) {
          initFieldStates(successResults[0].comparison)
        }
      } else {
        setTotalToProcess(1)
        const res = await fetch('/api/enrichment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: listingIds[0],
            fields: selectedFields,
            channel,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Enrichment failed')
          setLoading(false)
          return
        }
        setResult(data)
        initFieldStates(data.comparison)
        setProgress(1)
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [listingIds, selectedFields, channel, isBulk])

  function initFieldStates(comparison: Record<string, FieldComparison>) {
    const states: Record<string, FieldState> = {}
    for (const key of Object.keys(comparison)) {
      states[key] = { decision: 'pending' }
    }
    setFieldStates(states)
  }

  function setDecision(field: string, decision: FieldDecision) {
    setFieldStates(prev => ({
      ...prev,
      [field]: { ...prev[field], decision },
    }))
  }

  function setEditedValue(field: string, value: unknown) {
    setFieldStates(prev => ({
      ...prev,
      [field]: { decision: 'edited', editedValue: value },
    }))
  }

  function acceptAll() {
    setFieldStates(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (next[key].decision === 'pending') {
          next[key] = { ...next[key], decision: 'accepted' }
        }
      }
      return next
    })
  }

  async function applyChanges() {
    const currentResult = isBulk ? bulkResults[bulkIndex] : result
    if (!currentResult) return

    setApplying(true)
    try {
      const fieldsToApply: Record<string, unknown> = {}
      for (const [field, state] of Object.entries(fieldStates)) {
        if (state.decision === 'accepted') {
          fieldsToApply[field] = currentResult.comparison[field]?.after
        } else if (state.decision === 'edited') {
          fieldsToApply[field] = state.editedValue
        }
      }

      if (Object.keys(fieldsToApply).length > 0) {
        await onApply(currentResult.listingId, fieldsToApply)
      }

      // If bulk, move to next
      if (isBulk && bulkIndex < bulkResults.length - 1) {
        const nextIdx = bulkIndex + 1
        setBulkIndex(nextIdx)
        initFieldStates(bulkResults[nextIdx].comparison)
      } else {
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to apply changes')
    } finally {
      setApplying(false)
    }
  }

  const currentResult = isBulk ? bulkResults[bulkIndex] : result
  const hasResults = !!currentResult
  const pendingCount = Object.values(fieldStates).filter(s => s.decision === 'pending').length
  const acceptedCount = Object.values(fieldStates).filter(s => s.decision === 'accepted' || s.decision === 'edited').length

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: '520px', maxWidth: '100vw',
      background: P.surface,
      borderLeft: `1px solid ${P.rule}`,
      zIndex: 1000,
      display: 'flex', flexDirection: 'column',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${P.rule}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ ...SECTION_HEADER, marginBottom: '4px' }}>AI Enrichment</div>
          <div style={{ ...HEADING, fontSize: '18px', color: P.ink }}>
            {isBulk
              ? `${listingIds.length} listings`
              : truncate(listingTitle || 'Listing', 40)
            }
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '20px', color: P.muted, padding: '4px',
            fontFamily: 'inherit', lineHeight: 1,
          }}
          aria-label="Close"
        >
          x
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Config section (before results) */}
        {!hasResults && !loading && (
          <>
            {/* Channel selector */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ ...LABEL, marginBottom: '6px' }}>Target channel</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {CHANNEL_OPTIONS.map(ch => (
                  <button
                    key={ch.value}
                    onClick={() => setChannel(ch.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '2px',
                      fontSize: '12px', fontWeight: 600,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      border: channel === ch.value ? `1px solid ${P.cobalt}` : `1px solid ${P.rule}`,
                      background: channel === ch.value ? P.cobaltSft : 'transparent',
                      color: channel === ch.value ? P.cobalt : P.ink,
                    }}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Field selector */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ ...LABEL, marginBottom: '6px' }}>Fields to enrich</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {FIELD_OPTIONS.map(f => (
                  <label
                    key={f.value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 8px', borderRadius: '2px',
                      background: selectedFields.includes(f.value) ? P.cobaltSft : 'transparent',
                      cursor: 'pointer', fontSize: '13px', color: P.ink,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(f.value)}
                      onChange={() => toggleField(f.value)}
                      style={{ accentColor: P.cobalt }}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: '2px',
                background: P.oxbloodSft, color: P.oxblood,
                fontSize: '12px', marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <button
              onClick={runEnrichment}
              disabled={selectedFields.length === 0}
              style={{
                ...BTN_PRIMARY,
                width: '100%',
                padding: '10px',
                opacity: selectedFields.length === 0 ? 0.5 : 1,
                background: P.cobalt,
                color: 'white',
              }}
            >
              {isBulk
                ? `Enrich ${listingIds.length} listing${listingIds.length !== 1 ? 's' : ''}`
                : 'Enrich with AI'
              }
            </button>
          </>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '100%', height: '3px', background: P.ruleSoft,
              borderRadius: '2px', marginBottom: '16px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', background: P.cobalt,
                borderRadius: '2px',
                width: totalToProcess > 0 ? `${(progress / totalToProcess) * 100}%` : '0%',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ ...MONO, fontSize: '12px', color: P.muted }}>
              {isBulk
                ? `Processing ${progress} of ${totalToProcess} listings...`
                : 'Analyzing and generating suggestions...'
              }
            </div>
            <div style={{
              marginTop: '12px',
              width: '20px', height: '20px',
              border: `2px solid ${P.ruleSoft}`,
              borderTopColor: P.cobalt,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '12px auto 0',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Results */}
        {hasResults && !loading && (
          <>
            {/* Bulk navigation */}
            {isBulk && bulkResults.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '16px', padding: '8px 12px',
                background: P.bg, borderRadius: '2px',
              }}>
                <button
                  onClick={() => { const i = bulkIndex - 1; setBulkIndex(i); initFieldStates(bulkResults[i].comparison) }}
                  disabled={bulkIndex === 0}
                  style={{ ...BTN_SECONDARY, padding: '4px 10px', fontSize: '11px', opacity: bulkIndex === 0 ? 0.4 : 1 }}
                >
                  Prev
                </button>
                <span style={{ ...MONO, fontSize: '12px', color: P.muted }}>
                  {bulkIndex + 1} of {bulkResults.length}
                </span>
                <button
                  onClick={() => { const i = bulkIndex + 1; setBulkIndex(i); initFieldStates(bulkResults[i].comparison) }}
                  disabled={bulkIndex >= bulkResults.length - 1}
                  style={{ ...BTN_SECONDARY, padding: '4px 10px', fontSize: '11px', opacity: bulkIndex >= bulkResults.length - 1 ? 0.4 : 1 }}
                >
                  Next
                </button>
              </div>
            )}

            {/* Enrichment score + quota */}
            <div style={{
              display: 'flex', gap: '12px', marginBottom: '16px',
            }}>
              <div style={{
                ...CARD, flex: 1, padding: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{ ...LABEL, marginBottom: '4px' }}>Enrichment</div>
                <div style={{ ...NUMBER, fontSize: '20px', fontWeight: 800, color: P.ink }}>
                  {currentResult?.enrichmentScore ?? 0}%
                </div>
                <div style={{
                  width: '100%', height: '3px', background: P.ruleSoft,
                  borderRadius: '2px', marginTop: '6px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    width: `${currentResult?.enrichmentScore ?? 0}%`,
                    background: (currentResult?.enrichmentScore ?? 0) >= 80 ? P.emerald
                      : (currentResult?.enrichmentScore ?? 0) >= 50 ? P.amber : P.oxblood,
                  }} />
                </div>
              </div>
              <div style={{
                ...CARD, flex: 1, padding: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{ ...LABEL, marginBottom: '4px' }}>Quota</div>
                <div style={{ ...NUMBER, fontSize: '14px', fontWeight: 600, color: P.muted }}>
                  {currentResult?.usage.used ?? 0} / {currentResult?.usage.quota === 'unlimited' ? '\u221e' : currentResult?.usage.quota}
                </div>
                <div style={{ ...MONO, fontSize: '10px', color: P.muted, marginTop: '2px' }}>
                  {currentResult?.usage.remaining === 'unlimited'
                    ? 'unlimited remaining'
                    : `${currentResult?.usage.remaining} remaining`
                  }
                </div>
              </div>
            </div>

            {/* Channel tag */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px', borderRadius: '2px',
              background: P.cobaltSft, color: P.cobalt,
              ...MONO, fontSize: '10px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '16px',
            }}>
              {currentResult?.channel}
            </div>

            {/* Field comparisons */}
            {currentResult?.comparison && Object.entries(currentResult.comparison).map(([field, comp]) => {
              const state = fieldStates[field] ?? { decision: 'pending' }
              const beforeStr = formatValue(comp.before)
              const afterStr = formatValue(state.decision === 'edited' ? state.editedValue : comp.after)
              const isChanged = beforeStr !== afterStr

              return (
                <div key={field} style={{
                  ...CARD, marginBottom: '12px', overflow: 'hidden',
                  borderColor: state.decision === 'accepted' ? P.emerald
                    : state.decision === 'rejected' ? P.oxblood
                    : state.decision === 'edited' ? P.cobalt
                    : P.rule,
                }}>
                  {/* Field header */}
                  <div style={{
                    padding: '8px 12px',
                    borderBottom: `1px solid ${P.ruleSoft}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: state.decision === 'accepted' ? P.emeraldSft
                      : state.decision === 'rejected' ? P.oxbloodSft
                      : state.decision === 'edited' ? P.cobaltSft
                      : P.bg,
                  }}>
                    <span style={{ ...LABEL, margin: 0 }}>
                      {FIELD_LABELS[field] || field}
                    </span>
                    {state.decision !== 'pending' && (
                      <span style={{
                        ...MONO, fontSize: '9px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        color: state.decision === 'accepted' ? P.emerald
                          : state.decision === 'rejected' ? P.oxblood
                          : P.cobalt,
                      }}>
                        {state.decision}
                      </span>
                    )}
                  </div>

                  {/* Before / After */}
                  <div style={{ padding: '12px' }}>
                    {isChanged && (
                      <>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{
                            ...MONO, fontSize: '9px', fontWeight: 600, color: P.oxblood,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            marginBottom: '4px',
                          }}>
                            Before
                          </div>
                          <div style={{
                            fontSize: '12px', color: P.muted, lineHeight: 1.5,
                            padding: '8px',
                            background: beforeStr === '(empty)' ? P.ruleSoft : P.oxbloodSft,
                            borderRadius: '2px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontStyle: beforeStr === '(empty)' ? 'italic' : 'normal',
                          }}>
                            {truncate(beforeStr, 500)}
                          </div>
                        </div>
                        <div>
                          <div style={{
                            ...MONO, fontSize: '9px', fontWeight: 600, color: P.emerald,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            marginBottom: '4px',
                          }}>
                            After
                          </div>
                          <div style={{
                            fontSize: '12px', color: P.ink, lineHeight: 1.5,
                            padding: '8px',
                            background: P.emeraldSft,
                            borderRadius: '2px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}>
                            {truncate(afterStr, 500)}
                          </div>
                        </div>
                      </>
                    )}
                    {!isChanged && (
                      <div style={{ fontSize: '12px', color: P.muted, fontStyle: 'italic' }}>
                        No changes suggested
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {isChanged && (
                    <div style={{
                      padding: '8px 12px',
                      borderTop: `1px solid ${P.ruleSoft}`,
                      display: 'flex', gap: '6px',
                    }}>
                      <button
                        onClick={() => setDecision(field, 'accepted')}
                        style={{
                          padding: '4px 10px', borderRadius: '2px',
                          fontSize: '11px', fontWeight: 600, fontFamily: 'inherit',
                          cursor: 'pointer',
                          background: state.decision === 'accepted' ? P.emerald : P.emeraldSft,
                          color: state.decision === 'accepted' ? 'white' : P.emerald,
                          border: 'none',
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => setDecision(field, 'rejected')}
                        style={{
                          padding: '4px 10px', borderRadius: '2px',
                          fontSize: '11px', fontWeight: 600, fontFamily: 'inherit',
                          cursor: 'pointer',
                          background: state.decision === 'rejected' ? P.oxblood : P.oxbloodSft,
                          color: state.decision === 'rejected' ? 'white' : P.oxblood,
                          border: 'none',
                        }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          const val = prompt('Edit value:', afterStr)
                          if (val !== null) setEditedValue(field, val)
                        }}
                        style={{
                          ...BTN_SECONDARY,
                          padding: '4px 10px', fontSize: '11px',
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: '2px',
                background: P.oxbloodSft, color: P.oxblood,
                fontSize: '12px', marginBottom: '12px',
              }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {hasResults && !loading && (
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${P.rule}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '8px',
        }}>
          <button
            onClick={acceptAll}
            disabled={pendingCount === 0}
            style={{
              ...BTN_SECONDARY,
              padding: '8px 14px', fontSize: '12px',
              opacity: pendingCount === 0 ? 0.4 : 1,
            }}
          >
            Accept all ({pendingCount})
          </button>
          <button
            onClick={applyChanges}
            disabled={acceptedCount === 0 || applying}
            style={{
              ...BTN_PRIMARY,
              padding: '8px 18px', fontSize: '12px',
              background: P.cobalt, color: 'white',
              opacity: acceptedCount === 0 ? 0.4 : 1,
            }}
          >
            {applying ? 'Applying...' : `Apply ${acceptedCount} change${acceptedCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
