/**
 * Cascades the v9 warm-cream + orange palette across all public marketing
 * pages that hardcode the old v8 cobalt/cream hex values. Skips v5–v8
 * landing variants (frozen history) and non-UI code paths.
 *
 * Idempotent — re-running is safe; values already migrated are no-ops.
 *
 * Usage: npx tsx scripts/repalette-v9.ts
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// Old → new hex + rgba mappings
const MAP: Array<[RegExp, string]> = [
  // Cobalt (primary accent) → burnished orange
  [/#1d5fdb\b/gi, '#e8863f'],
  [/#1647a8\b/gi, '#c46f2a'],
  // Cobalt light variants used as hover / active tints
  [/#7c6af7\b/gi, '#e8863f'],  // old indigo used in signup/admin
  [/#5b52f5\b/gi, '#e8863f'],  // old indigo primary
  [/#4a42e5\b/gi, '#c46f2a'],
  // Cream page bg — small drift to the new warmer cream
  [/#f3f0ea\b/gi, '#f8f4ec'],
  // Cream darker shade (raised surface) alignment
  [/#ebe6dc\b/gi, '#fdfaf2'],
  [/#f5f3ef\b/gi, '#f8f4ec'],  // old darker cream variant
  // rgba variants — cobalt alpha tints
  [/rgba\(29,\s*95,\s*219,\s*([0-9.]+)\)/g, 'rgba(232,134,63,$1)'],
  [/rgba\(91,\s*82,\s*245,\s*([0-9.]+)\)/g, 'rgba(232,134,63,$1)'], // indigo alpha
]

// Directories to skip
const SKIP = new Set([
  'node_modules',
  '.next',
  '.git',
  '.claude',
])

// Files to skip (v5–v8 landing frozen, script file itself)
const SKIP_FILES = [
  /app[\\/]landing[\\/]v[5-8][\\/]/,
  /scripts[\\/]repalette-v9\.ts$/,
  /\.agents[\\/]/,
  /docs[\\/]/,
]

function shouldSkip(path: string): boolean {
  return SKIP_FILES.some(rx => rx.test(path))
}

function walk(dir: string, out: string[] = []): string[] {
  const entries = readdirSync(dir)
  for (const name of entries) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    let stat
    try { stat = statSync(p) } catch { continue }
    if (stat.isDirectory()) {
      walk(p, out)
    } else if (/\.(tsx?|css|mdx)$/.test(name) && !shouldSkip(p)) {
      out.push(p)
    }
  }
  return out
}

const root = process.cwd()
const files = walk(root)
let changedFiles = 0
let totalReplacements = 0

for (const f of files) {
  let src: string
  try { src = readFileSync(f, 'utf8') } catch { continue }
  let out = src
  let fileReplacements = 0
  for (const [rx, repl] of MAP) {
    out = out.replace(rx, (...args) => {
      fileReplacements++
      return repl
    })
  }
  if (out !== src) {
    writeFileSync(f, out, 'utf8')
    changedFiles++
    totalReplacements += fileReplacements
    console.log(`  ${relative(root, f)} — ${fileReplacements} swap${fileReplacements === 1 ? '' : 's'}`)
  }
}

console.log(`\nChanged ${changedFiles} files · ${totalReplacements} total replacements.`)
