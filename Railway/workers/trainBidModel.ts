import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ── FEATURE EXTRACTION ──
// Turn raw keyword data into ML features
function extractFeatures(kw: any): number[] {
  return [
    kw.bid,                    // current bid
    kw.impressions,            // visibility
    kw.clicks,                 // engagement
    kw.conversion_rate,        // purchase intent
    kw.acos,                   // efficiency
    kw.day_of_week,            // timing pattern
    kw.hour_of_day,            // time of day
    kw.month,                  // seasonality
    intentScore(kw.keyword_text), // buyer intent
    kw.match_type === 'EXACT' ? 1 : kw.match_type === 'PHRASE' ? 0.5 : 0, // match type
  ]
}

// ── INTENT SCORER ──
function intentScore(searchTerm: string): number {
  if (!searchTerm) return 50
  let score = 50
  const term = searchTerm.toLowerCase()

  // High intent
  if (term.includes('buy')) score += 20
  if (/\d+ml/.test(term)) score += 20
  if (term.includes('uk')) score += 10
  if (term.includes('gift')) score += 15
  if (term.includes('genuine')) score += 10
  if (term.includes('original')) score += 10

  // Low intent
  if (term.includes('review')) score -= 20
  if (term.includes('dupe')) score -= 25
  if (term.includes('sample')) score -= 20
  if (term.includes('cheap')) score -= 15
  if (term.includes('fake')) score -= 40
  if (term.includes('what is')) score -= 30

  return Math.max(0, Math.min(100, score))
}

// ── SIMPLE LINEAR REGRESSION ──
// No external libraries needed — pure TypeScript
class LinearRegression {
  private weights: number[] = []
  private bias: number = 0

  fit(X: number[][], y: number[], learningRate = 0.01, epochs = 1000) {
    const n = X.length
    const features = X[0].length
    this.weights = new Array(features).fill(0)
    this.bias = 0

    for (let epoch = 0; epoch < epochs; epoch++) {
      let biasGrad = 0
      const weightGrads = new Array(features).fill(0)

      for (let i = 0; i < n; i++) {
        const pred = this.predict_single(X[i])
        const error = pred - y[i]

        biasGrad += error
        for (let j = 0; j < features; j++) {
          weightGrads[j] += error * X[i][j]
        }
      }

      this.bias -= (learningRate * biasGrad) / n
      for (let j = 0; j < features; j++) {
        this.weights[j] -= (learningRate * weightGrads[j]) / n
      }
    }
  }

  predict_single(features: number[]): number {
    let result = this.bias
    for (let i = 0; i < features.length; i++) {
      result += this.weights[i] * features[i]
    }
    return result
  }

  predict(X: number[][]): number[] {
    return X.map(x => this.predict_single(x))
  }

  // Score model accuracy (R²)
  score(X: number[][], y: number[]): number {
    const predictions = this.predict(X)
    const yMean = y.reduce((a, b) => a + b, 0) / y.length
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0)
    return 1 - ssRes / ssTot
  }
}

// ── NORMALISE FEATURES ──
// ML works better with normalised data
function normalise(X: number[][]): { normalised: number[][], means: number[], stds: number[] } {
  const features = X[0].length
  const means = new Array(features).fill(0)
  const stds = new Array(features).fill(1)

  // Calculate means
  for (let j = 0; j < features; j++) {
    means[j] = X.reduce((sum, row) => sum + row[j], 0) / X.length
  }

  // Calculate std deviations
  for (let j = 0; j < features; j++) {
    const variance = X.reduce((sum, row) => sum + Math.pow(row[j] - means[j], 2), 0) / X.length
    stds[j] = Math.sqrt(variance) || 1
  }

  // Normalise
  const normalised = X.map(row =>
    row.map((val, j) => (val - means[j]) / stds[j])
  )

  return { normalised, means, stds }
}

// ── TRAIN MODEL PER USER ──
async function trainModelForUser(userId: string) {
  // Get last 90 days of performance data
  const { data: performanceData } = await getSupabase()
    .from('ppc_keyword_performance')
    .select('*')
    .eq('user_id', userId)
    .gte('recorded_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order('recorded_at', { ascending: true })

  if (!performanceData || performanceData.length < 50) {
    console.log(`Not enough data for user ${userId} — need 50+ records, have ${performanceData?.length || 0}`)
    return null
  }

  // Get outcomes (did actions improve ACOS?)
  const { data: outcomes } = await getSupabase()
    .from('ppc_outcomes')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: true })

  // Build training data
  // X = features, y = conversion rate (what we want to predict)
  const X: number[][] = []
  const y: number[] = []

  for (const kw of performanceData) {
    if (kw.clicks >= 5) { // Only use data with enough clicks
      X.push(extractFeatures(kw))
      y.push(kw.conversion_rate)
    }
  }

  if (X.length < 20) {
    console.log(`Not enough quality data for user ${userId}`)
    return null
  }

  // Normalise features
  const { normalised, means, stds } = normalise(X)

  // Train model
  const model = new LinearRegression()
  model.fit(normalised, y, 0.01, 2000)

  // Score accuracy
  const r2 = model.score(normalised, y)
  console.log(`Model trained for user ${userId} — R² score: ${r2.toFixed(3)} — ${X.length} samples`)

  // Save model to Supabase
  await getSupabase()
    .from('ppc_models')
    .upsert({
      user_id: userId,
      weights: model['weights'],
      bias: model['bias'],
      means,
      stds,
      r2_score: r2,
      training_samples: X.length,
      trained_at: new Date().toISOString(),
      model_version: 1,
    }, { onConflict: 'user_id' })

  return { model, means, stds, r2 }
}

// ── PREDICT OPTIMAL BID ──
export async function predictOptimalBid(
  userId: string,
  keyword: {
    keywordText: string
    matchType: string
    aov: number // average order value
    breakEvenAcos: number
    currentBid: number
  }
): Promise<{ optimalBid: number; predictedAcos: number; confidence: string }> {

  // Load saved model
  const { data: modelData } = await getSupabase()
    .from('ppc_models')
    .select('*')
    .eq('user_id', userId)
    .single()

  // If no model yet — use rules based approach
  if (!modelData || modelData.r2_score < 0.3) {
    return rulesBasedBid(keyword)
  }

  const model = new LinearRegression()
  model['weights'] = modelData.weights
  model['bias'] = modelData.bias

  // Try different bid levels and find optimal
  let bestBid = keyword.currentBid
  let bestProfit = -999

  for (let testBid = 0.10; testBid <= 3.00; testBid += 0.05) {
    // Build features for this bid level
    const features = [
      testBid,
      500, // estimated impressions
      20, // estimated clicks
      0, // conversion rate (we're predicting this)
      0, // acos (predicting)
      new Date().getDay(),
      new Date().getHours(),
      new Date().getMonth() + 1,
      intentScore(keyword.keywordText),
      keyword.matchType === 'EXACT' ? 1 : keyword.matchType === 'PHRASE' ? 0.5 : 0,
    ]

    // Normalise using saved means/stds
    const normFeatures = features.map((val, j) =>
      (val - modelData.means[j]) / modelData.stds[j]
    )

    // Predict conversion rate at this bid
    const predictedCR = model.predict_single(normFeatures) / 100
    if (predictedCR <= 0) continue

    // Calculate predicted ACOS
    const predictedAcos = (testBid / (keyword.aov * predictedCR)) * 100

    // Calculate predicted profit
    if (predictedAcos <= keyword.breakEvenAcos) {
      const profit = (keyword.aov * predictedCR) - testBid
      if (profit > bestProfit) {
        bestProfit = profit
        bestBid = testBid
      }
    }
  }

  const predictedAcos = (bestBid / (keyword.aov * 0.1)) * 100

  return {
    optimalBid: Math.round(bestBid * 100) / 100,
    predictedAcos: Math.round(predictedAcos * 10) / 10,
    confidence: modelData.r2_score > 0.7 ? 'High' : modelData.r2_score > 0.5 ? 'Medium' : 'Low'
  }
}

// ── RULES BASED FALLBACK ──
// Used when not enough data to train ML yet
function rulesBasedBid(keyword: {
  aov: number
  breakEvenAcos: number
  currentBid: number
}): { optimalBid: number; predictedAcos: number; confidence: string } {
  // Target 80% of break-even ACOS to have safety margin
  const targetAcos = keyword.breakEvenAcos * 0.8
  const estimatedCR = 0.08 // 8% default conversion rate
  const optimalBid = keyword.aov * estimatedCR * (targetAcos / 100)

  return {
    optimalBid: Math.round(Math.min(optimalBid, keyword.currentBid * 1.5) * 100) / 100,
    predictedAcos: targetAcos,
    confidence: 'Low — collecting data'
  }
}

// ── WEEKLY TRAINING JOB ──
// Runs every Sunday midnight via Railway cron
export async function weeklyModelTraining() {
  console.log('Starting weekly PPC model training...')

  const { data: users } = await getSupabase()
    .from('channels')
    .select('user_id')
    .eq('type', 'amazon')
    .eq('active', true)

  if (!users) return

  let trained = 0
  let skipped = 0

  for (const user of users) {
    const result = await trainModelForUser(user.user_id)
    if (result) trained++
    else skipped++
  }

  console.log(`Training complete — ${trained} models trained, ${skipped} skipped (insufficient data)`)
}
