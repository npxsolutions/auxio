/**
 * Generates 24 LinkedIn post images as SVG — one per post in
 * docs/marketing/content/week-1-8/linkedin-posts.md.
 *
 * Output: public/marketing/posts/post-NN.svg (1200×1200, cream bg,
 * editorial Instrument Serif italic rendering of each post's hook with
 * cobalt accent on the second hook line, Palvento mark bottom-left,
 * palvento.com URL bottom-right, section eyebrow at top).
 *
 * Usage: npx tsx scripts/generate-post-images.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const MD = join('docs', 'marketing', 'content', 'week-1-8', 'linkedin-posts.md')
const OUT_DIR = join('public', 'marketing', 'posts')

const CANVAS = 1200
const MARGIN = 96
const CONTENT_W = CANVAS - MARGIN * 2
// Instrument Serif italic — average char width at size S ≈ 0.45 * S.
// Pick font size so the longest hook line fits, then wrap cleanly.
const FONT_SIZE = 64
const LINE_HEIGHT = 80
const CHAR_W = 0.42 * FONT_SIZE        // calibrated for Instrument Serif italic
const MAX_CHARS = Math.floor(CONTENT_W / CHAR_W)

const CREAM = '#f8f4ec'
const INK = '#0b0f1a'
const COBALT = '#e8863f'
const MUTED = '#5a6171'

function wrap(line: string, maxChars: number): string[] {
  if (line.length <= maxChars) return [line]
  const words = line.split(' ')
  const out: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (test.length > maxChars && cur) {
      out.push(cur); cur = w
    } else {
      cur = test
    }
  }
  if (cur) out.push(cur)
  return out
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

type Post = { n: number; type: string; hook1: string; hook2: string }

// Parse MD into posts
const md = readFileSync(MD, 'utf8')
const lines = md.split(/\r?\n/)
const posts: Post[] = []
let cur: Partial<Post> | null = null
let section: 'hook' | null = null
let hookBuf: string[] = []

function flush() {
  if (!cur) return
  const [h1, h2] = [hookBuf[0] || '', hookBuf[1] || '']
  posts.push({ n: cur.n!, type: cur.type!, hook1: h1, hook2: h2 })
  cur = null; section = null; hookBuf = []
}

for (const raw of lines) {
  const m = /^### Post (\d+) — (\w+)/.exec(raw)
  if (m) {
    flush()
    cur = { n: parseInt(m[1], 10), type: m[2] }
    continue
  }
  if (!cur) continue
  if (/^\*\*Hook\*\*$/.test(raw)) { section = 'hook'; continue }
  if (/^\*\*Body\*\*$/.test(raw)) { section = null; continue }
  if (/^---$/.test(raw) || /^## /.test(raw)) { flush(); continue }
  if (section === 'hook' && raw.trim()) hookBuf.push(raw.trim())
}
flush()

if (posts.length !== 24) throw new Error(`Expected 24 posts, parsed ${posts.length}`)

// Ensure output directory exists
mkdirSync(OUT_DIR, { recursive: true })

// Render one SVG per post
function renderSvg(p: Post): string {
  // Wrap hook lines to MAX_CHARS
  const subs1 = wrap(p.hook1, MAX_CHARS)
  const subs2 = wrap(p.hook2, MAX_CHARS)
  const allSubs = [...subs1.map(s => ({ text: s, color: INK })), ...subs2.map(s => ({ text: s, color: COBALT }))]

  // Vertical centring: total block height = n * LINE_HEIGHT
  const blockH = allSubs.length * LINE_HEIGHT
  const firstBaselineY = (CANVAS - blockH) / 2 + FONT_SIZE  // first-line baseline

  // Week number (from post number — 3 posts per week)
  const week = Math.ceil(p.n / 3)

  // Text lines
  const textEls = allSubs.map((s, i) => {
    const y = firstBaselineY + i * LINE_HEIGHT
    return `  <text x="${MARGIN}" y="${y}" font-family="'Instrument Serif', Georgia, serif" font-style="italic" font-size="${FONT_SIZE}" fill="${s.color}" letter-spacing="-1">${escXml(s.text)}</text>`
  }).join('\n')

  // Eyebrow top-left — mono uppercase tracking
  const eyebrow = `Palvento · § ${String(p.n).padStart(2, '0')} / 24 · ${p.type} · week ${week}`

  // Chevron mark bottom-left (scaled from canonical 256 path to 56px)
  // Canonical: outer path + cobalt inner bar, 256 viewBox
  const markScale = 56 / 256
  const markX = MARGIN
  const markY = CANVAS - MARGIN - 56

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}" role="img" aria-label="Palvento post ${p.n}">
  <title>${escXml(p.hook1)} ${escXml(p.hook2)}</title>
  <rect width="${CANVAS}" height="${CANVAS}" fill="${CREAM}"/>
  <text x="${MARGIN}" y="${MARGIN + 20}" font-family="ui-monospace, 'JetBrains Mono', monospace" font-size="18" fill="${MUTED}" letter-spacing="2" text-transform="uppercase">${escXml(eyebrow.toUpperCase())}</text>
  <line x1="${MARGIN}" y1="${MARGIN + 40}" x2="${MARGIN + 80}" y2="${MARGIN + 40}" stroke="${COBALT}" stroke-width="1.5"/>
${textEls}
  <g transform="translate(${markX} ${markY}) scale(${markScale})">
    <path d="M24 232 L128 24 L232 232 L184 232 L128 124 L72 232 Z" fill="${INK}"/>
    <rect x="88" y="188" width="80" height="20" rx="1" fill="${COBALT}"/>
  </g>
  <text x="${CANVAS - MARGIN}" y="${CANVAS - MARGIN - 8}" font-family="ui-monospace, 'JetBrains Mono', monospace" font-size="18" fill="${INK}" text-anchor="end" letter-spacing="1">palvento.com</text>
</svg>
`
}

let count = 0
for (const p of posts) {
  const svg = renderSvg(p)
  const slug = `post-${String(p.n).padStart(2, '0')}`
  writeFileSync(join(OUT_DIR, `${slug}.svg`), svg, 'utf8')

  // Render to PNG at the same 1200×1200 for LinkedIn/Buffer delivery.
  // LinkedIn inline images support PNG/JPG only (no SVG in the feed).
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      // Use the system default font fallback; Instrument Serif won't render
      // locally but Georgia falls through to a serif that looks close enough
      // for a feed image. For pixel-perfect Instrument Serif PNGs, generate
      // from a browser or Canva (both have the font loaded).
      loadSystemFonts: true,
    },
  })
  const png = resvg.render().asPng()
  writeFileSync(join(OUT_DIR, `${slug}.png`), png)
  count++
}

console.log(`Wrote ${count} post images (SVG + PNG) to ${OUT_DIR}`)
