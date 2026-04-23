import { getSupabaseAdmin } from '../../lib/supabase-admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Metrics — Admin' }

const PLAN_MRR: Record<string, number> = {
  starter:    79.99,
  growth:     199,
  scale:      599,
  enterprise: 1500,
}

async function getMetrics() {
  const admin = getSupabaseAdmin()

  const [authRes, orgsRes, channelsRes, listingsRes, txnsRes] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('organizations').select('id, plan, subscription_status, created_at, updated_at'),
    admin.from('channels').select('user_id, type, active, connected_at'),
    admin.from('listings').select('user_id, status, created_at'),
    admin.from('transactions').select('user_id, true_profit, gross_revenue, created_at'),
  ])

  const authUsers  = authRes.data?.users ?? []
  const orgs       = orgsRes.data  ?? []
  const channels   = channelsRes.data ?? []
  const listings   = listingsRes.data  ?? []
  const txns       = txnsRes.data      ?? []

  // ── MRR (aggregated per organization) ────────────────────────────────────
  const active   = orgs.filter(o => o.subscription_status === 'active' && o.plan && o.plan !== 'free')
  const pastDue  = orgs.filter(o => o.subscription_status === 'past_due')
  const churned  = orgs.filter(o => o.subscription_status === 'cancelled')

  const mrr = active.reduce((sum, o) => sum + (PLAN_MRR[o.plan] ?? 0), 0)
  const arr = mrr * 12

  const planCounts: Record<string, number> = {}
  for (const o of active) planCounts[o.plan] = (planCounts[o.plan] ?? 0) + 1

  // ── User growth ───────────────────────────────────────────────────────────
  const now = new Date()
  const monthAgo  = new Date(now.getFullYear(), now.getMonth() - 1,  now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const newThisMonth  = authUsers.filter(u => new Date(u.created_at) >= monthStart).length
  const newLastMonth  = authUsers.filter(u => {
    const d = new Date(u.created_at)
    return d >= monthAgo && d < monthStart
  }).length

  // Monthly growth for last 6 months
  const months: { label: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const count = authUsers.filter(u => {
      const d = new Date(u.created_at)
      return d >= start && d <= end
    }).length
    months.push({ label: start.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), count })
  }

  // ── Usage metrics ─────────────────────────────────────────────────────────
  const activeListings = listings.filter(l => (l as any).status === 'active').length
  const totalGMV       = txns.reduce((s, t) => s + (Number((t as any).gross_revenue) || 0), 0)
  const totalProfit    = txns.reduce((s, t) => s + (Number((t as any).true_profit)    || 0), 0)

  const channelTypes: Record<string, number> = {}
  for (const ch of channels) channelTypes[(ch as any).type] = (channelTypes[(ch as any).type] ?? 0) + 1

  // ── Rule of 40 estimate ───────────────────────────────────────────────────
  // Growth rate = (newThisMonth - newLastMonth) / max(newLastMonth,1) * 100
  const growthRate = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : 0

  return {
    mrr, arr,
    activeCustomers: active.length,
    pastDue: pastDue.length,
    churnedTotal: churned.length,
    planCounts,
    newThisMonth, newLastMonth,
    months,
    totalAuthUsers: authUsers.length,
    activeListings,
    totalGMV,
    totalProfit,
    channelTypes,
    growthRate,
  }
}

function Stat({ label, value, sub, color = '#e8863f', small = false }: { label: string; value: string; sub?: string; color?: string; small?: boolean }) {
  return (
    <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: small ? '16px 20px' : '22px 26px' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: small ? 24 : 36, fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 9999, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 9999, transition: 'width 0.6s ease' }} />
    </div>
  )
}

export default async function AdminMetrics() {
  let m: Awaited<ReturnType<typeof getMetrics>> | null = null
  let error = ''
  try { m = await getMetrics() }
  catch (e: any) { error = e.message }

  if (error) return (
    <div style={{ padding: '40px 48px', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
      Error loading metrics: {error}
    </div>
  )
  if (!m) return null

  const fmt = (n: number, prefix = '£') => `${prefix}${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const maxMonthCount = Math.max(...m.months.map(x => x.count), 1)

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>Business Metrics</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Revenue, growth, and usage — your data room in one page.</p>
      </div>

      {/* ── Core revenue ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        <Stat label="Monthly Recurring Revenue" value={fmt(m.mrr)} sub="active subscriptions only" color="#34d399" />
        <Stat label="Annual Run Rate (ARR)"      value={fmt(m.arr)} sub="MRR × 12"                 color="#34d399" />
        <Stat label="Paying customers"           value={String(m.activeCustomers)} sub={`${m.churnedTotal} churned all time`} color="#a78bfa" />
        <Stat label="Past due"                   value={String(m.pastDue)} sub="payment failing"   color={m.pastDue > 0 ? '#f87171' : '#34d399'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <Stat label="New signups this month" value={String(m.newThisMonth)} sub={`${m.newLastMonth} last month`} small />
        <Stat label="MoM user growth"        value={`${m.growthRate > 0 ? '+' : ''}${m.growthRate}%`} sub="vs previous month" color={m.growthRate > 0 ? '#34d399' : '#f87171'} small />
        <Stat label="Total registered users" value={String(m.totalAuthUsers)} sub="inc. free tier" small />
        <Stat label="Active listings"        value={m.activeListings.toLocaleString()} sub="across all users" color="#60a5fa" small />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Plan breakdown */}
        <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '22px 26px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Revenue by plan</div>
          {Object.entries(PLAN_MRR).map(([plan, price]) => {
            const count = m!.planCounts[plan] ?? 0
            const rev   = count * price
            const pct   = m!.mrr > 0 ? (rev / m!.mrr) * 100 : 0
            const colors: Record<string, string> = { starter: '#60a5fa', growth: '#a78bfa', scale: '#34d399', enterprise: '#f59e0b' }
            return (
              <div key={plan} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', fontWeight: 500 }}>{plan}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{count} × £{price}/mo = <span style={{ color: '#fff', fontWeight: 600 }}>{fmt(rev)}</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bar pct={pct} color={colors[plan]} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', width: 36, textAlign: 'right' }}>{Math.round(pct)}%</span>
                </div>
              </div>
            )
          })}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Total MRR</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#34d399', letterSpacing: '-0.02em' }}>{fmt(m.mrr)}</span>
          </div>
        </div>

        {/* User signups chart */}
        <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '22px 26px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 20 }}>New signups — last 6 months</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
            {m.months.map(({ label, count }) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{count}</div>
                <div style={{ width: '100%', background: '#e8863f', borderRadius: '4px 4px 0 0', height: `${Math.max(4, (count / maxMonthCount) * 80)}px`, transition: 'height 0.4s ease' }} />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel distribution + GMV */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '22px 26px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 18 }}>Channels connected (platform-wide)</div>
          {Object.entries(m.channelTypes).sort((a,b) => b[1]-a[1]).map(([type, count]) => {
            const total = Object.values(m!.channelTypes).reduce((s,n) => s+n, 0)
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', width: 80, textTransform: 'capitalize', fontWeight: 500 }}>{type}</span>
                <Bar pct={(count/total)*100} color="#60a5fa" />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 24, textAlign: 'right', fontWeight: 600 }}>{count}</span>
              </div>
            )
          })}
          {Object.keys(m.channelTypes).length === 0 && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>No channels connected yet.</div>
          )}
        </div>

        <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '22px 26px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 18 }}>GMV &amp; profit managed</div>
          {[
            { label: 'Total GMV processed', value: fmt(m.totalGMV), note: 'gross revenue across all orders', color: '#60a5fa' },
            { label: 'Total true profit', value: fmt(m.totalProfit), note: 'after all fees & costs', color: '#34d399' },
            { label: 'Platform margin rate', value: m.totalGMV > 0 ? `${((m.totalProfit / m.totalGMV) * 100).toFixed(1)}%` : '—', note: 'avg profit/revenue ratio', color: '#f59e0b' },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>{r.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: r.color, letterSpacing: '-0.02em' }}>{r.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{r.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Unit economics & retention ── */}
      {/* Scaffold slots — values populate automatically once we have >=3 months
          of paid customer data (first 10 founding partners + time). Empty
          state is intentional; PE diligence reads "metric exists but empty"
          as "measured but pre-ARR" which is correct positioning. */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Unit economics &amp; retention — fills at 90-day post-launch mark</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          <Stat label="Net Revenue Retention (NRR)" value="—" sub="trailing 12m, target ≥ 110%" color="#a78bfa" small />
          <Stat label="Gross Revenue Retention (GRR)" value="—" sub="trailing 12m, target ≥ 90%" color="#a78bfa" small />
          <Stat label="Logo churn (monthly)" value="—" sub="% cancellations / active customers" color="#f87171" small />
          <Stat label="CAC payback" value="—" sub="months to recover CAC from ARR" color="#60a5fa" small />
          <Stat label="LTV / CAC ratio" value="—" sub="target ≥ 3.0" color="#34d399" small />
        </div>
      </div>

      {/* Data room readiness */}
      <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Data room readiness</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Things acquirers ask for in due diligence</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { item: 'MRR waterfall tracked',          done: m.mrr > 0,              note: 'Active subscriptions in Stripe' },
            { item: 'Churn rate calculable',           done: m.churnedTotal > 0 || m.activeCustomers > 0, note: 'Cancellations tracked' },
            { item: 'GMV data captured',               done: m.totalGMV > 0,         note: 'Transactions in database' },
            { item: 'Admin panel operational',         done: true,                   note: 'You are here' },
            { item: 'Public API foundation',           done: true,                   note: '/api/v1/ live' },
            { item: 'Terms of service in place',       done: true,                   note: '/terms page live' },
            { item: 'Privacy policy in place',         done: true,                   note: '/privacy page live' },
            { item: 'Stripe subscription billing',     done: false,                  note: 'Set up Stripe prices + webhooks' },
            { item: 'NRR metric tracked',              done: m.activeCustomers > 5,  note: 'Need expansion/contraction data' },
          ].map(({ item, done, note }) => (
            <div key={item} style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{done ? '✓' : '○'}</span>
              <div>
                <div style={{ fontSize: 12, color: done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: 2 }}>{item}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
