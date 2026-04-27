/**
 * Morning digest cron — service-role, no user session.
 *
 * TODO Phase 1 / Stage C.3: convert from per-user loop to per-org loop
 * (query `organizations` rows and read `email_alerts` from the org or its
 * owner). Today service-role bypasses RLS so the user_id-based filter still
 * works; conversion is a C.3 cleanup.
 */
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const getResend = () => new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  // Authenticate cron call
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const resend = getResend()

  // Get yesterday's date range
  const now = new Date()
  const yesterdayStart = new Date(now)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  yesterdayStart.setHours(0, 0, 0, 0)
  const yesterdayEnd = new Date(yesterdayStart)
  yesterdayEnd.setHours(23, 59, 59, 999)

  // Get all users with email alerts enabled
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, email_alerts')
    .eq('email_alerts', true)

  if (usersErr) {
    console.error('[digest] users query error:', usersErr)
    return NextResponse.json({ error: usersErr.message }, { status: 500 })
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No users with email alerts enabled' })
  }

  // Get auth users for emails
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const u of authData?.users || []) {
    if (u.email) emailMap[u.id] = u.email
  }

  let sent = 0
  let failed = 0

  for (const user of users) {
    const email = emailMap[user.id]
    if (!email) continue

    try {
      // Fetch yesterday's transactions for this user
      const { data: txns } = await supabase
        .from('transactions')
        .select('gross_revenue, true_profit, advertising_cost, channel, sku, title')
        .eq('user_id', user.id)
        .gte('order_date', yesterdayStart.toISOString())
        .lte('order_date', yesterdayEnd.toISOString())

      // Fetch last 7 days for trend
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: txns7d } = await supabase
        .from('transactions')
        .select('gross_revenue, true_profit')
        .eq('user_id', user.id)
        .gte('order_date', sevenDaysAgo.toISOString())
        .lt('order_date', yesterdayStart.toISOString())

      const revenue   = (txns || []).reduce((s, t) => s + (t.gross_revenue || 0), 0)
      const profit    = (txns || []).reduce((s, t) => s + (t.true_profit   || 0), 0)
      const adSpend   = (txns || []).reduce((s, t) => s + (t.advertising_cost || 0), 0)
      const orders    = (txns || []).length
      const margin    = revenue > 0 ? (profit / revenue) * 100 : 0
      const roas      = adSpend > 0 ? revenue / adSpend : 0

      // Channel breakdown
      const channelMap: Record<string, { revenue: number; profit: number; orders: number }> = {}
      for (const t of txns || []) {
        const ch = t.channel || 'other'
        if (!channelMap[ch]) channelMap[ch] = { revenue: 0, profit: 0, orders: 0 }
        channelMap[ch].revenue += t.gross_revenue || 0
        channelMap[ch].profit  += t.true_profit   || 0
        channelMap[ch].orders  += 1
      }
      const topChannel = Object.entries(channelMap).sort((a, b) => b[1].revenue - a[1].revenue)[0]

      // Top product
      const skuMap: Record<string, { title: string; profit: number; orders: number }> = {}
      for (const t of txns || []) {
        const key = t.sku || t.title || 'Unknown'
        if (!skuMap[key]) skuMap[key] = { title: t.title || key, profit: 0, orders: 0 }
        skuMap[key].profit += t.true_profit || 0
        skuMap[key].orders += 1
      }
      const topProduct = Object.values(skuMap).sort((a, b) => b.profit - a.profit)[0]

      // 7-day average daily profit for trend
      const avg7dProfit = txns7d && txns7d.length > 0
        ? (txns7d.reduce((s, t) => s + (t.true_profit || 0), 0)) / 6
        : 0
      const trendUp = profit >= avg7dProfit

      const dateLabel = yesterdayStart.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

      const html = buildDigestEmail({
        email,
        dateLabel,
        revenue,
        profit,
        orders,
        margin,
        roas: adSpend > 0 ? roas : null,
        topChannel: topChannel ? { name: topChannel[0], ...topChannel[1] } : null,
        topProduct: topProduct || null,
        trendUp,
        avg7dProfit,
        noData: orders === 0,
      })

      await resend.emails.send({
        from: 'Palvento <digest@palvento.com>',
        to: email,
        subject: orders > 0
          ? `Your ${dateLabel} digest — £${profit.toFixed(0)} profit from ${orders} order${orders !== 1 ? 's' : ''}`
          : `Your ${dateLabel} digest — no sales yesterday`,
        html,
      })

      sent++
    } catch (err: any) {
      console.error(`[digest] failed for user ${user.id}:`, err.message)
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: users.length })
}

// Vercel cron also calls via GET
export async function GET(request: Request) {
  return POST(request)
}

interface DigestData {
  email: string
  dateLabel: string
  revenue: number
  profit: number
  orders: number
  margin: number
  roas: number | null
  topChannel: { name: string; revenue: number; profit: number; orders: number } | null
  topProduct: { title: string; profit: number; orders: number } | null
  trendUp: boolean
  avg7dProfit: number
  noData: boolean
}

function buildDigestEmail(d: DigestData): string {
  const fmt = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const pct  = (n: number) => `${n.toFixed(1)}%`

  const channelName = (slug: string) =>
    ({ shopify: 'Shopify', ebay: 'eBay', amazon: 'Amazon', etsy: 'Etsy', tiktok: 'TikTok Shop', facebook: 'Facebook' })[slug] || slug

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Palvento Daily Digest</title>
</head>
<body style="margin:0;padding:0;background:#f8f4ec;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ec;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Header -->
  <tr><td style="padding-bottom:20px;">
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <div style="display:inline-flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;background:linear-gradient(135deg,#e8863f,#e8863f);border-radius:7px;display:inline-block;"></div>
          <span style="font-size:15px;font-weight:700;color:#0b0f1a;letter-spacing:-0.01em;">Palvento</span>
        </div>
      </td>
      <td align="right" style="font-size:12px;color:#9b9ea8;">${d.dateLabel}</td>
    </tr>
    </table>
  </td></tr>

  <!-- Main card -->
  <tr><td style="background:white;border-radius:16px;border:1px solid #e8e5df;overflow:hidden;">

    <!-- Top strip -->
    <tr><td style="background:linear-gradient(135deg,#0b0f1a 0%,#1e293b 100%);padding:32px 36px;">
      <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">Yesterday's summary</div>
      ${d.noData ? `
      <div style="font-size:22px;font-weight:700;color:white;letter-spacing:-0.02em;">No sales recorded</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.45);margin-top:6px;">Keep pushing — your next order is coming.</div>
      ` : `
      <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:32px;">
          <div style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">True Profit</div>
          <div style="font-size:38px;font-weight:800;color:${d.profit >= 0 ? '#4ade80' : '#f87171'};letter-spacing:-0.03em;line-height:1;">${fmt(d.profit)}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-top:4px;">${pct(d.margin)} margin · ${d.orders} order${d.orders !== 1 ? 's' : ''}</div>
        </td>
        <td>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Revenue</div>
          <div style="font-size:28px;font-weight:700;color:white;letter-spacing:-0.02em;">${fmt(d.revenue)}</div>
          ${d.roas ? `<div style="font-size:12px;color:rgba(255,255,255,0.35);margin-top:4px;">${d.roas.toFixed(1)}x ROAS</div>` : ''}
        </td>
      </tr>
      </table>
      `}
    </td></tr>

    ${!d.noData ? `
    <!-- Stats row -->
    <tr><td style="padding:24px 36px;border-bottom:1px solid #f1f5f9;">
      <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${d.topChannel ? `
        <td style="padding-right:16px;">
          <div style="font-size:11px;color:#9b9ea8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Top Channel</div>
          <div style="font-size:14px;font-weight:700;color:#1a1b22;">${channelName(d.topChannel.name)}</div>
          <div style="font-size:12px;color:#6b6e87;margin-top:2px;">${fmt(d.topChannel.revenue)} · ${d.topChannel.orders} orders</div>
        </td>
        ` : ''}
        ${d.topProduct ? `
        <td>
          <div style="font-size:11px;color:#9b9ea8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Top Product</div>
          <div style="font-size:14px;font-weight:700;color:#1a1b22;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;">${d.topProduct.title}</div>
          <div style="font-size:12px;color:#6b6e87;margin-top:2px;">${fmt(d.topProduct.profit)} profit · ${d.topProduct.orders} sold</div>
        </td>
        ` : ''}
      </tr>
      </table>
    </td></tr>

    <!-- Trend -->
    <tr><td style="padding:20px 36px;border-bottom:1px solid #f1f5f9;">
      <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:36px;padding-right:12px;">
          <div style="width:36px;height:36px;border-radius:50%;background:${d.trendUp ? '#dcfce7' : '#fef2f2'};display:flex;align-items:center;justify-content:center;font-size:16px;">
            ${d.trendUp ? '📈' : '📉'}
          </div>
        </td>
        <td>
          <div style="font-size:13px;font-weight:600;color:#1a1b22;">
            ${d.trendUp
              ? `${d.avg7dProfit > 0 ? `${pct(((d.profit - d.avg7dProfit) / d.avg7dProfit) * 100)} above your 7-day average` : 'Strong day'}`
              : `${d.avg7dProfit > 0 ? `${pct(((d.avg7dProfit - d.profit) / d.avg7dProfit) * 100)} below your 7-day average` : 'Slower day'}`
            }
          </div>
          <div style="font-size:12px;color:#9b9ea8;margin-top:2px;">
            7-day avg: ${fmt(d.avg7dProfit)}/day profit
          </div>
        </td>
      </tr>
      </table>
    </td></tr>
    ` : ''}

    <!-- CTA -->
    <tr><td style="padding:24px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <a href="https://palvento-lkqv.vercel.app/dashboard" style="display:inline-block;background:#0b0f1a;color:white;text-decoration:none;border-radius:8px;padding:11px 20px;font-size:13px;font-weight:600;">Open dashboard →</a>
        </td>
        <td align="right">
          <a href="https://palvento-lkqv.vercel.app/agent" style="display:inline-block;border:1px solid #e8e5df;color:#1a1b22;text-decoration:none;border-radius:8px;padding:11px 20px;font-size:13px;font-weight:600;">AI insights →</a>
        </td>
      </tr>
      </table>
    </td></tr>

  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 0;text-align:center;">
    <div style="font-size:12px;color:#c0bdb7;">
      You're receiving this because daily digests are enabled in your Palvento account.
      <br>
      <a href="https://palvento-lkqv.vercel.app/settings" style="color:#9b9ea8;text-decoration:none;">Manage preferences</a>
      &nbsp;·&nbsp;
      <a href="https://palvento-lkqv.vercel.app/unsubscribe?email=${encodeURIComponent(d.email)}&type=digest" style="color:#9b9ea8;text-decoration:none;">Unsubscribe</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
