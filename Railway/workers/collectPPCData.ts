import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ── STEP 1: Collect raw PPC data from Amazon Ads API ──
async function fetchAmazonPPCData(userId: string, accessToken: string) {
  const response = await fetch(
    'https://advertising-api-eu.amazon.com/sp/keywords',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Amazon-Advertising-API-ClientId': process.env.AMAZON_ADS_CLIENT_ID!,
        'Amazon-Advertising-API-Scope': process.env.AMAZON_ADS_PROFILE_ID!,
      }
    }
  )
  return response.json()
}

// ── STEP 2: Store raw performance data ──
async function storePPCPerformance(userId: string, keywords: any[]) {
  const rows = keywords.map(kw => ({
    user_id: userId,
    keyword_id: kw.keywordId,
    keyword_text: kw.keywordText,
    match_type: kw.matchType,
    campaign_id: kw.campaignId,
    ad_group_id: kw.adGroupId,
    bid: kw.bid,
    impressions: kw.impressions || 0,
    clicks: kw.clicks || 0,
    spend: kw.spend || 0,
    sales: kw.sales7d || 0,
    orders: kw.orders7d || 0,
    acos: kw.acos7d || 0,
    conversion_rate: kw.clicks > 0 ? (kw.orders7d / kw.clicks) * 100 : 0,
    recorded_at: new Date().toISOString(),
    day_of_week: new Date().getDay(),
    hour_of_day: new Date().getHours(),
    month: new Date().getMonth() + 1,
  }))

  const { error } = await supabase
    .from('ppc_keyword_performance')
    .upsert(rows, { onConflict: 'user_id,keyword_id,recorded_at' })

  if (error) console.error('Store error:', error)
  else console.log(`Stored ${rows.length} keyword performance records`)
}

// ── STEP 3: Record outcomes (did bid change improve things?) ──
async function recordOutcome(userId: string, keywordId: string, newAcos: number) {
  // Find the last bid change for this keyword
  const { data: lastAction } = await supabase
    .from('ppc_actions')
    .select('*')
    .eq('user_id', userId)
    .eq('keyword_id', keywordId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!lastAction) return

  // Record whether the action improved ACOS
  const improved = newAcos < lastAction.acos_before
  const delta = lastAction.acos_before - newAcos

  await supabase
    .from('ppc_outcomes')
    .insert({
      user_id: userId,
      keyword_id: keywordId,
      action_id: lastAction.id,
      acos_before: lastAction.acos_before,
      acos_after: newAcos,
      improved,
      delta,
      days_to_measure: 7,
      recorded_at: new Date().toISOString(),
    })

  console.log(`Outcome recorded: ACOS ${improved ? 'improved' : 'worsened'} by ${Math.abs(delta).toFixed(1)}%`)
}

// ── MAIN: Run daily at 6am via Railway cron ──
export async function collectDailyPPCData() {
  const { data: users } = await supabase
    .from('channels')
    .select('user_id, access_token')
    .eq('type', 'amazon')
    .eq('active', true)

  if (!users) return

  for (const user of users) {
    try {
      const keywords = await fetchAmazonPPCData(user.user_id, user.access_token)
      await storePPCPerformance(user.user_id, keywords)

      // Record outcomes for any actions taken 7 days ago
      for (const kw of keywords) {
        await recordOutcome(user.user_id, kw.keywordId, kw.acos7d)
      }

      console.log(`Collected PPC data for user ${user.user_id}`)
    } catch (e) {
      console.error(`Failed for user ${user.user_id}:`, e)
    }
  }
}
