'use client'

/**
 * ImageAnalysisPanel — AI-powered image compliance & quality analysis.
 *
 * Shows image grid, per-image AI scores, channel compliance badges,
 * alt text suggestions, and hero image recommendation.
 * Uses Palvento design system: cobalt score rings, oxblood issue dots,
 * emerald for passing badges.
 */
import { useState, useCallback } from 'react'
import {
  P, CARD, MONO, LABEL, HEADING, NUMBER,
  BTN_PRIMARY, BTN_SECONDARY, SECTION_HEADER,
} from '../lib/design-system'

// ── Types ────────────────────────────────────────────────────────────────────

type RuleIssue = {
  id: string
  severity: 'error' | 'warning' | 'info'
  message: string
  fix?: string
}

type RulesResult = {
  url: string
  position: number
  score: number
  issues: RuleIssue[]
}

type ChannelFit = {
  score: number
  issues: string[]
}

type AIAnalysis = {
  overallScore?: number
  background?: {
    type: string
    isClean: boolean
    amazonCompliant: boolean
  }
  product?: {
    visible: boolean
    fillsFrame: boolean
    percentOfFrame: number
    inFocus: boolean
  }
  issues?: { type: string; description: string }[]
  altText?: Record<string, string>
  channelFit?: Record<string, ChannelFit>
  suggestions?: string[]
  heroRecommendation?: boolean
  bestChannel?: string
}

type AIResult = {
  url: string
  analysis?: AIAnalysis
  error?: string
}

type AnalysisResponse = {
  listingId: string | null
  channel: string
  imageCount: number
  deterministicScore: number
  rulesResults: RulesResult[]
  aiResults: AIResult[]
  heroRecommendation: {
    index: number
    url: string
    score: number
  }
  usage: {
    used: number
    quota: number | 'unlimited'
    remaining: number | 'unlimited'
  }
}

type ImageAnalysisPanelProps = {
  open: boolean
  onClose: () => void
  listingId: string
  listingTitle?: string
  images: string[]
  onAltTextApply?: (imageUrl: string, altText: string) => void
}

const CHANNELS = ['amazon', 'ebay', 'etsy', 'google'] as const

// ── Score Ring SVG ──────────────────────────────────────────────────────────

function ScoreRing({ score, size = 48, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 10) * circumference
  const color = score >= 7 ? P.emerald : score >= 4 ? P.amber : P.oxblood

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={P.ruleSoft} strokeWidth={3}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="central"
          style={{
            fontSize: size * 0.35,
            fontWeight: 800,
            fontFamily: 'var(--font-mono), ui-monospace, monospace',
            fill: color,
          }}
        >
          {score}
        </text>
      </svg>
      {label && (
        <span style={{ ...MONO, fontSize: 9, fontWeight: 600, color: P.muted, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
          {label}
        </span>
      )}
    </div>
  )
}

// ── Channel Badge ──────────────────────────────────────────────────────────

function ChannelBadge({ channel, score }: { channel: string; score: number }) {
  const passed = score >= 7
  return (
    <span style={{
      ...MONO, fontSize: 10, fontWeight: 600,
      padding: '2px 6px', borderRadius: 2,
      background: passed ? P.emeraldSft : score >= 4 ? P.amberSft : P.oxbloodSft,
      color: passed ? P.emerald : score >= 4 ? P.amber : P.oxblood,
      whiteSpace: 'nowrap' as const,
    }}>
      {channel}: {score}/10 {passed ? '\u2713' : '\u26A0'}
    </span>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ImageAnalysisPanel({
  open,
  onClose,
  listingId,
  listingTitle,
  images,
  onAltTextApply,
}: ImageAnalysisPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalysisResponse | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  const [channel, setChannel] = useState<string>('amazon')

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/enrichment/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, channel }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Analysis failed')
        setLoading(false)
        return
      }
      setData(json)
      setSelectedIdx(0)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [listingId, channel])

  if (!open) return null

  const selectedAI = data?.aiResults?.[selectedIdx]
  const selectedRules = data?.rulesResults?.[selectedIdx]
  const analysis = selectedAI?.analysis
  const isHero = data?.heroRecommendation?.index === selectedIdx

  // Compute overall readiness
  const overallReadiness = data
    ? Math.round(
        (data.aiResults.reduce((sum, r) => {
          const s = r.analysis?.overallScore ?? 5
          return sum + s
        }, 0) /
          Math.max(data.aiResults.length, 1)) *
          10,
      )
    : 0

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: '560px', maxWidth: '100vw',
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
          <div style={{ ...SECTION_HEADER, marginBottom: 4 }}>Image Analysis</div>
          <div style={{ ...HEADING, fontSize: 18, color: P.ink }}>
            {listingTitle ? (listingTitle.length > 35 ? listingTitle.slice(0, 35) + '...' : listingTitle) : 'Product Images'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: P.muted, padding: 4,
            fontFamily: 'inherit', lineHeight: 1,
          }}
          aria-label="Close"
        >
          x
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* Pre-analysis: channel selector + run button */}
        {!data && !loading && (
          <>
            {/* Image grid preview */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...LABEL, marginBottom: 6 }}>
                {images.length} image{images.length !== 1 ? 's' : ''}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                gap: 6,
              }}>
                {images.map((url, i) => (
                  <div key={i} style={{
                    ...CARD, aspectRatio: '1', overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url} alt={`Product image ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {i === 0 && (
                      <span style={{
                        position: 'absolute', bottom: 2, left: 2,
                        ...MONO, fontSize: 8, fontWeight: 700,
                        padding: '1px 4px', borderRadius: 2,
                        background: P.cobalt, color: 'white',
                        textTransform: 'uppercase' as const,
                      }}>
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Channel selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...LABEL, marginBottom: 6 }}>Analyze for channel</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['amazon', 'ebay', 'etsy', 'shopify', 'tiktok', 'google'].map(ch => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    style={{
                      padding: '6px 12px', borderRadius: 2,
                      fontSize: 12, fontWeight: 600,
                      fontFamily: 'inherit', cursor: 'pointer',
                      border: channel === ch ? `1px solid ${P.cobalt}` : `1px solid ${P.rule}`,
                      background: channel === ch ? P.cobaltSft : 'transparent',
                      color: channel === ch ? P.cobalt : P.ink,
                    }}
                  >
                    {ch.charAt(0).toUpperCase() + ch.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: 2,
                background: P.oxbloodSft, color: P.oxblood,
                fontSize: 12, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={runAnalysis}
              disabled={images.length === 0}
              style={{
                ...BTN_PRIMARY, width: '100%', padding: 10,
                opacity: images.length === 0 ? 0.5 : 1,
                background: P.cobalt, color: 'white',
              }}
            >
              Analyze {images.length} image{images.length !== 1 ? 's' : ''} with AI
            </button>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: 20, height: 20,
              border: `2px solid ${P.ruleSoft}`,
              borderTopColor: P.cobalt,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            <div style={{ ...MONO, fontSize: 12, color: P.muted }}>
              Analyzing images with AI vision...
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <>
            {/* Overall readiness */}
            <div style={{
              ...CARD, padding: 16, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <ScoreRing score={Math.round(overallReadiness / 10)} size={56} />
              <div style={{ flex: 1 }}>
                <div style={{ ...HEADING, fontSize: 16, color: P.ink, marginBottom: 4 }}>
                  {overallReadiness}% marketplace-ready
                </div>
                <div style={{ ...MONO, fontSize: 11, color: P.muted }}>
                  {data.imageCount} image{data.imageCount !== 1 ? 's' : ''} analyzed for {data.channel}
                </div>
              </div>
              <div style={{
                ...CARD, padding: '8px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{ ...LABEL, marginBottom: 2, margin: 0 }}>Quota</div>
                <div style={{ ...NUMBER, fontSize: 12, fontWeight: 600, color: P.muted }}>
                  {data.usage.used}/{data.usage.quota === 'unlimited' ? '\u221E' : data.usage.quota}
                </div>
              </div>
            </div>

            {/* Hero recommendation */}
            {data.heroRecommendation && data.heroRecommendation.score > 0 && (
              <div style={{
                padding: '10px 12px', borderRadius: 2,
                background: P.cobaltSft, color: P.cobalt,
                fontSize: 12, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>*</span>
                <span>
                  <strong>Hero recommendation:</strong> Image #{data.heroRecommendation.index + 1} scores highest
                  ({data.heroRecommendation.score}/10)
                  {data.heroRecommendation.index !== 0 && ' — consider making it the main image'}
                </span>
              </div>
            )}

            {/* Image grid with scores */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...LABEL, marginBottom: 6 }}>Select image</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: 6,
              }}>
                {images.map((url, i) => {
                  const aiScore = data.aiResults[i]?.analysis?.overallScore ?? 0
                  const isSelected = selectedIdx === i
                  const isHeroImg = data.heroRecommendation?.index === i
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedIdx(i)}
                      style={{
                        ...CARD, aspectRatio: '1', overflow: 'hidden',
                        position: 'relative', cursor: 'pointer',
                        borderColor: isSelected ? P.cobalt : P.rule,
                        borderWidth: isSelected ? 2 : 1,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url} alt={`Product image ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {/* Score badge */}
                      <span style={{
                        position: 'absolute', top: 2, right: 2,
                        ...MONO, fontSize: 9, fontWeight: 700,
                        padding: '1px 4px', borderRadius: 2,
                        background: aiScore >= 7 ? P.emerald : aiScore >= 4 ? P.amber : P.oxblood,
                        color: 'white',
                      }}>
                        {aiScore}/10
                      </span>
                      {isHeroImg && (
                        <span style={{
                          position: 'absolute', bottom: 2, left: 2,
                          ...MONO, fontSize: 8, fontWeight: 700,
                          padding: '1px 4px', borderRadius: 2,
                          background: P.cobalt, color: 'white',
                          textTransform: 'uppercase' as const,
                        }}>
                          Hero
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Selected image detail */}
            {analysis && (
              <>
                {/* AI Score + Details */}
                <div style={{
                  ...CARD, padding: 16, marginBottom: 12,
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                }}>
                  <ScoreRing score={analysis.overallScore ?? 0} size={64} label="AI Score" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Background info */}
                    {analysis.background && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ ...LABEL, marginBottom: 2 }}>Background</div>
                        <div style={{ ...MONO, fontSize: 11, color: P.ink }}>
                          {analysis.background.type}
                          {analysis.background.isClean ? ' (clean)' : ' (not clean)'}
                          {analysis.background.amazonCompliant
                            ? <span style={{ color: P.emerald }}> — Amazon compliant</span>
                            : <span style={{ color: P.oxblood }}> — not Amazon compliant</span>
                          }
                        </div>
                      </div>
                    )}
                    {/* Product info */}
                    {analysis.product && (
                      <div>
                        <div style={{ ...LABEL, marginBottom: 2 }}>Product</div>
                        <div style={{ ...MONO, fontSize: 11, color: P.ink }}>
                          {analysis.product.visible ? 'Visible' : 'Not visible'}
                          {analysis.product.inFocus ? ', in focus' : ', out of focus'}
                          {analysis.product.percentOfFrame > 0 && `, fills ${analysis.product.percentOfFrame}%`}
                        </div>
                      </div>
                    )}
                    {isHero && (
                      <div style={{
                        marginTop: 8, ...MONO, fontSize: 10, fontWeight: 700,
                        color: P.cobalt, textTransform: 'uppercase' as const,
                      }}>
                        Recommended hero image
                      </div>
                    )}
                  </div>
                </div>

                {/* Channel fit badges */}
                {analysis.channelFit && (
                  <div style={{ ...CARD, padding: 12, marginBottom: 12 }}>
                    <div style={{ ...LABEL, marginBottom: 6 }}>Channel Compliance</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {CHANNELS.map(ch => {
                        const fit = analysis.channelFit?.[ch]
                        if (!fit) return null
                        return <ChannelBadge key={ch} channel={ch} score={fit.score} />
                      })}
                    </div>
                    {/* Channel issues */}
                    {CHANNELS.map(ch => {
                      const fit = analysis.channelFit?.[ch]
                      if (!fit || !fit.issues || fit.issues.length === 0) return null
                      if (fit.score >= 7) return null
                      return (
                        <div key={ch} style={{ marginTop: 8 }}>
                          <div style={{ ...MONO, fontSize: 10, fontWeight: 600, color: P.muted, marginBottom: 2 }}>
                            {ch} issues:
                          </div>
                          {fit.issues.map((issue, j) => (
                            <div key={j} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 6,
                              fontSize: 11, color: P.ink, lineHeight: 1.4,
                              marginBottom: 2,
                            }}>
                              <span style={{
                                width: 5, height: 5, borderRadius: '50%',
                                background: P.oxblood, flexShrink: 0, marginTop: 4,
                              }} />
                              {issue}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Detected issues */}
                {analysis.issues && analysis.issues.length > 0 && (
                  <div style={{ ...CARD, padding: 12, marginBottom: 12 }}>
                    <div style={{ ...LABEL, marginBottom: 6 }}>Detected Issues</div>
                    {analysis.issues.map((issue, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 6,
                        fontSize: 11, color: P.ink, lineHeight: 1.4,
                        marginBottom: 4,
                      }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: P.oxblood, flexShrink: 0, marginTop: 4,
                        }} />
                        <div>
                          <span style={{ ...MONO, fontSize: 10, fontWeight: 600, color: P.oxblood }}>
                            {issue.type}
                          </span>
                          <span style={{ marginLeft: 4 }}>{issue.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rules-based issues */}
                {selectedRules && selectedRules.issues.length > 0 && (
                  <div style={{ ...CARD, padding: 12, marginBottom: 12 }}>
                    <div style={{ ...LABEL, marginBottom: 6 }}>Rules Violations</div>
                    {selectedRules.issues.map((issue, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 6,
                        fontSize: 11, color: P.ink, lineHeight: 1.4,
                        marginBottom: 4,
                      }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: issue.severity === 'error' ? P.oxblood
                            : issue.severity === 'warning' ? P.amber : P.cobalt,
                          flexShrink: 0, marginTop: 4,
                        }} />
                        <div>
                          <span style={{
                            ...MONO, fontSize: 10, fontWeight: 600,
                            color: issue.severity === 'error' ? P.oxblood
                              : issue.severity === 'warning' ? P.amber : P.cobalt,
                          }}>
                            {issue.severity}
                          </span>
                          <span style={{ marginLeft: 4 }}>{issue.message}</span>
                          {issue.fix && (
                            <div style={{ ...MONO, fontSize: 10, color: P.muted, marginTop: 2 }}>
                              Fix: {issue.fix}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alt text suggestions */}
                {analysis.altText && (
                  <div style={{ ...CARD, padding: 12, marginBottom: 12 }}>
                    <div style={{ ...LABEL, marginBottom: 6 }}>Alt Text Suggestions</div>
                    {Object.entries(analysis.altText).map(([ch, text]) => (
                      <div key={ch} style={{ marginBottom: 8 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          marginBottom: 2,
                        }}>
                          <span style={{ ...MONO, fontSize: 10, fontWeight: 600, color: P.muted, textTransform: 'uppercase' as const }}>
                            {ch}
                          </span>
                          {onAltTextApply && (
                            <button
                              onClick={() => onAltTextApply(images[selectedIdx], text)}
                              style={{
                                ...BTN_SECONDARY, padding: '2px 8px', fontSize: 10,
                              }}
                            >
                              Apply
                            </button>
                          )}
                        </div>
                        <div style={{
                          fontSize: 11, color: P.ink, lineHeight: 1.4,
                          padding: 8, background: P.bg, borderRadius: 2,
                        }}>
                          {text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Suggestions */}
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <div style={{ ...CARD, padding: 12, marginBottom: 12 }}>
                    <div style={{ ...LABEL, marginBottom: 6 }}>Suggestions</div>
                    {analysis.suggestions.map((suggestion, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 6,
                        fontSize: 11, color: P.ink, lineHeight: 1.4,
                        marginBottom: 4,
                      }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: P.cobalt, flexShrink: 0, marginTop: 4,
                        }} />
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* AI error for selected image */}
            {selectedAI?.error && (
              <div style={{
                padding: '10px 12px', borderRadius: 2,
                background: P.oxbloodSft, color: P.oxblood,
                fontSize: 12, marginBottom: 12,
              }}>
                Failed to analyze image: {selectedAI.error}
              </div>
            )}

            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: 2,
                background: P.oxbloodSft, color: P.oxblood,
                fontSize: 12, marginBottom: 12,
              }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {data && !loading && (
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${P.rule}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ ...MONO, fontSize: 11, color: P.muted }}>
            {data.deterministicScore}/100 rules score
          </div>
          <button
            onClick={() => { setData(null); setError(null) }}
            style={{ ...BTN_SECONDARY, padding: '6px 14px', fontSize: 12 }}
          >
            Re-analyze
          </button>
        </div>
      )}
    </div>
  )
}
