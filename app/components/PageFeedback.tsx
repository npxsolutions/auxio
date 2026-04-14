'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'

const TAG = '[component:PageFeedback]'

const INK = '#0b0f1a'
const COBALT = '#1d5fdb'
const BORDER = '#e4dfd4'
const MUTED = '#6a6558'

export function PageFeedback() {
  const pathname = usePathname() || ''
  const [sentiment, setSentiment] = useState<'up' | 'down' | null>(null)
  const [comment, setComment] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function send(s: 'up' | 'down', withComment = false) {
    setSubmitting(true)
    try {
      await fetch('/api/feedback/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: pathname,
          sentiment: s,
          comment: withComment ? comment : null,
        }),
      })
    } catch (err) {
      console.error(TAG, 'submit failed', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function onClick(s: 'up' | 'down') {
    setSentiment(s)
    await send(s, false)
  }

  async function submitComment() {
    if (!sentiment) return
    await send(sentiment, true)
    setDone(true)
    setTimeout(() => {
      setSentiment(null)
      setComment('')
      setDone(false)
    }, 2000)
  }

  const btnStyle = (active: boolean) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, borderRadius: 8,
    border: `1px solid ${active ? COBALT : BORDER}`,
    background: active ? 'rgba(29,95,219,0.08)' : 'transparent',
    color: active ? COBALT : INK,
    cursor: 'pointer', padding: 0,
    transition: 'color 0.12s, border-color 0.12s, background 0.12s',
  }) as const

  if (done) {
    return (
      <div style={{
        marginTop: 32, padding: '16px 0', borderTop: `1px solid ${BORDER}`,
        fontSize: 12.5, color: MUTED, fontFamily: 'inherit',
      }}>
        Thanks for the feedback.
      </div>
    )
  }

  return (
    <div style={{
      marginTop: 32, padding: '16px 0', borderTop: `1px solid ${BORDER}`,
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      fontFamily: 'inherit',
    }}>
      <span style={{ fontSize: 12.5, color: MUTED }}>Was this page useful?</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          aria-label="Yes"
          onClick={() => onClick('up')}
          style={btnStyle(sentiment === 'up')}
          onMouseEnter={e => {
            if (sentiment !== 'up') {
              e.currentTarget.style.color = COBALT
              e.currentTarget.style.borderColor = COBALT
            }
          }}
          onMouseLeave={e => {
            if (sentiment !== 'up') {
              e.currentTarget.style.color = INK
              e.currentTarget.style.borderColor = BORDER
            }
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 12V2"/>
            <path d="M3 6l4-4 4 4"/>
          </svg>
        </button>
        <button
          aria-label="No"
          onClick={() => onClick('down')}
          style={btnStyle(sentiment === 'down')}
          onMouseEnter={e => {
            if (sentiment !== 'down') {
              e.currentTarget.style.color = COBALT
              e.currentTarget.style.borderColor = COBALT
            }
          }}
          onMouseLeave={e => {
            if (sentiment !== 'down') {
              e.currentTarget.style.color = INK
              e.currentTarget.style.borderColor = BORDER
            }
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 2v10"/>
            <path d="M3 8l4 4 4-4"/>
          </svg>
        </button>
      </div>
      {sentiment && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, minWidth: 220 }}>
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="What would you change?"
            style={{
              flex: 1, minWidth: 180,
              background: 'white', border: `1px solid ${BORDER}`,
              borderRadius: 8, padding: '6px 10px', fontSize: 12.5,
              color: INK, fontFamily: 'inherit',
            }}
          />
          <button
            onClick={submitComment}
            disabled={submitting}
            style={{
              background: COBALT, border: 'none', borderRadius: 8,
              padding: '6px 12px', fontSize: 12, fontWeight: 600,
              color: 'white', cursor: submitting ? 'wait' : 'pointer',
              fontFamily: 'inherit', opacity: submitting ? 0.7 : 1,
            }}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
