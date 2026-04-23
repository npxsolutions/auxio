/**
 * Social intel processing pipeline.
 *
 * Called by ingest route internally via service-role (no session). All tables
 * are org-scoped (Stage A) but service role bypasses RLS, so explicit
 * organization_id filters are mandatory on every query.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { extractPostFeatures, analyseComments, generateAudienceInsights, generateRecommendations } from '../../../lib/nlp'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_SERVICE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })

  const { jobId, userId, orgId, keyword } = await request.json()
  if (!jobId || !userId || !orgId || !keyword) {
    return NextResponse.json({ error: 'jobId, userId, orgId, keyword required' }, { status: 400 })
  }

  try {
    // ── 1. Feature extraction for unprocessed posts ──────────────────────────
    const { data: rawPosts } = await supabase
      .from('si_posts')
      .select('id, caption, duration_sec')
      .eq('organization_id', orgId)
      .eq('keyword', keyword)
      .eq('processed', false)
      .limit(100)

    if (rawPosts && rawPosts.length > 0) {
      for (let i = 0; i < rawPosts.length; i += 20) {
        const batch = rawPosts.slice(i, i + 20)
        const features = await extractPostFeatures(batch)

        for (const [postId, feat] of features) {
          await supabase.from('si_posts').update({
            hook:          feat.hook,
            hook_category: feat.hook_category,
            content_type:  feat.content_type,
            format:        feat.format,
            processed:     true,
          }).eq('id', postId).eq('organization_id', orgId)
        }
      }
    }

    // ── 2. Comment analysis ───────────────────────────────────────────────────
    const { data: rawComments } = await supabase
      .from('si_comments')
      .select('id, comment_text')
      .eq('organization_id', orgId)
      .eq('processed', false)
      .limit(200)

    const desires:    string[] = []
    const objections: string[] = []
    const questions:  string[] = []
    const topComments: string[] = []

    if (rawComments && rawComments.length > 0) {
      for (let i = 0; i < rawComments.length; i += 30) {
        const batch = rawComments.slice(i, i + 30)
        const analyses = await analyseComments(batch.map(c => ({ id: c.id, text: c.comment_text })))

        for (const [commentId, analysis] of analyses) {
          await supabase.from('si_comments').update({
            sentiment: analysis.sentiment,
            intent:    analysis.intent,
            desire:    analysis.desire,
            processed: true,
          }).eq('id', commentId).eq('organization_id', orgId)

          if (analysis.intent === 'buying_intent' || analysis.intent === 'praise') desires.push(analysis.desire)
          if (analysis.intent === 'objection')  objections.push(analysis.desire)
          if (analysis.intent === 'question')   questions.push(analysis.desire)
          const comment = rawComments.find(c => String(c.id) === String(commentId))
          if (comment) topComments.push(comment.comment_text.slice(0, 200))
        }
      }
    }

    // ── 3. Aggregate hook patterns ────────────────────────────────────────────
    const { data: processedPosts } = await supabase
      .from('si_posts')
      .select('id, hook, hook_category')
      .eq('organization_id', orgId)
      .eq('keyword', keyword)
      .not('hook_category', 'is', null)

    if (processedPosts && processedPosts.length > 0) {
      const postIds = processedPosts.map((p: any) => p.id)
      const { data: engagements } = await supabase
        .from('si_engagements')
        .select('post_id, engagement_rate, share_rate, save_rate')
        .in('post_id', postIds)
        .eq('organization_id', orgId)

      const engMap = new Map((engagements || []).map((e: any) => [e.post_id, e]))

      const categoryMap: Record<string, {
        engagements: number[]; shares: number[]; saves: number[]
        examples: string[]; postIds: string[]
      }> = {}

      for (const post of processedPosts) {
        const cat = post.hook_category || 'other'
        if (!categoryMap[cat]) categoryMap[cat] = { engagements: [], shares: [], saves: [], examples: [], postIds: [] }
        const eng = engMap.get(post.id)
        if (eng) {
          categoryMap[cat].engagements.push(eng.engagement_rate || 0)
          categoryMap[cat].shares.push(eng.share_rate || 0)
          categoryMap[cat].saves.push(eng.save_rate || 0)
        }
        if (post.hook) categoryMap[cat].examples.push(post.hook)
        categoryMap[cat].postIds.push(post.id)
      }

      for (const [cat, data] of Object.entries(categoryMap)) {
        const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
        await supabase.from('si_hook_patterns').upsert({
          organization_id: orgId,
          user_id:         userId,
          keyword,
          hook_category:   cat,
          post_count:      data.postIds.length,
          avg_engagement:  avg(data.engagements),
          avg_share_rate:  avg(data.shares),
          avg_save_rate:   avg(data.saves),
          example_hook:    data.examples[0] || null,
          top_post_id:     data.postIds[0] || null,
          computed_at:     new Date().toISOString(),
        }, { onConflict: 'user_id,keyword,hook_category' })
      }
    }

    // ── 4. Generate audience insights (if we have comment signal) ─────────────
    if (desires.length + objections.length + questions.length >= 5) {
      const insights = await generateAudienceInsights(keyword, {
        desires, objections, questions, topComments,
      })

      await supabase.from('si_insights').delete().eq('organization_id', orgId).eq('keyword', keyword)

      if (insights.length > 0) {
        await supabase.from('si_insights').insert(
          insights.map(ins => ({
            organization_id: orgId,
            user_id:         userId,
            keyword,
            insight_type:    ins.type,
            insight_text:    ins.insight,
            evidence_count:  ins.count,
            example_comment: ins.evidence,
            computed_at:     new Date().toISOString(),
          }))
        )
      }
    }

    // ── 5. Mark job complete ──────────────────────────────────────────────────
    await supabase.from('si_jobs').update({
      status:       'done',
      completed_at: new Date().toISOString(),
    }).eq('id', jobId)

    return NextResponse.json({ ok: true, keyword })
  } catch (err: any) {
    console.error('[social-intel/process]', err)
    await supabase.from('si_jobs').update({ status: 'error', error: err.message }).eq('id', jobId)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
