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

    const { question, conversationHistory = [] } = await request.json()
    if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

    // Pull store context
    const [orders, products, insights, ppc] = await Promise.all([
      supabase.from('transactions').select('sku,title,true_profit,true_margin,sale_price,order_date,channel').eq('user_id', user.id).order('order_date', { ascending: false }).limit(50),
      supabase.from('product_intelligence').select('*').eq('user_id', user.id).limit(20),
      supabase.from('ai_insights').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('ppc_keyword_performance').select('keyword_text,acos,spend,orders,clicks').eq('user_id', user.id).order('spend', { ascending: false }).limit(20),
    ])

    const context = {
      recentOrders: orders.data?.slice(0, 20),
      topProducts: products.data?.slice(0, 10),
      activeInsights: insights.data,
      topKeywords: ppc.data?.slice(0, 10),
    }

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are the AI brain of Palvento — an eCommerce transaction intelligence platform.
You have full access to this seller's store data. Answer questions using their ACTUAL data.
Be specific — reference real product names, real numbers, real percentages.
Never give generic advice. Always end with one specific recommended action.
Keep answers under 150 words. Be direct and decisive.`,
      messages: [
        ...conversationHistory.slice(-4),
        {
          role: 'user',
          content: `Question: "${question}"\n\nStore data:\n${JSON.stringify(context, null, 2)}`
        }
      ]
    })

    const answer = response.content[0].type === 'text' ? response.content[0].text : ''

    // Store conversation
    await supabase.from('ai_conversations').insert({
      user_id: user.id,
      question,
      answer,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ answer })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
