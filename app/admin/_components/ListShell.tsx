import Link from 'next/link'
import { theme } from '../_lib/theme'
import { StatusPill } from './StatusPill'

export type ListColumn<T> = {
  header: string
  render: (row: T) => React.ReactNode
  width?: string | number
}

export function ListShell<T extends { id: string }>({
  title,
  entityPath,
  statuses,
  currentStatus,
  search,
  rows,
  columns,
  totalCount,
}: {
  title: string
  entityPath: string                // e.g. '/admin/partners'
  statuses: readonly string[]       // filter chips
  currentStatus: string | null
  search: string
  rows: T[]
  columns: ListColumn<T>[]
  totalCount: number
}) {
  return (
    <div style={{ padding: '48px 56px 80px', maxWidth: 1280, fontFamily: theme.sans, color: theme.ink }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.inkMuted, fontWeight: 600 }}>
          Admin
        </div>
        <h1
          style={{
            fontFamily: theme.serif,
            fontSize: 48,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: '4px 0 0',
            color: theme.ink,
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 13, color: theme.inkSoft, marginTop: 6 }}>
          {totalCount} record{totalCount === 1 ? '' : 's'} shown
        </p>
      </div>

      {/* Controls */}
      <form method="get" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip href={`${entityPath}${search ? `?q=${encodeURIComponent(search)}` : ''}`} active={!currentStatus}>All</Chip>
          {statuses.map(s => {
            const qs = new URLSearchParams()
            qs.set('status', s)
            if (search) qs.set('q', search)
            return (
              <Chip key={s} href={`${entityPath}?${qs.toString()}`} active={currentStatus === s}>
                {s.replace(/_/g, ' ')}
              </Chip>
            )
          })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {currentStatus && <input type="hidden" name="status" value={currentStatus} />}
          <input
            name="q"
            defaultValue={search}
            placeholder="Search email…"
            style={{
              padding: '8px 12px',
              fontSize: 13,
              border: `1px solid ${theme.inkFaint}`,
              borderRadius: 6,
              background: '#fff',
              minWidth: 220,
              fontFamily: theme.sans,
              color: theme.ink,
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              fontSize: 13,
              background: theme.ink,
              color: theme.cream,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: theme.sans,
            }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Table */}
      <div style={{ background: '#fff', border: `1px solid ${theme.inkFaint}`, borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: theme.creamSoft }}>
              {columns.map(c => (
                <th
                  key={c.header}
                  style={{
                    textAlign: 'left',
                    padding: '11px 18px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: theme.inkMuted,
                    width: c.width,
                  }}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '32px 18px', textAlign: 'center', color: theme.inkMuted, fontSize: 13 }}>
                  No records.
                </td>
              </tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} style={{ borderTop: `1px solid ${theme.inkFaint}` }}>
                  {columns.map((c, i) => (
                    <td key={i} style={{ padding: '12px 18px', fontSize: 13, color: theme.ink, verticalAlign: 'top' }}>
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        textDecoration: 'none',
        background: active ? theme.ink : 'transparent',
        color: active ? theme.cream : theme.inkSoft,
        border: `1px solid ${active ? theme.ink : theme.inkFaint}`,
      }}
    >
      {children}
    </Link>
  )
}

export { StatusPill }
