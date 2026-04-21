'use client'

import { useState } from 'react'

const TAG = '[component:CancelSurveyModal]'

const CREAM = '#f8f4ec'
const INK = '#0b0f1a'
const COBALT = '#e8863f'
const BORDER = '#e4dfd4'
const MUTED = '#6a6558'

const REASONS = [
  'Too expensive',
  'Missing feature',
  'Going with competitor',
  'Not the right time',
  'Other',
]

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void  // called after survey persisted; parent routes to Stripe portal
}

export function CancelSurveyModal({ open, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [stage, setStage] = useState<'form' | 'save' | 'confirm'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [saveOffered, setSaveOffered] = useState<string | null>(null)
  const [saveAccepted, setSaveAccepted] = useState(false)

  if (!open) return null

  async function submitSurvey(accepted: boolean) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/billing/cancel-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, detail, save_accepted: accepted }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save')
      return json?.save_offered as string | null
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveAttempt() {
    try {
      const offered = await submitSurvey(false)
      setSaveOffered(offered)
      // If a save offer applies, show save stage; otherwise skip to confirm
      if (offered === 'discount_25_3mo' || offered === 'feature_request') {
        setStage('save')
      } else {
        setStage('confirm')
      }
    } catch (err) {
      console.error(TAG, 'save attempt failed', err)
    }
  }

  async function acceptSave() {
    try {
      await submitSurvey(true)
      setSaveAccepted(true)
      // accepting a save cancels the cancel flow
      setTimeout(() => { onClose(); reset() }, 1200)
    } catch (err) {
      console.error(TAG, 'accept save failed', err)
    }
  }

  async function declineSave() {
    setStage('confirm')
  }

  async function confirmCancel() {
    onConfirm()
  }

  function reset() {
    setReason(''); setDetail(''); setStage('form'); setSaveOffered(null); setSaveAccepted(false)
  }

  const canContinue = reason.length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cancel subscription"
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(11,15,26,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, fontFamily: 'var(--font-geist), -apple-system, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: CREAM, color: INK,
          borderRadius: 16, border: `1px solid ${BORDER}`,
          boxShadow: '0 30px 60px rgba(11,15,26,0.25)',
          padding: '24px 24px 20px',
        }}
      >
        {saveAccepted ? (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
              {saveOffered === 'discount_25_3mo' ? 'Discount applied' : 'Feedback received'}
            </h2>
            <p style={{ fontSize: 13.5, color: MUTED, margin: 0, lineHeight: 1.5 }}>
              Thanks — we&apos;ll be in touch shortly.
            </p>
          </div>
        ) : stage === 'form' ? (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Before you go
            </h2>
            <p style={{ fontSize: 13.5, color: MUTED, margin: '0 0 18px', lineHeight: 1.5 }}>
              A one-line reason helps us build a better Palvento.
            </p>

            <label style={{ fontSize: 12, fontWeight: 600, color: INK, display: 'block', marginBottom: 6 }}>
              Reason <span style={{ color: COBALT }}>*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{
                width: '100%', background: 'white',
                border: `1px solid ${BORDER}`, borderRadius: 8,
                padding: '9px 12px', fontSize: 13.5, color: INK,
                fontFamily: 'inherit', marginBottom: 14,
              }}
            >
              <option value="">Pick one…</option>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <label style={{ fontSize: 12, fontWeight: 600, color: INK, display: 'block', marginBottom: 6 }}>
              Anything else? <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={detail}
              onChange={e => setDetail(e.target.value)}
              rows={3}
              style={{
                width: '100%', background: 'white',
                border: `1px solid ${BORDER}`, borderRadius: 8,
                padding: '9px 12px', fontSize: 13.5, color: INK,
                fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent', border: `1px solid ${BORDER}`,
                  borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500,
                  color: INK, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Keep subscription
              </button>
              <button
                onClick={handleSaveAttempt}
                disabled={!canContinue || submitting}
                style={{
                  background: canContinue ? INK : '#9c9689', border: 'none',
                  borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
                  color: 'white', cursor: canContinue && !submitting ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                }}
              >
                {submitting ? 'Saving…' : 'Continue'}
              </button>
            </div>
          </>
        ) : stage === 'save' ? (
          <>
            {saveOffered === 'discount_25_3mo' ? (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                  Stay for 25% off — three months
                </h2>
                <p style={{ fontSize: 13.5, color: MUTED, margin: '0 0 18px', lineHeight: 1.55 }}>
                  If price is the blocker, we&apos;d rather keep you than lose you. One-time offer, applies on your next invoice.
                </p>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                  Tell us what&apos;s missing
                </h2>
                <p style={{ fontSize: 13.5, color: MUTED, margin: '0 0 18px', lineHeight: 1.55 }}>
                  If we can prioritise it in the next release, we&apos;ll come back to you before you cancel.
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={declineSave}
                style={{
                  background: 'transparent', border: `1px solid ${BORDER}`,
                  borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500,
                  color: INK, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                No thanks, cancel
              </button>
              <button
                onClick={acceptSave}
                disabled={submitting}
                style={{
                  background: COBALT, border: 'none',
                  borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
                  color: 'white', cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {saveOffered === 'discount_25_3mo' ? 'Apply discount' : 'Flag for team'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Confirm cancellation
            </h2>
            <p style={{ fontSize: 13.5, color: MUTED, margin: '0 0 18px', lineHeight: 1.55 }}>
              We&apos;ll hand you to the Stripe billing portal to finish.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent', border: `1px solid ${BORDER}`,
                  borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500,
                  color: INK, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Go back
              </button>
              <button
                onClick={confirmCancel}
                style={{
                  background: '#b42318', border: 'none',
                  borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
                  color: 'white', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel subscription
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
