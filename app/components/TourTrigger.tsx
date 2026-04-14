'use client'

import { useEffect, useRef, useState } from 'react'
import { runTour, type TourId } from '../lib/tours'

/**
 * Small ghost "?" button, fixed top-right of the app shell.
 * Opens a tiny menu: "Take the tour" + "Reset all tours".
 *
 * Kept intentionally minimal — the tour itself is the loud part; this
 * button must never compete with the product UI.
 */
export default function TourTrigger({
  tourId,
  userId,
}: {
  tourId: TourId
  userId?: string | null
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleStart() {
    setOpen(false)
    runTour(tourId, () => {
      if (!userId || typeof window === 'undefined') return
      try { window.localStorage.setItem(`tour-completed-${tourId}-${userId}`, '1') }
      catch (e) { console.error(`[tour:${tourId}] persist failed`, e) }
    })
  }

  function handleResetAll() {
    setOpen(false)
    if (!userId || typeof window === 'undefined') return
    const ids: TourId[] = ['dashboard', 'listings', 'channels', 'repricing', 'profit']
    ids.forEach(id => {
      try { window.localStorage.removeItem(`tour-completed-${id}-${userId}`) }
      catch (e) { console.error(`[tour:${id}] reset failed`, e) }
    })
    // Re-launch the current tour immediately as confirmation.
    runTour(tourId)
  }

  return (
    <div
      ref={rootRef}
      style={{ position: 'fixed', top: 14, right: 18, zIndex: 90 }}
    >
      <button
        aria-label="Product tour"
        onClick={() => setOpen(v => !v)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: 'transparent',
          border: '1px solid #d8d3c8',
          color: '#6b6e87',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
          fontFamily: 'inherit',
          transition: 'color 0.12s, border-color 0.12s, background 0.12s',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.color = '#2d2bb2'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2d2bb2'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'white'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.color = '#6b6e87'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#d8d3c8'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        }}
      >
        ?
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 34,
            right: 0,
            background: '#fbf8f1',
            border: '1px solid #1a1b22',
            borderRadius: 8,
            padding: 4,
            minWidth: 180,
            boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
          }}
        >
          <MenuButton onClick={handleStart}>Take the tour</MenuButton>
          <MenuButton onClick={handleResetAll}>Reset all tours</MenuButton>
        </div>
      )}
    </div>
  )
}

function MenuButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '8px 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        fontSize: 13,
        color: '#1a1b22',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 0.1s, color 0.1s',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLButtonElement).style.background = '#2d2bb2'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#1a1b22'
      }}
    >
      {children}
    </button>
  )
}
