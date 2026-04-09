// ── NLP Processing with Claude ───────────────────────────────────────────────
// Uses structured JSON output to extract content features and audience signals.

import Anthropic from '@anthropic-ai/sdk'

const getClient = () => new Anthropic({ apiKey: process.env.NEXT_ANTHROPIC_API_KEY! })

// ── Types ─────────────────────────────────────────────────────────────────────

export type HookCategory   = 'curiosity' | 'problem' | 'benefit' | 'shock' | 'story' | 'social_proof' | 'other'
export type ContentType    = 'ugc' | 'product_demo' | 'talking_head' | 'tutorial' | 'list' | 'transformation' | 'testimonial' | 'other'
export type ContentFormat  = 'short_form_video' | 'long_form_video' | 'image' | 'carousel' | 'text'
export type Sentiment      = 'positive' | 'negative' | 'neutral'
export type Intent         = 'buying_intent' | 'objection' | 'question' | 'praise' | 'complaint' | 'neutral'

export interface PostFeatures {
  hook:          string
  hook_category: HookCategory
  content_type:  ContentType
  format:        ContentFormat
  topics:        string[]
}

export interface CommentAnalysis {
  sentiment:  Sentiment
  intent:     Intent
  desire:     string      // extracted desire or pain point (short phrase)
}

export interface AudienceInsight {
  type:    'desire' | 'pain_point' | 'question' | 'objection' | 'trend'
  insight: string          // "Audience wants X" or "Audience struggles with Y"
  evidence: string         // example comment
  count:   number
}

// ── Extract features from a batch of posts ───────────────────────────────────

export async function extractPostFeatures(
  posts: Array<{ id: string; caption: string; duration_sec?: number | null }>
): Promise<Map<string, PostFeatures>> {
  if (!posts.length) return new Map()

  const prompt = `You are a content strategist analyzing social media posts.

For each post, extract:
1. hook: the opening sentence or key opening phrase (first 30 words max)
2. hook_category: one of curiosity|problem|benefit|shock|story|social_proof|other
   - curiosity: "Nobody talks about...", "Wait until you see...", "You won't believe..."
   - problem: "Struggling with X?", "The real reason you're failing at...", "Stop wasting money on..."
   - benefit: "How I made £X", "Get X result in Y time", "The secret to..."
   - shock: "I was wrong about...", "Controversial opinion:", "This changed everything..."
   - story: "I almost quit...", "Story time:", "POV: you just..."
   - social_proof: "1M people swear by this", "My client went from X to Y", "As seen on..."
3. content_type: ugc|product_demo|talking_head|tutorial|list|transformation|testimonial|other
4. format: short_form_video|long_form_video|image|carousel|text
   (short_form_video if duration ≤ 90s, long_form_video if > 90s, text if no duration and short caption)
5. topics: array of 2-4 key topic words

Return ONLY valid JSON array: [{"id":"...","hook":"...","hook_category":"...","content_type":"...","format":"...","topics":[...]}]

Posts to analyse:
${posts.slice(0, 20).map(p => `ID: ${p.id}\nDuration: ${p.duration_sec ?? 'unknown'}s\nCaption: ${(p.caption || '').slice(0, 300)}`).join('\n---\n')}`

  const client = getClient()
  const msg = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages:   [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return new Map()

  const results: Array<{ id: string } & PostFeatures> = JSON.parse(jsonMatch[0])
  return new Map(results.map(r => [r.id, {
    hook:          r.hook,
    hook_category: r.hook_category,
    content_type:  r.content_type,
    format:        r.format,
    topics:        r.topics,
  }]))
}

// ── Analyse a batch of comments ───────────────────────────────────────────────

export async function analyseComments(
  comments: Array<{ id: string | number; text: string }>
): Promise<Map<string | number, CommentAnalysis>> {
  if (!comments.length) return new Map()

  const prompt = `You are analyzing social media comments to extract audience signals.

For each comment, return:
1. sentiment: positive|negative|neutral
2. intent: buying_intent|objection|question|praise|complaint|neutral
   - buying_intent: "Where can I buy", "How much", "I need this", "Taking my money"
   - objection: "But what about", "Doesn't work for", "Too expensive", "What's the catch"
   - question: genuine questions about the product/topic
   - praise: positive reactions, compliments
   - complaint: negative experience, frustration
3. desire: a short phrase (max 10 words) capturing what this person wants or struggles with
   Examples: "wants affordable alternative", "frustrated by slow results", "needs beginner-friendly option"

Return ONLY valid JSON: [{"id":"...","sentiment":"...","intent":"...","desire":"..."}]

Comments:
${comments.slice(0, 30).map(c => `ID: ${c.id}\n${c.text.slice(0, 200)}`).join('\n---\n')}`

  const client = getClient()
  const msg = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages:   [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return new Map()

  const results: Array<{ id: string } & CommentAnalysis> = JSON.parse(jsonMatch[0])
  return new Map(results.map(r => [r.id, {
    sentiment: r.sentiment,
    intent:    r.intent,
    desire:    r.desire,
  }]))
}

// ── Generate audience insights from aggregated comment data ───────────────────

export async function generateAudienceInsights(
  keyword: string,
  commentData: {
    desires:   string[]
    objections: string[]
    questions: string[]
    topComments: string[]
  }
): Promise<AudienceInsight[]> {
  const prompt = `You are a market research analyst turning raw social media comment data into structured audience insights about "${keyword}".

Raw signals:
DESIRES (what people want): ${commentData.desires.slice(0, 20).join(' | ')}
OBJECTIONS: ${commentData.objections.slice(0, 15).join(' | ')}
QUESTIONS: ${commentData.questions.slice(0, 15).join(' | ')}
SAMPLE COMMENTS: ${commentData.topComments.slice(0, 10).map(c => `"${c}"`).join(', ')}

Generate 6-10 distinct, actionable audience insights. Each should be:
- Specific (not generic)
- Backed by the data above
- Formatted as: "Audience [verb] [specific thing]"

Return ONLY valid JSON:
[
  {
    "type": "desire|pain_point|question|objection|trend",
    "insight": "Audience wants X" or "Audience struggles with Y" (max 15 words),
    "evidence": "exact short quote from comments",
    "count": estimated_number_of_signals_1_to_50
  }
]`

  const client = getClient()
  const msg = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1500,
    messages:   [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  return JSON.parse(jsonMatch[0]) as AudienceInsight[]
}

// ── Generate content recommendations ─────────────────────────────────────────

export async function generateRecommendations(opts: {
  keyword:       string
  topHooks:      Array<{ category: string; example: string; avg_engagement: number }>
  topFormats:    Array<{ format: string; avg_engagement: number; count: number }>
  audienceWants: string[]
  audienceStruggles: string[]
}): Promise<Array<{ type: string; recommendation: string; rationale: string; example?: string }>> {
  const prompt = `You are a content strategist. Based on real data analysis of "${opts.keyword}" content, generate specific, actionable content recommendations.

TOP PERFORMING HOOKS:
${opts.topHooks.map(h => `${h.category}: "${h.example}" (${h.avg_engagement.toFixed(1)}% engagement)`).join('\n')}

TOP CONTENT FORMATS:
${opts.topFormats.map(f => `${f.format}: ${f.avg_engagement.toFixed(1)}% avg engagement (${f.count} posts)`).join('\n')}

AUDIENCE WANTS: ${opts.audienceWants.join(', ')}
AUDIENCE STRUGGLES WITH: ${opts.audienceStruggles.join(', ')}

Generate 5-8 specific, data-backed recommendations. Each must directly reference the data above.

Return ONLY valid JSON:
[
  {
    "type": "hook|format|topic|cta|angle",
    "recommendation": "specific action to take (max 20 words)",
    "rationale": "why this works, referencing the data (max 30 words)",
    "example": "optional example hook or script line"
  }
]`

  const client = getClient()
  const msg = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1500,
    messages:   [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  return JSON.parse(jsonMatch[0])
}
