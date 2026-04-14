'use client'

import { useCallback, useEffect, useState } from 'react'
import { theme } from '../_lib/theme'

type ChannelStats = {
  user_id: string
  channel: string
  last_successful_sync: string | null
  error_rate_24h: number
  rate_limit_hits_24h: number
  queued_jobs: number
  failed_jobs: number
  dead_letter: number
}

type Payload = {
  generated_at: string
  known_channels: string[]
  per_channel: Record<string, ChannelStats>
  social_intel: { active_watches: number; failing_watches: number; last_successful_run: string | null }
  total_dead_letter: number
  total_blocked_sync_states: number
}

export default function SyncHealthPage() {
  const [data, setData] = useState<Payload | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch('/api/admin/sync-health', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Aggregate per-channel-type totals across all users for the summary table.
  const byChannel: Record<string, { channels: number; last: string | null; errorRate: number; queued: number; failed: number; deadLetter: number; rate429: number }> = {}
  if (data) {
    for (const row of Object.values(data.per_channel)) {
      const b = byChannel[row.channel] ?? { channels: 0, last: null, errorRate: 0, queued: 0, failed: 0, deadLetter: 0, rate429: 0 }
      b.channels += 1
      b.queued   += row.queued_jobs
      b.failed   += row.failed_jobs
      b.deadLetter += row.dead_letter
      b.rate429  += row.rate_limit_hits_24h
      b.errorRate = Math.max(b.errorRate, row.error_rate_24h)
      if (row.last_successful_sync && (!b.last || row.last_successful_sync > b.last)) b.last = row.last_successful_sync
      byChannel[row.channel] = b
    }
    for (const ch of data.known_channels) {
      if (!byChannel[ch]) byChannel[ch] = { channels: 0, last: null, errorRate: 0, queued: 0, failed: 0, deadLetter: 0, rate429: 0 }
    }
  }

  return (
    <div style={{ padding: '48px 56px 80px', maxWidth: 1180, fontFamily: theme.sans, color: theme.ink }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.inkMuted, fontWeight: 600 }}>
            Admin
          </div>
          <h1 style={{ fontFamily: theme.serif, fontSize: 48, fontWeight: 400, letterSpacing: '-0.02em', margin: '4px 0 0' }}>
            Sync health
          </h1>
          <p style={{ fontSize: 13, color: theme.inkSoft, marginTop: 6 }}>
            {data ? `Generated ${new Date(data.generated_at).toLocaleTimeString()}` : 'Loading…'}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 600,
            background: theme.ink,
            color: theme.cream,
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {err && (
        <div style={{ padding: 14, border: `1px solid ${theme.inkFaint}`, background: '#fff', borderRadius: 8, color: theme.danger, fontSize: 13, marginBottom: 20 }}>
          {err}
        </div>
      )}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <Summary label="Dead letter" value={data.total_dead_letter} />
            <Summary label="Blocked sync states" value={data.total_blocked_sync_states} />
            <Summary label="Active watches" value={data.social_intel.active_watches} />
            <Summary label="Failing watches" value={data.social_intel.failing_watches} />
          </div>

          <div style={{ background: '#fff', border: `1px solid ${theme.inkFaint}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: theme.creamSoft }}>
                  {['Channel', 'Connections', 'Last successful', 'Error rate 24h', 'Queued', 'Failed', 'Dead letter', 'Rate-limited'].map(h => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '11px 16px',
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: theme.inkMuted,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(byChannel).sort(([a], [b]) => a.localeCompare(b)).map(([ch, b]) => (
                  <tr key={ch} style={{ borderTop: `1px solid ${theme.inkFaint}` }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{ch}</td>
                    <td style={{ padding: '10px 16px' }}>{b.channels}</td>
                    <td style={{ padding: '10px 16px', color: theme.inkSoft }}>
                      {b.last ? new Date(b.last).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', color: b.errorRate > 0.2 ? theme.danger : theme.ink }}>
                      {(b.errorRate * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '10px 16px' }}>{b.queued}</td>
                    <td style={{ padding: '10px 16px', color: b.failed > 0 ? theme.danger : theme.ink }}>{b.failed}</td>
                    <td style={{ padding: '10px 16px' }}>{b.deadLetter}</td>
                    <td style={{ padding: '10px 16px' }}>{b.rate429}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${theme.inkFaint}`, borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.inkMuted, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontFamily: theme.serif, fontSize: 32, color: theme.cobalt, marginTop: 6, lineHeight: 1 }}>{value}</div>
    </div>
  )
}
