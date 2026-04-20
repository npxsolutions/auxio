/**
 * Parses docs/marketing/content/week-1-8/linkedin-posts.md and emits a
 * Buffer-compatible bulk-import CSV. The MD file is the canonical source;
 * re-run this script any time a post is edited to keep the CSV in sync.
 *
 * Usage: npx tsx scripts/generate-buffer-csv.ts
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const INPUT = join('docs', 'marketing', 'content', 'week-1-8', 'linkedin-posts.md')
const OUTPUT = join('docs', 'marketing', 'content', 'week-1-8', 'buffer-bulk-import.csv')

// Week 1 starts Tue 2026-04-21. Week N starts 7 * (N-1) days later.
const WEEK_1_TUE = new Date(Date.UTC(2026, 3, 21))
const DAY_OFFSETS: Record<string, number> = { Tue: 0, Thu: 2, Fri: 3 }

function dateFor(week: number, day: 'Tue' | 'Thu' | 'Fri'): string {
  const d = new Date(WEEK_1_TUE)
  d.setUTCDate(d.getUTCDate() + (week - 1) * 7 + DAY_OFFSETS[day])
  return d.toISOString().slice(0, 10)
}

function csvEscape(s: string): string {
  return `"${s.replace(/"/g, '""')}"`
}

type Post = {
  n: number
  week: number
  type: string
  day: 'Tue' | 'Thu' | 'Fri'
  time: string
  hook: string
  body: string
  hashtags: string
  visual: string
}

const md = readFileSync(INPUT, 'utf8')
const lines = md.split(/\r?\n/)

const posts: Post[] = []
let week = 0
let current: Partial<Post> | null = null
let section: 'hook' | 'body' | 'hashtags' | 'visual' | null = null
const buf: Record<string, string[]> = { hook: [], body: [], hashtags: [], visual: [] }

function flush() {
  if (!current) return
  posts.push({
    ...(current as Post),
    hook: buf.hook.join('\n').trim(),
    body: buf.body.join('\n').trim(),
    hashtags: buf.hashtags.join('\n').trim(),
    visual: buf.visual.join('\n').trim(),
  })
  current = null
  section = null
  buf.hook = []; buf.body = []; buf.hashtags = []; buf.visual = []
}

for (const raw of lines) {
  const line = raw
  const weekMatch = /^## Week (\d+)/.exec(line)
  if (weekMatch) { week = parseInt(weekMatch[1], 10); continue }

  const postMatch = /^### Post (\d+) — (\w+) · (Tue|Thu|Fri) (\d{2}:\d{2}) UK/.exec(line)
  if (postMatch) {
    flush()
    current = {
      n: parseInt(postMatch[1], 10),
      week,
      type: postMatch[2],
      day: postMatch[3] as 'Tue' | 'Thu' | 'Fri',
      time: postMatch[4],
    }
    section = null
    continue
  }

  if (!current) continue

  if (/^\*\*Hook\*\*$/.test(line))     { section = 'hook'; continue }
  if (/^\*\*Body\*\*$/.test(line))     { section = 'body'; continue }
  if (/^\*\*Hashtags\*\*$/.test(line)) { section = 'hashtags'; continue }
  if (/^\*\*Visual brief\*\*$/.test(line)) { section = 'visual'; continue }
  if (/^---$/.test(line)) { flush(); continue }
  if (/^## /.test(line))  { flush(); continue }

  if (section) buf[section].push(line)
}
flush()

// Validate
const expectedPosts = 24
if (posts.length !== expectedPosts) {
  throw new Error(`Expected ${expectedPosts} posts, parsed ${posts.length}`)
}

// Emit CSV
const rows = ['scheduled_date,scheduled_time,network,text,notes']
for (const p of posts) {
  const text = `${p.hook}\n\n${p.body}\n\n${p.hashtags}`
  const note = `Week ${p.week} Post ${p.n} — ${p.type} — Visual: ${p.visual}`
  rows.push(`${dateFor(p.week, p.day)},${p.time},linkedin,${csvEscape(text)},${csvEscape(note)}`)
}

writeFileSync(OUTPUT, rows.join('\n') + '\n', 'utf8')
console.log(`Wrote ${posts.length} posts to ${OUTPUT}`)
