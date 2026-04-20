/**
 * [prospect-enrich] — qualifies a Sales Nav CSV against the Palvento wedge.
 *
 * Pipeline: for each row in the input CSV, in parallel,
 *   1. Confirm the domain is running Shopify (fingerprint check on homepage,
 *      or BuiltWith API if BUILTWITH_API_KEY is set).
 *   2. Count the brand's existing eBay seller listings via public eBay search.
 *   3. Optional: check if the brand is running Google Shopping ads via SerpAPI.
 *   4. Optional: resolve the founder's email via Hunter.io.
 *   5. Write an enriched row with a `qualification_tier` classification.
 *
 * Wedge qualification:
 *   - tier = 'A-ready'  : Shopify + Google Shopping active + ≤10 eBay listings
 *   - tier = 'B-warm'   : Shopify + ≤10 eBay listings (Google Shopping unknown)
 *   - tier = 'C-skip'   : Shopify but >10 eBay listings (different pitch)
 *   - tier = 'D-wrong'  : Not Shopify → out of ICP
 *
 * Run:
 *   npm run prospect:enrich -- --input=leads.csv --output=enriched.csv
 *
 * Expected input CSV columns (case-insensitive; extras preserved):
 *   domain (required)
 *   company_name, first_name, last_name, title, linkedin_url, headcount, country
 *
 * Env:
 *   BUILTWITH_API_KEY   optional — raises Shopify confirmation accuracy
 *   HUNTER_API_KEY      optional — enables founder email resolution
 *   SERPAPI_KEY         optional — enables Google Shopping ad signal
 *   PROSPECT_CONCURRENCY default 5 — parallel requests
 */
import { readFile, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

const log  = (...a: unknown[]) => console.log('[prospect-enrich]', ...a)
const warn = (...a: unknown[]) => console.warn('[prospect-enrich]', ...a)

// ── Args ────────────────────────────────────────────────────────────────────

interface Args {
  input:  string
  output: string
  concurrency: number
  skipShopping: boolean
  skipEmail:    boolean
}

function parseArgs(argv: string[]): Args {
  const get = (k: string, d?: string) => {
    const a = argv.find(x => x.startsWith(`--${k}=`))
    return a ? a.slice(`--${k}=`.length) : d
  }
  const has = (k: string) => argv.includes(`--${k}`)

  const input  = get('input')
  const output = get('output') ?? input?.replace(/\.csv$/, '.enriched.csv')
  if (!input || !output) {
    console.error('Usage: tsx scripts/prospect-enrichment.ts --input=leads.csv [--output=enriched.csv] [--concurrency=5] [--skip-shopping] [--skip-email]')
    process.exit(1)
  }
  return {
    input,
    output,
    concurrency:  Number(get('concurrency', process.env.PROSPECT_CONCURRENCY ?? '5')),
    skipShopping: has('skip-shopping'),
    skipEmail:    has('skip-email'),
  }
}

// ── CSV ─────────────────────────────────────────────────────────────────────

function parseCSV(raw: string): { header: string[]; rows: Record<string, string>[] } {
  const lines: string[] = []
  let buf = '', inQuote = false
  for (const ch of raw.replace(/\r\n?/g, '\n')) {
    if (ch === '"') inQuote = !inQuote
    if (ch === '\n' && !inQuote) { lines.push(buf); buf = ''; continue }
    buf += ch
  }
  if (buf) lines.push(buf)

  const splitRow = (line: string): string[] => {
    const out: string[] = []
    let cur = '', q = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++ }
        else q = !q
      } else if (c === ',' && !q) {
        out.push(cur); cur = ''
      } else cur += c
    }
    out.push(cur)
    return out
  }

  const [hdr, ...body] = lines.filter(Boolean)
  const header = splitRow(hdr).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const rows = body.map(line => {
    const cells = splitRow(line)
    return Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? '').trim()]))
  })
  return { header, rows }
}

function toCSV(header: string[], rows: Record<string, string>[]): string {
  const esc = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
  const headLine = header.join(',')
  const body = rows.map(r => header.map(h => esc(r[h] ?? '')).join(','))
  return [headLine, ...body].join('\n') + '\n'
}

// ── Enrichment primitives ──────────────────────────────────────────────────

async function fetchText(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; text: string }> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers:  { 'User-Agent': 'Mozilla/5.0 (compatible; Palvento-prospect-enrich/1.0)', ...(init?.headers ?? {}) },
      ...init,
    })
    return { ok: res.ok, status: res.status, text: await res.text() }
  } catch (err) {
    warn(`fetch failed ${url}:`, (err as Error).message)
    return { ok: false, status: 0, text: '' }
  }
}

function normaliseDomain(raw: string | undefined): string {
  if (!raw) return ''
  return raw.trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .toLowerCase()
}

async function isShopify(domain: string): Promise<boolean> {
  if (!domain) return false
  const apiKey = process.env.BUILTWITH_API_KEY
  if (apiKey) {
    const { ok, text } = await fetchText(
      `https://api.builtwith.com/v21/api.json?KEY=${apiKey}&LOOKUP=${encodeURIComponent(domain)}`,
    )
    if (ok) {
      try {
        const j = JSON.parse(text) as { Results?: Array<{ Result?: { Paths?: Array<{ Technologies?: Array<{ Name: string }> }> } }> }
        const techs = j.Results?.[0]?.Result?.Paths?.flatMap(p => p.Technologies ?? []) ?? []
        return techs.some(t => /shopify/i.test(t.Name))
      } catch { /* fall through to fingerprint */ }
    }
  }
  // Fingerprint fallback — fetch homepage and look for Shopify markers.
  const { ok, text } = await fetchText(`https://${domain}`)
  if (!ok) return false
  return /cdn\.shopify\.com/i.test(text)
      || /shopify-section/i.test(text)
      || /shopify-features/i.test(text)
      || /<meta[^>]+shopify-digital-wallet/i.test(text)
}

async function ebaySellerCount(brand: string): Promise<number | null> {
  if (!brand) return null
  // Public eBay search page — robots.txt does not disallow /sch/
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(brand)}&_sacat=0`
  const { ok, text } = await fetchText(url)
  if (!ok) return null
  // Result count lives in a "results" header: e.g., "1,234 results for brand"
  const m = text.match(/([\d,]+)\s+results?\s+for/i)
  if (m) return Number(m[1].replace(/,/g, ''))
  // Fallback — count list items
  const itemMatches = text.match(/class="s-item__pl-on-bottom"/g)
  return itemMatches ? itemMatches.length : 0
}

async function googleShoppingActive(brand: string): Promise<'yes' | 'no' | 'unknown'> {
  const key = process.env.SERPAPI_KEY
  if (!key) return 'unknown'
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(brand)}&api_key=${key}`
  const { ok, text } = await fetchText(url)
  if (!ok) return 'unknown'
  try {
    const j = JSON.parse(text) as { shopping_results?: Array<{ source?: string }> }
    const hits = j.shopping_results ?? []
    const seen = hits.some(h => typeof h.source === 'string' && h.source.toLowerCase().includes(brand.toLowerCase()))
    return seen ? 'yes' : 'no'
  } catch { return 'unknown' }
}

async function findFounderEmail(domain: string, firstName?: string, lastName?: string): Promise<string> {
  const key = process.env.HUNTER_API_KEY
  if (!key || !domain) return ''
  const endpoint = firstName && lastName
    ? `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${key}`
    : `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=1&seniority=executive&api_key=${key}`
  const { ok, text } = await fetchText(endpoint)
  if (!ok) return ''
  try {
    const j = JSON.parse(text) as { data?: { email?: string; emails?: Array<{ value?: string }> } }
    return j.data?.email ?? j.data?.emails?.[0]?.value ?? ''
  } catch { return '' }
}

// ── Tier classifier ────────────────────────────────────────────────────────

function classify(row: {
  shopify_confirmed: string
  ebay_listings:     string
  google_shopping:   string
}): 'A-ready' | 'B-warm' | 'C-skip' | 'D-wrong' {
  if (row.shopify_confirmed !== 'yes')                 return 'D-wrong'
  const ebayN = Number(row.ebay_listings) || 0
  if (ebayN > 10)                                      return 'C-skip'
  if (row.google_shopping === 'yes')                   return 'A-ready'
  return 'B-warm'
}

// ── Row pipeline ───────────────────────────────────────────────────────────

async function enrichRow(
  row: Record<string, string>,
  args: Args,
): Promise<Record<string, string>> {
  const domain = normaliseDomain(row.domain || row.website || row.company_website)
  const brand  = row.company_name || row.brand || domain.split('.')[0]

  const shopify = domain ? await isShopify(domain) : false
  if (!shopify) {
    // Short-circuit: no point enriching non-Shopify rows further.
    return {
      ...row,
      domain_normalised:   domain,
      shopify_confirmed:   'no',
      ebay_listings:       '',
      google_shopping:     '',
      founder_email:       '',
      qualification_tier:  'D-wrong',
    }
  }

  const [ebay, gshop, email] = await Promise.all([
    ebaySellerCount(brand),
    args.skipShopping ? Promise.resolve('unknown' as const) : googleShoppingActive(brand),
    args.skipEmail    ? Promise.resolve('')                 : findFounderEmail(domain, row.first_name, row.last_name),
  ])

  const enriched = {
    ...row,
    domain_normalised:  domain,
    shopify_confirmed:  'yes',
    ebay_listings:      ebay == null ? '' : String(ebay),
    google_shopping:    gshop,
    founder_email:      email,
  }
  return { ...enriched, qualification_tier: classify(enriched) }
}

// ── Concurrency pool ───────────────────────────────────────────────────────

async function runPool<T, R>(
  items:       T[],
  concurrency: number,
  worker:      (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let cursor = 0
  const lanes = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      try { out[i] = await worker(items[i], i) }
      catch (err) { warn(`row ${i} failed:`, (err as Error).message) }
    }
  })
  await Promise.all(lanes)
  return out
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2))
  log(`reading ${args.input}`)
  const raw = await readFile(path.resolve(args.input), 'utf-8')
  const { header, rows } = parseCSV(raw)
  log(`parsed ${rows.length} rows, ${header.length} cols`)
  log(`enrichment keys — builtwith:${!!process.env.BUILTWITH_API_KEY} hunter:${!!process.env.HUNTER_API_KEY} serpapi:${!!process.env.SERPAPI_KEY}`)

  const t0 = Date.now()
  const enriched = await runPool(rows, args.concurrency, async (row, i) => {
    if ((i + 1) % 10 === 0) log(`processed ${i + 1}/${rows.length}`)
    return enrichRow(row, args)
  })
  log(`enriched ${enriched.length} rows in ${((Date.now() - t0) / 1000).toFixed(1)}s`)

  // Stable output header — original cols first, then enrichment cols.
  const addedCols = ['domain_normalised', 'shopify_confirmed', 'ebay_listings', 'google_shopping', 'founder_email', 'qualification_tier']
  const outHeader = [...header.filter(h => !addedCols.includes(h)), ...addedCols]

  const csv = toCSV(outHeader, enriched as Record<string, string>[])
  await writeFile(path.resolve(args.output), csv)
  log(`wrote ${args.output}`)

  // Summary
  const counts: Record<string, number> = {}
  for (const r of enriched as Record<string, string>[]) {
    const k = r.qualification_tier ?? 'unknown'
    counts[k] = (counts[k] ?? 0) + 1
  }
  log('tier counts:', counts)
}

main().catch(err => { console.error('[prospect-enrich] fatal:', err); process.exit(1) })
