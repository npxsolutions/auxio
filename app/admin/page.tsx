import { supabaseAdmin } from '../lib/supabase-admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getStats() {
  // All users from Supabase Auth
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (error || !users) return null

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  const total       = users.length
  const last30      = users.filter(u => new Date(u.created_at) > thirtyDaysAgo).length
  const last7       = users.filter(u => new Date(u.created_at) > sevenDaysAgo).length
  const confirmed   = users.filter(u => u.email_confirmed_at).length
  const recentSignups = [...users]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  // Channel stats
  const { data: channels } = await supabaseAdmin
    .from('channels')
    .select('user_id, type, active')

  const usersWithChannels = new Set(channels?.map(c => c.user_id) ?? []).size
  const totalChannels = channels?.length ?? 0

  return { total, last30, last7, confirmed, recentSignups, usersWithChannels, totalChannels }
}

function StatCard({ label, value, sub, color = '#7c6af7' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default async function AdminOverview() {
  const stats = await getStats()

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>Overview</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Platform metrics and recent activity</p>
      </div>

      {!stats ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          Could not load stats — check SUPABASE_SERVICE_ROLE_KEY in environment variables.
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
            <StatCard label="Total users"         value={stats.total}              sub="all time" />
            <StatCard label="Joined last 30d"     value={stats.last30}             sub="new accounts" color="#34d399" />
            <StatCard label="Joined last 7d"      value={stats.last7}              sub="this week"    color="#60a5fa" />
            <StatCard label="Email confirmed"     value={stats.confirmed}          sub={`of ${stats.total}`} color="#f59e0b" />
            <StatCard label="Users with channels" value={stats.usersWithChannels}  sub="have connected ≥1 channel" />
            <StatCard label="Total channels"      value={stats.totalChannels}      sub="across all accounts" color="#a78bfa" />
          </div>

          {/* Recent signups */}
          <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Recent signups</div>
              <Link href="/admin/users" style={{ fontSize: 12, color: '#7c6af7', textDecoration: 'none', fontWeight: 500 }}>
                View all users →
              </Link>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Email','Name','Confirmed','Joined'].map(h => (
                    <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentSignups.map((u, i) => (
                  <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 24px' }}>
                      <Link href={`/admin/users/${u.id}`} style={{ color: '#7c6af7', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                        {u.email}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 24px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                      {(u.user_metadata?.full_name as string) || '—'}
                    </td>
                    <td style={{ padding: '12px 24px' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 9999, background: u.email_confirmed_at ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: u.email_confirmed_at ? '#34d399' : '#f87171', fontWeight: 600 }}>
                        {u.email_confirmed_at ? 'Yes' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 24px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
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
