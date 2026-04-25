import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireActiveOrg } from '@/app/lib/org/context'

const getAnthropic = () => new Anthropic({ apiKey: process.env.NEXT_ANTHROPIC_API_KEY! })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { channels }: { channels: string[] } = await request.json()
    if (!channels?.length) return NextResponse.json({ error: 'Specify channels to optimise for' }, { status: 400 })

    const { data: listing } = await supabase
      .from('channel_listings').select('*').eq('id', id).single()
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const channelGuidelines: Record<string, string> = {
      shopify: `Shopify storefront — readable, brand-forward title. Focus on clarity and appeal. Max 255 chars. Description should be engaging and conversion-focused with paragraphs.`,
      ebay: `eBay search algorithm (Cassini) — keyword-rich title, max 80 chars. Put brand, key specs (size, model, colour) in the title. No punctuation except hyphens. Description should list key features as bullet points.`,
      amazon: `Amazon A9 algorithm — start with brand, then product name, then key attributes (size, colour, quantity). Max 200 chars. Description should use short punchy bullet points (max 5), each starting with a capital letter, max 500 chars each. Focus on benefits not just features.`,
    }

    const prompt = `You are an expert eCommerce copywriter specialising in multi-channel product listings.

Product details:
- Title: ${listing.title}
- Description: ${listing.description || 'None provided'}
- Brand: ${listing.brand || 'Unknown'}
- Category: ${listing.category || 'General'}
- Condition: ${listing.condition}
- Price: £${listing.price}
- Attributes: ${JSON.stringify(listing.attributes || {})}

Optimise this listing for the following channels. For each channel, return optimised title and description following that channel's specific requirements.

Channels to optimise for:
${channels.map(ch => `- ${ch}: ${channelGuidelines[ch] || 'Standard eCommerce best practices'}`).join('\n')}

Return ONLY valid JSON in this exact format — no markdown, no explanation:
{
  ${channels.map(ch => `"${ch}": { "title": "...", "description": "..." }`).join(',\n  ')}
}`

    const response = await getAnthropic().messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    let optimised: Record<string, { title: string; description: string }>

    try {
      optimised = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON', raw }, { status: 500 })
    }

    return NextResponse.json({ optimised })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
