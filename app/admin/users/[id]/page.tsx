import { supabaseAdmin } from '../../../lib/supabase-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getUserDetail(id: string) {
  const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(id)
  if (error || !user) return null

  // Fetch all related data in parallel
  const [channelsRes, listingsRes, transactionsRes, settingsRes, ordersRes] = await Promise.all([
    supabaseAdmin.from('channels').select('*').eq('user_id', id),
    supabaseAdmin.from('listings').select('id, title, status, channel, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('transactions').select('id, sale_price, true_profit, channel, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('user_settings').select('*').eq('user_id', id).single(),
    supabaseAdmin.from('orders').select('id, status, total, channel, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  return {
    user,
    channels:     channelsRes.data     ?? [],
    listings:     listingsRes.data     ?? [],
    transactions: transactionsRes.data ?? [],
    settings:     settingsRes.data,
    orders:       ordersRes.data       ?? [],
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
        {title}
      </div>
      <div style={{ padding: '20px 22px' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'baseline' }}>
      <div style={{ width: 160, fontSize: 12, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#fff' }}>{value}</div>
    </div>
  )
}

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getUserDetail(id)
  if (!data) notFound()

  const { user, channels, listings, transactions, settings, orders } = data
  const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Unknown'

  const totalRevenue = transactions.reduce((s, t) => s + (Number(t.sale_price) || 0), 0)
  const totalProfit  = transactions.reduce((s, t) => s + (Number(t.true_profit) || 0), 0)

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900, fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
        <Link href="/admin/users" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Users</Link>
        <span>/</span>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>{name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `hsl(${user.email!.charCodeAt(0) * 13 % 360}, 50%, 35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff' }}>
          {user.email!.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 3 }}>{name}</h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{user.email}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999, background: user.email_confirmed_at ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: user.email_confirmed_at ? '#34d399' : '#f87171', fontWeight: 600 }}>
            {user.email_confirmed_at ? 'Email confirmed' : 'Unconfirmed'}
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Channels', value: channels.length, color: '#a78bfa' },
          { label: 'Listings', value: listings.length, color: '#60a5fa' },
          { label: 'Revenue (sample)', value: `£${totalRevenue.toFixed(2)}`, color: '#34d399' },
          { label: 'Profit (sample)', value: `£${totalProfit.toFixed(2)}`, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Account info */}
      <Section title="Account">
        <Row label="User ID"      value={<code style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{user.id}</code>} />
        <Row label="Email"        value={user.email} />
        <Row label="Phone"        value={user.phone || '—'} />
        <Row label="Provider"     value={user.app_metadata?.provider as string || 'email'} />
        <Row label="Confirmed"    value={user.email_confirmed_at ? new Date(user.email_confirmed_at).toLocaleString('en-GB') : 'Not confirmed'} />
        <Row label="Last sign in" value={user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-GB') : '—'} />
        <Row label="Joined"       value={new Date(user.created_at).toLocaleString('en-GB')} />
        <Row label="Category"     value={(user.user_metadata?.category as string) || '—'} />
        <Row label="Agent mode"   value={(settings?.agent_mode as string) || '—'} />
      </Section>

      {/* Channels */}
      <Section title={`Channels (${channels.length})`}>
        {channels.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No channels connected.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {channels.map((ch: any) => (
              <div key={ch.id} style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)', borderRadius: 8, padding: '8px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 2 }}>{ch.type} · {ch.shop_name || 'unnamed'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {ch.active ? '● Active' : '○ Inactive'} · Connected {new Date(ch.connected_at).toLocaleDateString('en-GB')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Recent listings */}
      <Section title={`Recent listings (${listings.length} shown)`}>
        {listings.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No listings yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Title','Channel','Status','Created'].map(h => (
                  <th key={h} style={{ padding: '6px 0', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map((l: any) => (
                <tr key={l.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '9px 0', fontSize: 12, color: '#fff', maxWidth: 320 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.title || 'Untitled'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{l.channel || '—'}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 9999, background: l.status === 'active' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)', color: l.status === 'active' ? '#34d399' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                      {l.status || 'draft'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 0', fontSize: 11, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                    {new Date(l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Recent orders */}
      {orders.length > 0 && (
        <Section title={`Recent orders (${orders.length} shown)`}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order ID','Channel','Status','Total','Date'].map(h => (
                  <th key={h} style={{ padding: '6px 0', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '9px 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{o.id.slice(0, 8)}…</td>
                  <td style={{ padding: '9px 12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{o.channel || '—'}</td>
                  <td style={{ padding: '9px 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{o.status || '—'}</td>
                  <td style={{ padding: '9px 12px', fontSize: 12, color: '#34d399', fontWeight: 600 }}>£{Number(o.total || 0).toFixed(2)}</td>
                  <td style={{ padding: '9px 0', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                    {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Raw metadata */}
      <Section title="Raw user metadata">
        <pre style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', overflowX: 'auto', lineHeight: 1.6, margin: 0 }}>
          {JSON.stringify({ id: user.id, metadata: user.user_metadata, app_metadata: user.app_metadata }, null, 2)}
        </pre>
      </Section>
    </div>
  )
}
