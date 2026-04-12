'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getGuide, type Guide } from './guides'

export function HelpWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  const guide: Guide | null = getGuide(pathname)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('help-dismissed')
    if (stored) {
      try { setDismissed(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  // Reset step when guide changes
  useEffect(() => {
    setActiveStep(0)
    setOpen(false)
  }, [pathname])

  if (!mounted || !guide) return null

  // Don't show on public/marketing pages
  const publicPages = ['/', '/login', '/signup', '/pricing', '/about', '/contact', '/blog', '/features', '/privacy', '/terms']
  if (publicPages.includes(pathname)) return null

  const isDismissed = dismissed.includes(pathname)

  function dismiss() {
    const next = [...dismissed, pathname]
    setDismissed(next)
    localStorage.setItem('help-dismissed', JSON.stringify(next))
    setOpen(false)
  }

  function resetDismissed() {
    const next = dismissed.filter(p => p !== pathname)
    setDismissed(next)
    localStorage.setItem('help-dismissed', JSON.stringify(next))
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => {
          if (isDismissed) resetDismissed()
          setOpen(o => !o)
        }}
        title="Page guide"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9998,
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: open ? '#111827' : '#1f2937',
          border: '1px solid #374151',
          color: '#9ca3af',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          transition: 'background 0.15s, color 0.15s, transform 0.15s',
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = '#374151'
          el.style.color = '#f9fafb'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = open ? '#111827' : '#1f2937'
          el.style.color = '#9ca3af'
        }}
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5"/>
            <path d="M6.5 6.25C6.5 5.42 7.17 4.75 8 4.75s1.5.67 1.5 1.5c0 1-1.5 1.5-1.5 2.5"/>
            <circle cx="8" cy="11.25" r="0.6" fill="currentColor" stroke="none"/>
          </svg>
        )}
      </button>

      {/* Pulse ring for first-time visitors */}
      {!isDismissed && !open && (
        <span style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9997,
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '2px solid #4b5563',
          animation: 'help-pulse 2s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Guide panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            zIndex: 9999,
            width: '340px',
            maxHeight: '520px',
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'help-slide-up 0.2s ease',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 18px 14px',
            borderBottom: '1px solid #1f2937',
            background: '#0d1117',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#6b7280',
                  }}>Page Guide</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#f9fafb' }}>
                  {guide.title}
                </h3>
              </div>
              <button
                onClick={dismiss}
                title="Dismiss guide for this page"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4b5563',
                  cursor: 'pointer',
                  padding: '2px',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  marginTop: '2px',
                }}
              >
                Don&apos;t show
              </button>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: '#9ca3af', lineHeight: '1.5' }}>
              {guide.description}
            </p>
          </div>

          {/* Steps */}
          <div style={{ padding: '12px 18px', overflowY: 'auto', flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#4b5563', marginBottom: '10px' }}>
              How it works
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {guide.steps.map((step, i) => {
                const isActive = i === activeStep
                return (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    style={{
                      background: isActive ? '#1f2937' : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{
                        flexShrink: 0,
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: isActive ? '#3b82f6' : '#1f2937',
                        border: isActive ? 'none' : '1px solid #374151',
                        color: isActive ? '#fff' : '#6b7280',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '1px',
                      }}>
                        {i + 1}
                      </span>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: isActive ? '#f9fafb' : '#d1d5db',
                          marginBottom: isActive ? '4px' : '0',
                        }}>
                          {step.title}
                        </div>
                        {isActive && (
                          <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5' }}>
                            {step.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Tips */}
            {guide.tips && guide.tips.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#4b5563', marginBottom: '8px' }}>
                  Pro tips
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {guide.tips.map((tip, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      gap: '8px',
                      padding: '8px 10px',
                      background: '#0d1117',
                      borderRadius: '8px',
                      border: '1px solid #1f2937',
                    }}>
                      <span style={{ flexShrink: 0, color: '#f59e0b', marginTop: '1px' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M6 1L7.5 4.5H11L8 6.5L9.5 10L6 8L2.5 10L4 6.5L1 4.5H4.5L6 1Z"/>
                        </svg>
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5' }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div style={{
            padding: '10px 18px',
            borderTop: '1px solid #1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <button
              onClick={() => setActiveStep(s => Math.max(0, s - 1))}
              disabled={activeStep === 0}
              style={{
                background: 'none',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                color: activeStep === 0 ? '#374151' : '#9ca3af',
                cursor: activeStep === 0 ? 'default' : 'pointer',
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: '11px', color: '#4b5563' }}>
              {activeStep + 1} / {guide.steps.length}
            </span>
            <button
              onClick={() => setActiveStep(s => Math.min(guide.steps.length - 1, s + 1))}
              disabled={activeStep === guide.steps.length - 1}
              style={{
                background: activeStep === guide.steps.length - 1 ? 'none' : '#1d4ed8',
                border: activeStep === guide.steps.length - 1 ? '1px solid #374151' : 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                color: activeStep === guide.steps.length - 1 ? '#374151' : '#fff',
                cursor: activeStep === guide.steps.length - 1 ? 'default' : 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes help-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes help-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
