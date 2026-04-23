'use client'

/**
 * NotificationBell — sidebar bell icon with dropdown of recent notifications.
 *
 * Polls /api/notifications every 60s. Clicking an item marks it read and
 * optionally navigates to `action_url`. "Mark all read" bulk-PATCHes.
 */

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { P, MONO } from '../lib/design'

type Notification = {
  id: string
  kind: string
  severity: 'info' | 'warn' | 'error'
  title: string
  body: string | null
  action_url: string | null
  read_at: string | null
  created_at: string
}

const SEVERITY_COLOR: Record<Notification['severity'], string> = {
  info:  P.muted,
  warn:  '#b88404',
  error: P.oxblood,
}

function fmtRelative(iso: string) {
  const d = new Date(iso)
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / (60 * 24))}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const json = await res.json()
        setItems(json.notifications ?? [])
        setUnread(Number(json.unread_count) || 0)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, read: true }),
    })
    // Optimistic update
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
    setUnread((c) => Math.max(0, c - 1))
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true, read: true }),
    })
    setItems((list) => list.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    setUnread(0)
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: 0,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke={P.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6a4.5 4.5 0 0 1 9 0v3l1.5 2H1.5L3 9V6Z" />
          <path d="M6 12.5a1.5 1.5 0 0 0 3 0" />
        </svg>
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 14,
              height: 14,
              background: P.oxblood,
              color: '#fff',
              borderRadius: 7,
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              ...MONO,
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            width: 360,
            maxHeight: 460,
            overflowY: 'auto',
            background: '#fff',
            border: `1px solid ${P.rule}`,
            boxShadow: '0 20px 60px -20px rgba(0,0,0,0.25)',
            zIndex: 200,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              borderBottom: `1px solid ${P.rule}`,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: P.ink }}>Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 11,
                  color: P.muted,
                  cursor: 'pointer',
                  ...MONO,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {loading && items.length === 0 && (
            <div style={{ padding: 18, color: P.muted, fontSize: 12 }}>Loading…</div>
          )}
          {!loading && items.length === 0 && (
            <div style={{ padding: 18, color: P.muted, fontSize: 12 }}>You're all caught up.</div>
          )}

          {items.map((n) => {
            const unreadRow = !n.read_at
            const body = (
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: `1px solid ${P.rule}`,
                  background: unreadRow ? P.bg : 'transparent',
                  cursor: n.action_url ? 'pointer' : 'default',
                }}
                onClick={() => unreadRow && markRead(n.id)}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span
                    style={{
                      ...MONO,
                      fontSize: 9,
                      color: SEVERITY_COLOR[n.severity],
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {n.kind.replaceAll('_', ' ')}
                  </span>
                  <span style={{ fontSize: 10, color: P.muted }}>{fmtRelative(n.created_at)}</span>
                </div>
                <div style={{ fontSize: 13, color: P.ink, marginTop: 3, fontWeight: unreadRow ? 500 : 400 }}>
                  {n.title}
                </div>
                {n.body && (
                  <div style={{ fontSize: 12, color: P.muted, marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                )}
              </div>
            )
            return n.action_url ? (
              <Link key={n.id} href={n.action_url} onClick={() => markRead(n.id)} style={{ textDecoration: 'none', color: 'inherit' }}>
                {body}
              </Link>
            ) : (
              <div key={n.id}>{body}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
