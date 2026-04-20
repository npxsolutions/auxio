/**
 * Adds a CTA paragraph to each of the 24 LinkedIn posts in
 * docs/marketing/content/week-1-8/linkedin-posts.md.
 *
 * The CTA archetype is chosen by post type:
 *   - Narrative / POV → founding-partner ask (A)
 *   - Tactical → ICP invitation (B)
 *   - Product → product anchor (C)
 *   - Early POV (posts 19, 21, 22) → series-follow (D) — less pressure
 *
 * Idempotent: re-running it skips posts that already include a CTA line
 * (detected by presence of "palvento.com" or "DM me" inside the post body).
 *
 * Usage: npx tsx scripts/add-post-ctas.ts
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const FILE = join('docs', 'marketing', 'content', 'week-1-8', 'linkedin-posts.md')

type Archetype = 'A' | 'B' | 'C' | 'D'

const CTA: Record<Archetype, string> = {
  A: '10 founding-partner spots open at 40% off for life. palvento.com — or DM me.',
  B: 'If you recognise the shape — Shopify-led, three to five channels — DM me. 10 founding-partner spots open at palvento.com, 40% off for life.',
  C: 'Live at palvento.com. 10 founding-partner spots open at 40% off for life.',
  D: 'Following the 8-week build in public — palvento.com for the full thesis.',
}

// Post number → archetype. Derived from post type + position:
//   Narrative + POV (structural) → A (founding-partner ask)
//   Tactical → B (ICP invitation)
//   Product → C (product anchor)
//   Early POV (19, 21, 22) → D (series follow, softer)
const MAPPING: Record<number, Archetype> = {
  1:  'A', 2:  'B', 3:  'A', 4:  'A', 5:  'B', 6:  'A',
  7:  'B', 8:  'A', 9:  'B', 10: 'B', 11: 'B', 12: 'C',
  13: 'C', 14: 'A', 15: 'C', 16: 'C', 17: 'C', 18: 'B',
  19: 'D', 20: 'A', 21: 'D', 22: 'D',
  // 23 and 24 already have strong in-body CTAs; leave untouched.
}

const md = readFileSync(FILE, 'utf8')
const lines = md.split(/\r?\n/)

// Find all Hashtag markers and the preceding post number
// Pattern: "### Post N — ..." header, then body, then "**Hashtags**"
type PostBlock = { num: number; hashtagsLineIdx: number }
const blocks: PostBlock[] = []
let currentNum: number | null = null

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const m = /^### Post (\d+) —/.exec(line)
  if (m) { currentNum = parseInt(m[1], 10); continue }
  if (currentNum !== null && line === '**Hashtags**') {
    blocks.push({ num: currentNum, hashtagsLineIdx: i })
    currentNum = null
  }
}

// Guard: the file should have 24 posts
if (blocks.length !== 24) {
  throw new Error(`Expected 24 posts, found ${blocks.length}`)
}

// Build the new file, inserting CTA paragraph before each **Hashtags** where
// the mapping has an archetype AND the body doesn't already include "palvento.com".
let modified = 0
let skipped = 0
const outLines = [...lines]

// Process in reverse so index insertions don't shift earlier positions
for (let i = blocks.length - 1; i >= 0; i--) {
  const b = blocks[i]
  const archetype = MAPPING[b.num]
  if (!archetype) { skipped++; continue }

  // Find this post's body range: from after the "### Post N —" line to the
  // blank line before **Hashtags**. Search backwards.
  let bodyEnd = b.hashtagsLineIdx - 1
  while (bodyEnd > 0 && outLines[bodyEnd] === '') bodyEnd--
  let bodyStart = bodyEnd
  while (bodyStart > 0 && !/^### Post /.test(outLines[bodyStart])) bodyStart--

  // Check for existing CTA text
  const bodyText = outLines.slice(bodyStart, b.hashtagsLineIdx).join('\n')
  if (/palvento\.com/i.test(bodyText) || /DM me/i.test(bodyText)) {
    skipped++
    continue
  }

  // Insert CTA paragraph: blank line, CTA text, blank line, before **Hashtags**
  const cta = CTA[archetype]
  // We want: [last body para] \n\n [CTA] \n\n **Hashtags**
  // hashtagsLineIdx currently points at "**Hashtags**". Line before it is blank.
  // Insert [CTA, ''] at hashtagsLineIdx (pushing **Hashtags** down by 2).
  outLines.splice(b.hashtagsLineIdx, 0, cta, '')
  modified++
}

writeFileSync(FILE, outLines.join('\n'), 'utf8')
console.log(`Modified ${modified} posts, skipped ${skipped} (already have CTA or unmapped).`)
