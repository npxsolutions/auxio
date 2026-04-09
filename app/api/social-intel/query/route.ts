import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { generateRecommendations } from '../../../lib/nlp'

// GET /api/social-intel/query?keyword=ecom+ads&view=overview|hooks|content|audience|recommendations

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword')
  const view    = searchParams.get('view') || 'overview'

  if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  // ── Overview ───────────────────────────────────────────────────────────────
  if (view === 'overview') {
    const [postsRes, adsRes, jobRes] = await Promise.all([
      supabase.from('si_posts').select('id, platform', { count: 'exact' }).eq('user_id', user.id).eq('keyword', keyword),
      supabase.from('si_ads').select('id', { count: 'exact' }).eq('user_id', user.id).eq('keyword', keyword),
      supabase.from('si_jobs').select('*').eq('user_id', user.id).eq('keyword', keyword).order('started_at', { ascending: false }).limit(1).single(),
    ])

    // Platform breakdown
    const platformCounts: Record<string, number> = {}
    for (const p of postsRes.data || []) {
      platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1
    }

    // Avg engagement across all posts for this keyword
    const { data: engData } = await supabase
      .from('si_engagements')
      .select('engagement_rate, share_rate, save_rate')
      .eq('user_id', user.id)
      .in('post_id', (postsRes.data || []).map((p: any) => p.id))

    const avgEng = engData?.length
      ? engData.reduce((s, e) => s + (e.engagement_rate || 0), 0) / engData.length
      : 0

    return NextResponse.json({
      keyword,
      total_posts: postsRes.count || 0,
      total_ads:   adsRes.count || 0,
      platform_breakdown: platformCounts,
      avg_engagement_rate: avgEng,
      latest_job: jobRes.data || null,
    })
  }

  // ── Hook Analysis ──────────────────────────────────────────────────────────
  if (view === 'hooks') {
    const { data: patterns } = await supabase
      .from('si_hook_patterns')
      .select('*')
      .eq('user_id', user.id)
      .eq('keyword', keyword)
      .order('avg_engagement', { ascending: false })

    // Top performing posts by hook
    const { data: topPosts } = await supabase
      .from('si_posts')
      .select('id, hook, hook_category, caption, url, platform')
      .eq('user_id', user.id)
      .eq('keyword', keyword)
      .not('hook', 'is', null)
      .limit(50)

    const postIds = (topPosts || []).map((p: any) => p.id)
    const { data: engagements } = await supabase
      .from('si_engagements')
      .select('post_id, engagement_rate, share_rate, save_rate, views')
      .in('post_id', postIds)
      .eq('user_id', user.id)

    const engMap = new Map((engagements || []).map((e: any) => [e.post_id, e]))

    const topPostsWithEng = (topPosts || [])
      .map((p: any) => ({ ...p, ...engMap.get(p.id) }))
      .sort((a: any, b: any) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
      .slice(0, 10)

    return NextResponse.json({ keyword, patterns: patterns || [], top_posts: topPostsWithEng })
  }

  // ── Content Performance ────────────────────────────────────────────────────
  if (view === 'content') {
    const { data: posts } = await supabase
      .from('si_posts')
      .select('id, content_type, format, duration_sec, platform, posted_at')
      .eq('user_id', user.id)
      .eq('keyword', keyword)
      .not('content_type', 'is', null)

    const postIds = (posts || []).map((p: any) => p.id)
    const { data: engagements } = await supabase
      .from('si_engagements')
      .select('post_id, engagement_rate, share_rate, save_rate, views')
      .in('post_id', postIds)
      .eq('user_id', user.id)

    const engMap = new Map((engagements || []).map((e: any) => [e.post_id, e]))

    // Group by format
    const formatStats: Record<string, { engagement: number[]; share: number[]; save: number[]; count: number }> = {}
    const typeStats:   Record<string, { engagement: number[]; count: number }> = {}
    const durationBuckets: Record<string, { engagement: number[]; count: number }> = {
      '0-15s': { engagement: [], count: 0 },
      '15-30s': { engagement: [], count: 0 },
      '30-60s': { engagement: [], count: 0 },
      '60-90s': { engagement: [], count: 0 },
      '90s+':  { engagement: [], count: 0 },
    }

    for (const post of posts || []) {
      const eng = engMap.get(post.id)
      if (!eng) continue

      const fmt = post.format || 'unknown'
      if (!formatStats[fmt]) formatStats[fmt] = { engagement: [], share: [], save: [], count: 0 }
      formatStats[fmt].engagement.push(eng.engagement_rate || 0)
      formatStats[fmt].share.push(eng.share_rate || 0)
      formatStats[fmt].save.push(eng.save_rate || 0)
      formatStats[fmt].count++

      const type = post.content_type || 'unknown'
      if (!typeStats[type]) typeStats[type] = { engagement: [], count: 0 }
      typeStats[type].engagement.push(eng.engagement_rate || 0)
      typeStats[type].count++

      const dur = post.duration_sec || 0
      const bucket = dur <= 15 ? '0-15s' : dur <= 30 ? '15-30s' : dur <= 60 ? '30-60s' : dur <= 90 ? '60-90s' : '90s+'
      durationBuckets[bucket].engagement.push(eng.engagement_rate || 0)
      durationBuckets[bucket].count++
    }

    const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0

    return NextResponse.json({
      keyword,
      format_performance: Object.entries(formatStats)
        .map(([format, s]) => ({ format, avg_engagement: avg(s.engagement), avg_share_rate: avg(s.share), avg_save_rate: avg(s.save), count: s.count }))
        .sort((a, b) => b.avg_engagement - a.avg_engagement),
      type_performance: Object.entries(typeStats)
        .map(([type, s]) => ({ type, avg_engagement: avg(s.engagement), count: s.count }))
        .sort((a, b) => b.avg_engagement - a.avg_engagement),
      duration_performance: Object.entries(durationBuckets)
        .map(([range, s]) => ({ range, avg_engagement: avg(s.engagement), count: s.count }))
        .filter(b => b.count > 0),
    })
  }

  // ── Audience Insights ──────────────────────────────────────────────────────
  if (view === 'audience') {
    const [insightsRes, commentsRes] = await Promise.all([
      supabase.from('si_insights').select('*').eq('user_id', user.id).eq('keyword', keyword).order('evidence_count', { ascending: false }),
      supabase.from('si_comments').select('intent, sentiment').eq('user_id', user.id).limit(500),
    ])

    // Intent distribution
    const intentCounts: Record<string, number> = {}
    const sentimentCounts: Record<string, number> = {}
    for (const c of commentsRes.data || []) {
      intentCounts[c.intent || 'neutral']     = (intentCounts[c.intent || 'neutral']     || 0) + 1
      sentimentCounts[c.sentiment || 'neutral'] = (sentimentCounts[c.sentiment || 'neutral'] || 0) + 1
    }

    return NextResponse.json({
      keyword,
      insights:         insightsRes.data || [],
      intent_breakdown: intentCounts,
      sentiment_breakdown: sentimentCounts,
    })
  }

  // ── Recommendations ────────────────────────────────────────────────────────
  if (view === 'recommendations') {
    // Fetch top hooks
    const { data: hookPatterns } = await supabase
      .from('si_hook_patterns')
      .select('hook_category, example_hook, avg_engagement')
      .eq('user_id', user.id)
      .eq('keyword', keyword)
      .order('avg_engagement', { ascending: false })
      .limit(5)

    // Fetch top formats
    const { data: posts } = await supabase
      .from('si_posts')
      .select('id, format, content_type')
      .eq('user_id', user.id)
      .eq('keyword', keyword)
      .not('format', 'is', null)

    const postIds = (posts || []).map((p: any) => p.id)
    const { data: engs } = await supabase
      .from('si_engagements')
      .select('post_id, engagement_rate')
      .in('post_id', postIds)
      .eq('user_id', user.id)

    const engMap = new Map((engs || []).map((e: any) => [e.post_id, e.engagement_rate || 0]))
    const fmtMap: Record<string, number[]> = {}
    for (const p of posts || []) {
      const fmt = p.format || 'unknown'
      if (!fmtMap[fmt]) fmtMap[fmt] = []
      fmtMap[fmt].push(engMap.get(p.id) || 0)
    }

    const topFormats = Object.entries(fmtMap).map(([format, vals]) => ({
      format,
      avg_engagement: vals.reduce((s, v) => s + v, 0) / vals.length,
      count: vals.length,
    })).sort((a, b) => b.avg_engagement - a.avg_engagement).slice(0, 5)

    // Fetch audience insights
    const { data: insights } = await supabase
      .from('si_insights')
      .select('insight_type, insight_text')
      .eq('user_id', user.id)
      .eq('keyword', keyword)

    const audienceWants     = (insights || []).filter((i: any) => i.insight_type === 'desire').map((i: any) => i.insight_text)
    const audienceStruggles = (insights || []).filter((i: any) => i.insight_type === 'pain_point').map((i: any) => i.insight_text)

    // Generate recommendations with Claude
    const recommendations = await generateRecommendations({
      keyword,
      topHooks: (hookPatterns || []).map((h: any) => ({
        category:       h.hook_category,
        example:        h.example_hook || '',
        avg_engagement: h.avg_engagement || 0,
      })),
      topFormats,
      audienceWants:     audienceWants.slice(0, 5),
      audienceStruggles: audienceStruggles.slice(0, 5),
    })

    return NextResponse.json({ keyword, recommendations })
  }

  return NextResponse.json({ error: 'Invalid view' }, { status: 400 })
}
