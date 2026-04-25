import { getSupabaseAdmin } from '../../lib/supabase-admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Users — Admin' }

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q = '', page = '1' } = await searchParams
  const pageNum  = Math.max(1, parseInt(page))
  const perPage  = 50
  const offset   = (pageNum - 1) * perPage

  const supabaseAdmin = getSupabaseAdmin()
  const { data: { users: allUsers = [] } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })

  // Filter by search
  const filtered = q
    ? allUsers.filter(u =>
        u.email?.toLowerCase().includes(q.toLowerCase()) ||
        (u.user_metadata?.full_name as string)?.toLowerCase().includes(q.toLowerCase())
      )
    : allUsers

  // Sort newest first
  const sorted = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const paginated = sorted.slice(offset, offset + perPage)
  const totalPages = Math.ceil(sorted.length / perPage)

  // Get channel counts per user
  const { data: channels } = await supabaseAdmin
    .from('channels')
    .select('user_id, type, active')

  const channelsByUser: Record<string, number> = {}
  for (const ch of channels ?? []) {
    channelsByUser[ch.user_id] = (channelsByUser[ch.user_id] ?? 0) + 1
  }

  // Get listing counts
  const { data: listings } = await supabaseAdmin
    .from('channel_listings')
    .select('user_id')

  const listingsByUser: Record<string, number> = {}
  for (const l of listings ?? []) {
    listingsByUser[l.user_id] = (listingsByUser[l.user_id] ?? 0) + 1
  }

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>Users</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
            {sorted.length.toLocaleString()} account{sorted.length !== 1 ? 's' : ''}{q ? ` matching "${q}"` : ''}
          </p>
        </div>
        {/* Search */}
        <form method="GET" style={{ display: 'flex', gap: 10 }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by email or name…"
            style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#fff', fontSize: 13, width: 280, outline: 'none' }}
          />
          <button type="submit" style={{ background: '#e8863f', border: 'none', borderRadius: 8, padding: '9px 18px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Search
          </button>
          {q && (
            <Link href="/admin/users" style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Email','Name','Channels','Listings','Status','Joined',''].map(h => (
                <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(u => {
              const name    = (u.user_metadata?.full_name as string) || ''
              const chCount = channelsByUser[u.id] ?? 0
              const lstCount = listingsByUser[u.id] ?? 0
              const confirmed = !!u.email_confirmed_at

              return (
                <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `hsl(${u.email!.charCodeAt(0) * 13 % 360}, 50%, 35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {u.email!.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{u.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{name || '—'}</td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{ fontSize: 13, color: chCount > 0 ? '#a78bfa' : 'rgba(255,255,255,0.25)', fontWeight: chCount > 0 ? 600 : 400 }}>
                      {chCount > 0 ? `${chCount} channel${chCount !== 1 ? 's' : ''}` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{ fontSize: 13, color: lstCount > 0 ? '#60a5fa' : 'rgba(255,255,255,0.25)', fontWeight: lstCount > 0 ? 600 : 400 }}>
                      {lstCount > 0 ? lstCount.toLocaleString() : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 9999, background: confirmed ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: confirmed ? '#34d399' : '#f87171', fontWeight: 600 }}>
                      {confirmed ? 'Active' : 'Unconfirmed'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 12, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <Link href={`/admin/users/${u.id}`} style={{ fontSize: 12, color: '#e8863f', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      View →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
                  No users found{q ? ` for "${q}"` : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`/admin/users?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${p}`}
              style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: p === pageNum ? '#e8863f' : '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', color: p === pageNum ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
