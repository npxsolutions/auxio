'use client'

// BUNDLE_C — admin: eBay policy provisioning status per connected seller.
// Cream/ink/cobalt v8 craft. Owner-gated by the parent /admin layout.
import { useCallback, useEffect, useState } from 'react'
import { theme } from '../_lib/theme'

type Row = {
  channel_id: string
  user_id: string
  marketplace: string
  status: 'ok' | 'partial' | 'missing'
  payment_policy_id: string | null
  return_policy_id: string | null
  fulfillment_policy_id: string | null
  provisioned_at: string | null
}

export default function EbayPoliciesAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch('/api/admin/ebay-policies', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRows(data.rows ?? [])
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const reprovision = async (channelId: string) => {
    setBusy(channelId)
    setFlash(null)
    try {
      const res = await fetch('/api/admin/ebay-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setFlash(`Re-provisioned ${channelId.slice(0, 8)}…`)
      await load()
    } catch (e) {
      setFlash(`Error: ${(e as Error).message}`)
    } finally {
      setBusy(null)
    }
  }

  const cell: React.CSSProperties = { padding: '14px 16px', fontSize: 13, borderBottom: `1px solid ${theme.inkFaint}`, verticalAlign: 'middle' }
  const head: React.CSSProperties = { ...cell, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: theme.inkMuted, fontWeight: 600, background: theme.creamSoft }

  const statusBadge = (s: Row['status']) => {
    const map = {
      ok:      { label: 'Provisioned', bg: 'rgba(31,122,74,0.10)',  fg: theme.success },
      partial: { label: 'Partial',     bg: 'rgba(180,50,31,0.08)',  fg: theme.danger  },
      missing: { label: 'Missing',     bg: 'rgba(11,15,26,0.06)',   fg: theme.inkSoft },
    }[s]
    return (
      <span style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: 999,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
        background: map.bg, color: map.fg,
      }}>{map.label}</span>
    )
  }

  return (
    <div style={{ padding: '48px 56px 80px', maxWidth: 1180, fontFamily: theme.sans, color: theme.ink }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.inkMuted, fontWeight: 600 }}>
          Admin
        </div>
        <h1 style={{ fontFamily: theme.serif, fontSize: 48, fontWeight: 400, letterSpacing: '-0.02em', margin: '4px 0 6px' }}>
          eBay policies
        </h1>
        <p style={{ fontSize: 13, color: theme.inkSoft, margin: 0, maxWidth: 640 }}>
          Business policies (payment, returns, fulfillment) required by every eBay offer.
          Missing or partial rows block first-run publishes; re-provision to auto-create defaults.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <button
          onClick={load}
          disabled={loading}
          style={{
            background: theme.ink, color: theme.cream, border: 'none',
            padding: '8px 16px', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: theme.sans,
          }}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        {flash && (
          <span style={{ fontSize: 12.5, color: flash.startsWith('Error') ? theme.danger : theme.success }}>
            {flash}
          </span>
        )}
        {err && <span style={{ fontSize: 12.5, color: theme.danger }}>Error: {err}</span>}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${theme.inkFaint}`, borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={head}>User</th>
              <th style={head}>Marketplace</th>
              <th style={head}>Status</th>
              <th style={head}>Provisioned</th>
              <th style={{ ...head, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ ...cell, color: theme.inkMuted, textAlign: 'center', padding: 32 }}>
                  No eBay channels connected yet.
                </td>
              </tr>
            )}
            {rows.map(r => (
              <tr key={r.channel_id}>
                <td style={{ ...cell, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
                  {r.user_id.slice(0, 8)}…
                </td>
                <td style={cell}>{r.marketplace}</td>
                <td style={cell}>{statusBadge(r.status)}</td>
                <td style={{ ...cell, color: theme.inkSoft }}>
                  {r.provisioned_at ? new Date(r.provisioned_at).toLocaleString() : '—'}
                </td>
                <td style={{ ...cell, textAlign: 'right' }}>
                  <button
                    onClick={() => reprovision(r.channel_id)}
                    disabled={busy === r.channel_id}
                    style={{
                      background: 'transparent', color: theme.cobalt,
                      border: `1.5px solid ${theme.cobalt}`,
                      padding: '6px 14px', borderRadius: 6,
                      fontSize: 12, fontWeight: 500, fontFamily: theme.sans,
                      cursor: busy === r.channel_id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {busy === r.channel_id ? 'Working…' : 'Re-provision'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
