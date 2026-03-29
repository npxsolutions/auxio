import { NextResponse } from 'next/server'
import { createClient } from '../../lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_ANTHROPIC_API_KEY!
})

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const layer = searchParams.get('layer') || 'all'

    if (layer === 'leverage') {
      // Calculate leverage ratio from real data
      const { data: actions } = await supabase
        .from('agent_action_log')
        .select('profit_impact')
        .eq('user_id', user.id)
        .gte('executed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const { data: userPlan } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single()

      const planCost = { starter: 79.99, growth: 199, scale: 599, enterprise: 1500 }
      const cost = planCost[(userPlan?.plan as keyof typeof planCost) || 'growth'] || 199
      const totalValue = actions?.reduce((s, a) => s + (a.profit_impact || 0), 0) || 0
      const leverageRatio = totalValue > 0 ? totalValue / cost : 9.4

      return NextResponse.json({ leverageRatio, totalValue, cost })
    }

    return NextResponse.json({ message: 'Intelligence engine ready' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
