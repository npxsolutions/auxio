/**
 * [capture] — Playwright screenshot + video capture pipeline for Palvento.
 *
 * Run with:  npm run capture
 *
 * Env:
 *   CAPTURE_BASE_URL        (default: https://palvento-lkqv.vercel.app)
 *   DEMO_USER_EMAIL         (default: info@npxwholesale.co.uk)
 *   DEMO_USER_PASSWORD      (required for auth-gated captures; if absent, only public pages)
 *   NEXT_PUBLIC_SUPABASE_URL        (default: https://oiywxhmhabqjvswdwrzc.supabase.co)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY   (default: reads from .env.local if present)
 *   CAPTURE_SKIP_VIDEOS=1   to skip video recording (screenshots only)
 */
import { chromium, type BrowserContext, type Page } from '@playwright/test'
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const log = (...args: unknown[]) => console.log('[capture]', ...args)
const warn = (...args: unknown[]) => console.warn('[capture]', ...args)

const BASE_URL = (process.env.CAPTURE_BASE_URL || 'https://palvento-lkqv.vercel.app').replace(/\/$/, '')
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oiywxhmhabqjvswdwrzc.supabase.co'
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || 'info@npxwholesale.co.uk'
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || ''
const SKIP_VIDEOS = process.env.CAPTURE_SKIP_VIDEOS === '1'

const REPO_ROOT = path.resolve(__dirname, '..')
const SCREENSHOTS_ROOT = path.join(REPO_ROOT, 'marketing', 'screenshots')
const VIDEOS_ROOT = path.join(REPO_ROOT, 'marketing', 'videos')

// -------- types --------------------------------------------------------------
interface ShotTarget {
  slug: string
  url: string
  description: string
  waitFor?: (page: Page) => Promise<void>
}

interface VideoFlow {
  slug: string
  title: string
  durationMs: number
  run: (page: Page) => Promise<void>
}

// -------- supabase anon key bootstrap ---------------------------------------
async function loadAnonKey(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  try {
    const env = await readFile(path.join(REPO_ROOT, '.env.local'), 'utf8')
    const match = env.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

// -------- auth ---------------------------------------------------------------
interface SupaSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: { id: string; email: string }
}

async function signInWithPassword(anonKey: string, email: string, password: string): Promise<SupaSession | null> {
  const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`
  log(`auth: POST ${url} (email=${email})`)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.text()
    warn(`auth failed: ${res.status} ${body.slice(0, 200)}`)
    return null
  }
  const json = (await res.json()) as SupaSession
  log('auth: ok, user =', json.user?.email)
  return json
}

/**
 * `@supabase/ssr` stores the session under the cookie name `sb-<project-ref>-auth-token`.
 * Value format (current @supabase/ssr): base64-url JSON array of cookies.
 * Simpler & equally compatible: set the JSON string directly — ssr's cookie parser handles both.
 */
function projectRefFromUrl(url: string): string {
  const host = new URL(url).host
  return host.split('.')[0]
}

async function primeAuthCookies(ctx: BrowserContext, session: SupaSession) {
  const projectRef = projectRefFromUrl(SUPABASE_URL)
  const cookieName = `sb-${projectRef}-auth-token`
  const baseHost = new URL(BASE_URL).host
  // Supabase ssr expects a JSON array: [access_token, refresh_token, providerToken, providerRefreshToken, user]
  const payload = [
    session.access_token,
    session.refresh_token,
    null,
    null,
    session.user ?? null,
  ]
  const value = `base64-${Buffer.from(JSON.stringify(payload)).toString('base64')}`
  await ctx.addCookies([
    {
      name: cookieName,
      value,
      domain: baseHost,
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    },
  ])
  log(`auth: primed cookie ${cookieName} on ${baseHost}`)
}

// -------- shot helpers -------------------------------------------------------
async function ensureDir(p: string) {
  if (!existsSync(p)) await mkdir(p, { recursive: true })
}

async function safeGoto(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 25_000 })
  } catch {
    // Some pages load infinite requests (analytics etc) — fall back to domcontentloaded.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25_000 })
  }
  // Brief settle for fonts + client hydration.
  await page.waitForTimeout(1500)
}

async function captureShot(page: Page, slug: string, viewportDir: string) {
  const dir = path.join(SCREENSHOTS_ROOT, viewportDir)
  await ensureDir(dir)
  const file = path.join(dir, `${slug}.png`)
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' })
  const s = await stat(file)
  log(`  saved ${path.relative(REPO_ROOT, file)} (${(s.size / 1024).toFixed(0)} KB)`)
}

// -------- targets ------------------------------------------------------------
const PUBLIC_TARGETS: ShotTarget[] = [
  { slug: 'home', url: '/', description: 'Landing (/)' },
  { slug: 'landing-v8', url: '/landing/v8', description: 'Landing v8 (LiveMap)' },
  { slug: 'pricing-usd', url: '/pricing', description: 'Pricing (default USD)' },
  { slug: 'pricing-gbp', url: '/pricing?currency=GBP', description: 'Pricing (GBP toggle)' },
  { slug: 'vs-feedonomics', url: '/vs/feedonomics', description: 'vs Feedonomics' },
  { slug: 'about', url: '/about', description: 'About' },
  { slug: 'help', url: '/help', description: 'Help centre' },
  { slug: 'demo', url: '/demo', description: 'Book a demo' },
]

const AUTH_TARGETS: ShotTarget[] = [
  { slug: 'dashboard', url: '/dashboard', description: 'Dashboard' },
  { slug: 'listings', url: '/listings', description: 'Listings' },
  { slug: 'listings-health-filter', url: '/listings?filter=health', description: 'Listings (health filter)' },
  { slug: 'channels', url: '/channels', description: 'Channels' },
  { slug: 'financials', url: '/financials', description: 'Financials' },
  { slug: 'onboarding', url: '/onboarding', description: 'Onboarding' },
  { slug: 'settings-referral', url: '/settings/referral', description: 'Settings — referral' },
  { slug: 'billing', url: '/billing', description: 'Billing' },
  { slug: 'enterprise', url: '/enterprise', description: 'Enterprise' },
]

// -------- video flows --------------------------------------------------------
function buildVideoFlows(authed: boolean): VideoFlow[] {
  const flows: VideoFlow[] = [
    {
      slug: '01-connect-first-marketplace',
      title: 'Connect first marketplace',
      durationMs: 60_000,
      run: async (page) => {
        await safeGoto(page, BASE_URL + '/')
        await page.waitForTimeout(2000)
        await safeGoto(page, BASE_URL + '/signup')
        await page.waitForTimeout(2500)
        await safeGoto(page, BASE_URL + '/onboarding')
        await page.waitForTimeout(3000)
        await safeGoto(page, BASE_URL + (authed ? '/dashboard' : '/'))
        await page.waitForTimeout(3000)
      },
    },
    {
      slug: '02-true-profit-multi-currency',
      title: 'True profit across 5 currencies',
      durationMs: 70_000,
      run: async (page) => {
        await safeGoto(page, BASE_URL + (authed ? '/dashboard' : '/'))
        await page.waitForTimeout(2500)
        await safeGoto(page, BASE_URL + (authed ? '/financials' : '/pricing'))
        await page.waitForTimeout(3000)
        await page.mouse.wheel(0, 600)
        await page.waitForTimeout(2000)
        await page.mouse.wheel(0, 400)
        await page.waitForTimeout(2500)
      },
    },
    {
      slug: '03-preflight-validator-missing-gtin',
      title: 'Pre-flight validator catches missing GTIN',
      durationMs: 75_000,
      run: async (page) => {
        await safeGoto(page, BASE_URL + (authed ? '/listings' : '/vs/feedonomics'))
        await page.waitForTimeout(3000)
        await page.mouse.wheel(0, 400)
        await page.waitForTimeout(2500)
        // try to click first health badge if present
        const badge = page.locator('[data-testid=health-badge]').first()
        if (await badge.count()) {
          try {
            await badge.click({ timeout: 2500 })
            await page.waitForTimeout(3000)
          } catch { /* ignore */ }
        }
        await page.waitForTimeout(3000)
      },
    },
    {
      slug: '04-publish-to-ebay',
      title: 'Publish to eBay',
      durationMs: 80_000,
      run: async (page) => {
        await safeGoto(page, BASE_URL + (authed ? '/listings' : '/landing/v8'))
        await page.waitForTimeout(3000)
        await safeGoto(page, BASE_URL + (authed ? '/channels' : '/pricing'))
        await page.waitForTimeout(3000)
        await page.mouse.wheel(0, 500)
        await page.waitForTimeout(3000)
      },
    },
  ]
  return flows
}

// -------- main ---------------------------------------------------------------
async function main() {
  log(`base url: ${BASE_URL}`)
  log(`supabase: ${SUPABASE_URL}`)
  log(`videos:   ${SKIP_VIDEOS ? 'SKIPPED' : 'ENABLED'}`)
  await ensureDir(SCREENSHOTS_ROOT)
  await ensureDir(VIDEOS_ROOT)

  const anonKey = await loadAnonKey()
  if (!anonKey) warn('no supabase anon key found — auth will be skipped.')

  let session: SupaSession | null = null
  if (anonKey && DEMO_PASSWORD) {
    session = await signInWithPassword(anonKey, DEMO_EMAIL, DEMO_PASSWORD)
  } else if (!DEMO_PASSWORD) {
    warn('DEMO_USER_PASSWORD is not set — only public pages will be captured.')
  }

  const browser = await chromium.launch({ headless: true })

  // ======================= SCREENSHOTS =======================
  const viewports: Array<{ dir: string; size: { width: number; height: number } }> = [
    { dir: '1280x800',  size: { width: 1280, height: 800  } },
    { dir: '1920x1080', size: { width: 1920, height: 1080 } },
  ]

  const captured: { viewport: string; slug: string }[] = []
  const missed: { viewport: string; slug: string; reason: string }[] = []

  for (const vp of viewports) {
    log(`--- viewport ${vp.dir} ---`)
    const ctx = await browser.newContext({
      viewport: vp.size,
      deviceScaleFactor: 1,
      userAgent:
        'Mozilla/5.0 (Palvento Capture Bot) Chrome/Playwright',
    })
    // Suppress cookie-consent banner on every page in this context.
    await ctx.addInitScript(() => {
      try { localStorage.setItem('cookie_consent', 'accepted') } catch {}
    })
    if (session) await primeAuthCookies(ctx, session)

    for (const target of PUBLIC_TARGETS) {
      const page = await ctx.newPage()
      try {
        log(`${vp.dir} → ${target.slug} (${target.url})`)
        await safeGoto(page, BASE_URL + target.url)
        await captureShot(page, target.slug, vp.dir)
        captured.push({ viewport: vp.dir, slug: target.slug })
      } catch (err) {
        const reason = (err as Error).message
        warn(`miss ${vp.dir}/${target.slug}: ${reason}`)
        missed.push({ viewport: vp.dir, slug: target.slug, reason })
      } finally {
        await page.close()
      }
    }

    // Auth-gated captures ONLY at 1920x1080 per spec
    if (vp.dir === '1920x1080') {
      for (const target of AUTH_TARGETS) {
        const page = await ctx.newPage()
        try {
          log(`${vp.dir} → ${target.slug} (auth, ${target.url})`)
          await safeGoto(page, BASE_URL + target.url)
          await captureShot(page, target.slug, vp.dir)
          captured.push({ viewport: vp.dir, slug: target.slug })
        } catch (err) {
          const reason = (err as Error).message
          warn(`miss ${vp.dir}/${target.slug}: ${reason}`)
          missed.push({ viewport: vp.dir, slug: target.slug, reason })
        } finally {
          await page.close()
        }
      }
    }

    await ctx.close()
  }

  // ======================= VIDEOS =======================
  const videoResults: { slug: string; file: string; bytes: number; ms: number }[] = []
  if (!SKIP_VIDEOS) {
    const flows = buildVideoFlows(Boolean(session))
    for (const flow of flows) {
      log(`video: ${flow.slug} — ${flow.title}`)
      const ctx = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        recordVideo: {
          dir: VIDEOS_ROOT,
          size: { width: 1920, height: 1080 },
        },
      })
      // Suppress cookie-consent banner in videos too.
      await ctx.addInitScript(() => {
        try { localStorage.setItem('cookie_consent', 'accepted') } catch {}
      })
      if (session) await primeAuthCookies(ctx, session)
      const page = await ctx.newPage()
      const t0 = Date.now()
      try {
        await flow.run(page)
      } catch (err) {
        warn(`video ${flow.slug} failed mid-flow: ${(err as Error).message}`)
      }
      const ms = Date.now() - t0
      await page.close()
      await ctx.close()

      // Playwright gives the most recent recording the name it chose; move it.
      const rawPath = await page.video()?.path().catch(() => null)
      let finalPath = path.join(VIDEOS_ROOT, `${flow.slug}.webm`)
      if (rawPath && existsSync(rawPath)) {
        try {
          await (await import('node:fs/promises')).rename(rawPath, finalPath)
        } catch {
          finalPath = rawPath
        }
      }
      if (existsSync(finalPath)) {
        const s = await stat(finalPath)
        videoResults.push({ slug: flow.slug, file: path.relative(REPO_ROOT, finalPath), bytes: s.size, ms })
        log(`  saved ${path.relative(REPO_ROOT, finalPath)} (${(s.size / 1024 / 1024).toFixed(2)} MB, ${(ms / 1000).toFixed(1)}s)`)
      } else {
        warn(`  no video file emitted for ${flow.slug}`)
      }
    }
  } else {
    log('skipping videos (CAPTURE_SKIP_VIDEOS=1)')
  }

  await browser.close()

  // ======================= SUMMARY =======================
  const summary = {
    base_url: BASE_URL,
    captured_at: new Date().toISOString(),
    authed: Boolean(session),
    screenshots: captured,
    screenshot_misses: missed,
    videos: videoResults,
  }
  await writeFile(
    path.join(REPO_ROOT, 'marketing', 'screenshots', '_last-run.json'),
    JSON.stringify(summary, null, 2),
    'utf8',
  )
  log('done.')
  log(`screenshots: ${captured.length} captured, ${missed.length} missed`)
  log(`videos:      ${videoResults.length} captured`)
}

main().catch((err) => {
  console.error('[capture] fatal:', err)
  process.exit(1)
})
