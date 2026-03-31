import { NextResponse } from 'next/server'
import { createClient } from '../../lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const getAnthropic = () => new Anthropic({
  apiKey: process.env.NEXT_ANTHROPIC_API_KEY!
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get user's agent mode
    const { data: userData } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()

    const mode = 'copilot' // default safe mode

    // Pull all intelligence needed
    const [products, ppc, inventory] = await Promise.all([
      supabase.from('product_intelligence').select('*').eq('user_id', user.id),
      supabase.from('ppc_keyword_performance').select('*').eq('user_id', user.id).gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('inventory').select('*').eq('user_id', user.id),
    ])

    const pendingActions: any[] = []

    // CHECK 1: Critical stockouts
    for (const product of products.data || []) {
      if (product.reorder_urgency === 'critical' || product.reorder_urgency === 'high') {
        pendingActions.push({
          user_id: user.id,
          action_type: 'restock_alert',
          title: `Restock ${product.sku}`,
          description: `${product.days_until_stockout?.toFixed(1)} days until stockout at current velocity`,
          reason: `Selling ${product.velocity_7d?.toFixed(1)} units/day`,
          profit_impact: product.predicted_30d_revenue * 0.22,
          action_data: { sku: product.sku, urgency: product.reorder_urgency },
          status: 'pending',
        })
      }
    }

    // CHECK 2: PPC waste keywords
    const wastedKeywords = (ppc.data || [])
      .filter((k: any) => k.clicks >= 15 && k.orders === 0)
      .slice(0, 8)

    for (const kw of wastedKeywords) {
      pendingActions.push({
        user_id: user.id,
        action_type: 'negative_keyword',
        title: `Negative: "${kw.keyword_text}"`,
        description: `${kw.clicks} clicks, 0 conversions — wasting £${kw.spend?.toFixed(2)}`,
        reason: 'Zero conversions after 15+ clicks',
        profit_impact: kw.spend || 0,
        action_data: { keywordId: kw.keyword_id, keywordText: kw.keyword_text },
        status: 'pending',
      })
    }

    // CHECK 3: Margin alerts
    for (const product of (products.data || []).filter((p: any) => p.avg_margin_90d < 10)) {
      pendingActions.push({
        user_id: user.id,
        action_type: 'margin_alert',
        title: `Low margin: ${product.sku}`,
        description: `${product.avg_margin_90d?.toFixed(1)}% margin — below 10% minimum`,
        reason: 'Margin below minimum threshold',
        profit_impact: (product.recommended_price - product.current_price) * 30,
        action_data: { sku: product.sku, currentPrice: product.current_price, recommendedPrice: product.recommended_price },
        status: 'pending',
      })
    }

    // Store pending actions
    if (pendingActions.length > 0) {
      // Clear old pending actions first
      await supabase
        .from('agent_pending_actions')
        .update({ status: 'expired' })
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())

      // Insert new ones
      await supabase.from('agent_pending_actions').insert(
        pendingActions.map(a => ({ ...a, created_at: new Date().toISOString() }))
      )
    }

    // Generate agent summary with Claude
    const summary = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Summarise these ${pendingActions.length} agent actions in 2-3 sentences. Be specific about £ impact. Actions: ${JSON.stringify(pendingActions.slice(0, 5))}`
      }]
    })

    const summaryText = summary.content[0].type === 'text' ? summary.content[0].text : ''

    // Log agent run
    await supabase.from('sync_jobs').insert({
      user_id: user.id,
      job_type: 'agent_run',
      status: 'completed',
      rows_processed: pendingActions.length,
      completed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      mode,
      pendingActions: pendingActions.length,
      summary: summaryText,
      actions: pendingActions,
    })
  } catch (error: any) {
    console.error('Agent error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
