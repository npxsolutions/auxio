'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { theme } from '../_lib/theme'

export function DetailShell({
  title,
  backHref,
  backLabel,
  row,
  statuses,
  apiPath,             // e.g. /api/admin/partners/<id>
  slackChannelUrl,
  initialStatus,
  initialNotes,
  hideNotes = false,
  extraActions,
}: {
  title: string
  backHref: string
  backLabel: string
  row: Record<string, unknown>
  statuses?: readonly string[]
  apiPath: string
  slackChannelUrl?: string | null
  initialStatus?: string | null
  initialNotes?: string | null
  hideNotes?: boolean
  extraActions?: React.ReactNode
}) {
  const [status, setStatus] = useState(initialStatus ?? '')
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function save() {
    setMsg(null)
    setErr(null)
    start(async () => {
      try {
        const body: Record<string, unknown> = {}
        if (statuses && status) body.status = status
        if (!hideNotes) body.admin_notes = notes
        const res = await fetch(apiPath, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.error || `HTTP ${res.status}`)
        }
        setMsg('Saved.')
      } catch (e) {
        setErr((e as Error).message)
      }
    })
  }

  return (
    <div style={{ padding: '48px 56px 80px', maxWidth: 960, fontFamily: theme.sans, color: theme.ink }}>
      <Link href={backHref} style={{ fontSize: 12, color: theme.inkMuted, textDecoration: 'none' }}>
        ← {backLabel}
      </Link>
      <h1
        style={{
          fontFamily: theme.serif,
          fontSize: 44,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '8px 0 4px',
        }}
      >
        {title}
      </h1>
      <p style={{ fontSize: 12, color: theme.inkMuted, marginBottom: 28 }}>
        id: <code>{String(row.id)}</code>
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 24,
        }}
      >
        {/* Fields */}
        <section style={{ background: '#fff', border: `1px solid ${theme.inkFaint}`, borderRadius: 10, padding: 24 }}>
          <h2 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 400, margin: '0 0 14px' }}>Record</h2>
          <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '10px 18px', margin: 0, fontSize: 13 }}>
            {Object.entries(row).map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt style={{ color: theme.inkMuted, fontWeight: 500 }}>{k}</dt>
                <dd style={{ margin: 0, color: theme.ink, wordBreak: 'break-word' }}>
                  <Value v={v} />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Actions */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: `1px solid ${theme.inkFaint}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontFamily: theme.serif, fontSize: 20, fontWeight: 400, margin: '0 0 12px' }}>Actions</h3>

            {statuses && (
              <label style={{ display: 'block', fontSize: 12, color: theme.inkMuted, marginBottom: 6 }}>Status</label>
            )}
            {statuses && (
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: 13,
                  border: `1px solid ${theme.inkFaint}`,
                  borderRadius: 6,
                  background: '#fff',
                  color: theme.ink,
                  fontFamily: theme.sans,
                  marginBottom: 14,
                }}
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            {!hideNotes && (
              <>
                <label style={{ display: 'block', fontSize: 12, color: theme.inkMuted, marginBottom: 6 }}>
                  Internal notes
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={5}
                  placeholder="Notes visible only to admins…"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: 13,
                    border: `1px solid ${theme.inkFaint}`,
                    borderRadius: 6,
                    background: '#fff',
                    color: theme.ink,
                    fontFamily: theme.sans,
                    resize: 'vertical',
                  }}
                />
              </>
            )}

            {extraActions}

            <button
              type="button"
              onClick={save}
              disabled={pending}
              style={{
                marginTop: 14,
                width: '100%',
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 600,
                background: theme.cobalt,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: pending ? 'wait' : 'pointer',
                opacity: pending ? 0.7 : 1,
              }}
            >
              {pending ? 'Saving…' : 'Save changes'}
            </button>

            {msg && <div style={{ fontSize: 12, color: theme.success, marginTop: 10 }}>{msg}</div>}
            {err && <div style={{ fontSize: 12, color: theme.danger, marginTop: 10 }}>{err}</div>}
          </div>

          {slackChannelUrl && (
            <a
              href={slackChannelUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 13,
                color: theme.cobalt,
                textDecoration: 'none',
                padding: '12px 16px',
                border: `1px dashed ${theme.inkFaint}`,
                borderRadius: 8,
                background: '#fff',
              }}
            >
              Open in Slack →
            </a>
          )}
        </aside>
      </div>
    </div>
  )
}

function Value({ v }: { v: unknown }) {
  if (v === null || v === undefined) return <span style={{ color: theme.inkMuted }}>—</span>
  if (typeof v === 'boolean') return <span>{v ? 'true' : 'false'}</span>
  if (typeof v === 'object') return <code style={{ fontSize: 12 }}>{JSON.stringify(v)}</code>
  return <span>{String(v)}</span>
}
