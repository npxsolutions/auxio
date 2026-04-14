'use client'

import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch (err) {
          console.error('[settings/referral:CopyButton] clipboard failed', err)
        }
      }}
      style={{
        fontFamily: 'var(--font-mono), monospace',
        fontSize: 12,
        letterSpacing: '0.04em',
        padding: '12px 18px',
        background: '#0b0f1a',
        color: '#f3f0ea',
        border: 'none',
        cursor: 'pointer',
        textTransform: 'uppercase',
        fontWeight: 600,
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
