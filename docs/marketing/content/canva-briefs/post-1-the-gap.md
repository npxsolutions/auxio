# Canva brief — LinkedIn Post #1 · "The tier that didn't exist"

> Companion visual for the Week 1 Tuesday post (`linkedin-posts.md` Post #1).
> Aesthetic target: **Mercury / Linear / Attio** — quiet editorial, serif display, lots of whitespace, no gradients, no stock icons, zero emoji.
> Rival-name-free per founder preference.

---

## Quickest path — two options, pick one

### Option A — The quote card (recommended)

Most on-brand with the playbook's Mercury reference (`1b-saas-social-playbook.md:61` → *"calm, serif-brand, no exclamation marks, never shouting"*). One big serif sentence + small mono footer. Nothing else.

**Canva template search:** `"linkedin post quote minimal"` or `"linkedin editorial quote cream"` — pick any template that is: square, cream background, single large serif quote, no decorative elements. Then replace everything.

### Option B — The market map (more assertive)

Two-column diagram: `FREE · Basic channel sync` on the left, `ENTERPRISE · Managed feed services` on the right, cobalt italic "here." in the gap with Palvento wordmark. More information-dense, slightly less on-brand for editorial voice but makes the thesis visual.

**Canva template search:** `"2x2 matrix linkedin"` or `"positioning map"` — pick one with two side-by-side rectangles. Delete the rectangles' fills, leave only 1.5pt dark borders.

**Pick Option A for post #1** — a quote card lands harder as a founder's first public statement than an infographic. Save the market map for post #6 (the "gap in the market" POV post three weeks later).

---

## Shared brand constants — use these in both options

### Dimensions

**1080 × 1080 px** (LinkedIn square — Canva's default "Square Post" preset works)
or **1200 × 1200 px** if you want extra room.

### Colours (exact hex — matches `app/lib/design-system.tsx`)

| Role        | Hex       | Canva brand kit name to save as |
|-------------|-----------|----------------------------------|
| Background  | `#f3f0ea` | Palvento cream                   |
| Ink (body)  | `#0b0f1a` | Palvento ink                     |
| Muted       | `#5a6171` | Palvento muted                   |
| Accent      | `#1d5fdb` | Palvento cobalt                  |
| Oxblood     | `#7d2a1a` | Palvento oxblood (for prices)    |
| Rule hairline | `rgba(11,15,26,0.10)` — approximate as `#E0DDD7` in Canva |

Open Canva → Brand Kit → add all six as a named palette "Palvento v1". Reuse across every post — saves 10 minutes per card.

### Fonts

| Role       | First choice       | Canva-available fallback (in order) |
|------------|--------------------|--------------------------------------|
| Display serif | **Instrument Serif** | DM Serif Display · Fraunces · EB Garamond |
| Mono / accents | **Geist Mono**       | JetBrains Mono · Space Mono · IBM Plex Mono |

If Instrument Serif isn't in Canva's font picker, `DM Serif Display` is the closest free alternative. `Fraunces` is more characterful — use whichever feels right.

### Voice rules (from `linkedin-launch-sequence.md:3`)

- No emoji anywhere
- No exclamation marks
- No "revolutionise / 10x / game-changing / the future of"
- Hashtags lowercase, max 4, always at the bottom of the post text — never on the image

---

## Option A — Quote card layout (recommended for Post #1)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │  ← 120px top padding
│  PALVENTO · POST №1 · WEEK 1           WHERE WE'RE BUILDING│  ← eyebrow, mono 16pt, muted
│  ──────────────────────────────────────────────────────  │  ← 1pt hairline rule, #E0DDD7
│                                                          │
│                                                          │
│                                                          │
│        Self-serve multichannel                           │  ← Display serif, 96pt,
│        feed management for                               │    ink, centered,
│        Shopify-led sellers                               │    line-height 1.15
│        scaling past their store.                         │
│                                                          │
│                                                          │
│                                                          │
│       — the one-line thesis after four                   │  ← Display serif italic,
│       months of operator calls.                          │    30pt, muted, centered
│                                                          │
│                                                          │
│                                                          │
│  ──────────────────────────────────────────────────────  │  ← hairline rule
│  • PALVENTO                              palvento.com    │  ← mono 16pt
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Exact values to set in Canva:

**Eyebrow (top row)**
- Text left: `PALVENTO · POST №1 · WEEK 1`
- Text right: `WHERE WE'RE BUILDING`
- Font: Geist Mono (or fallback), size 16, uppercase, tracking +140 (0.14em), colour `#5a6171`, weight 600

**Main quote (centre, 5 lines)**
- Text: `Self-serve multichannel feed management for Shopify-led sellers scaling past their store.`
- Font: Instrument Serif (or DM Serif Display), size 96, line-height 1.15, colour `#0b0f1a`, centre-aligned
- Tighten the kerning with tracking -20 if the font has loose defaults
- Highlight `Self-serve` in italic only (small style-within-style touch — Mercury does this)

**Byline**
- Text: `— the one-line thesis after four months of operator calls.`
- Font: Instrument Serif **italic**, size 30, colour `#5a6171`, centre-aligned
- Leading em-dash not hyphen (use `—` not `-`)

**Footer**
- Left: small cobalt filled circle (6px diameter) + text `PALVENTO` in Geist Mono 18pt, uppercase, tracking +150, colour `#0b0f1a`
- Right: `palvento.com` in Geist Mono 16pt, colour `#5a6171`
- Separate the footer from the rest with a 1pt hairline rule in `#E0DDD7`

**Top and bottom padding**: 120px. **Left/right padding**: 100px.

---

## Option B — Market map layout (for later posts)

```
┌──────────────────────────────────────────────────────────┐
│  PALVENTO · POST №1 · WEEK 1                 NO. 01      │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│          The tier that didn't exist.                     │  ← Display serif, 88pt, centered
│                                                          │
│   ┌─────────────┐      here.     ┌─────────────┐         │  ← "here." in Instrument Serif
│   │ FREE        │  (cobalt ital) │ ENTERPRISE  │         │    italic, 120pt, cobalt
│   │             │                │             │         │
│   │ Basic       │      ↓         │ Managed     │         │
│   │ channel     │  (curved arrow)│ feed        │         │
│   │ sync        │                │ services    │         │
│   │             │                │             │         │
│   │ 3-ch cap    │                │ $2,500/mo   │         │  ← oxblood for price
│   │ 50 orders   │                │ 30-day onb. │         │
│   │ no rules    │                │ quote-gated │         │
│   │ no validator│                │ sales call  │         │
│   └─────────────┘                └─────────────┘         │
│                                                          │
│       Self-serve multichannel feed management            │
│       for Shopify-led sellers scaling past               │
│       their store.                                       │
│  ──────────────────────────────────────────────────────  │
│  • PALVENTO                              palvento.com    │
└──────────────────────────────────────────────────────────┘
```

**To build in Canva:**

1. Two **rectangles**, 380×420, 1.5pt stroke `#0b0f1a`, no fill, positioned left (x=120) and right (x=700)
2. Column headings `FREE` / `ENTERPRISE` in Geist Mono 14pt uppercase, tracking +140, `#5a6171`
3. Column names `Basic / channel sync` and `Managed / feed services` in Instrument Serif 46pt, `#0b0f1a`
4. Thin horizontal divider inside each column (`#5a6171` at 40% opacity, 1pt, 72px long)
5. Detail bullets in Geist Mono 18pt, `#5a6171`, one per line. The `$2,500/month` line gets `#7d2a1a` (oxblood) and weight 600
6. Centre: the word `here.` in Instrument Serif **italic**, 128pt, colour `#1d5fdb` — position at y=620 centred
7. Under `here.` add `PALVENTO` in Geist Mono 18pt uppercase cobalt, tracking +140
8. Curved arrow from below `here.` sweeping down into the gap. Use Canva's **curve line tool** — draw a gentle S-curve, 3pt stroke, round caps, colour `#1d5fdb`. Add an arrowhead at the end pointing down

---

## Canva Magic Design prompt (if you want to skip manual build)

Paste this into Canva's AI design generator as-is:

```
Create a 1080x1080 LinkedIn post in an editorial minimal style inspired by Mercury Bank and Linear.

Background: warm cream #f3f0ea.

One large serif quote centered on the card:
"Self-serve multichannel feed management for Shopify-led sellers scaling past their store."

Below the quote, a small italic serif byline in muted grey:
"— the one-line thesis after four months of operator calls."

Use a serif display font (Instrument Serif, DM Serif Display, or Fraunces).
Accent colour: cobalt blue #1d5fdb.
Text colour: near-black #0b0f1a.
Muted colour: #5a6171.

Top of the card: small monospace eyebrow in uppercase grey reading
"PALVENTO · POST №1 · WEEK 1"

Bottom of the card: small cobalt dot, word "PALVENTO" in monospace uppercase, and "palvento.com" right-aligned. Thin horizontal hairline rules separating eyebrow and footer from the quote.

No emoji. No gradients. No icons. No photo backgrounds. No decorative shapes.
Generous whitespace — at least 60% of the canvas should be empty background.
```

Magic Design output quality varies — expect to iterate 2–3 times on the prompt, or start from a template and swap text instead.

---

## Export settings for LinkedIn

- **Format**: PNG
- **Size**: 1× (Canva default) — LinkedIn downsamples aggressively so 2× is wasted bytes
- **Transparency**: off (cream background is the design)
- **File size**: aim <500kb. If Canva exports over 1MB, reduce image quality to 80%
- Name the file `palvento-li-post-01-thesis.png` before saving, so the library stays organised

---

## Versioning in this repo

When you're happy with a Canva version:

1. Export the PNG to `public/marketing/palvento-li-post-01-thesis.png`
2. Also save the Canva URL to `docs/marketing/content/canva-briefs/post-1-the-gap.md` under a new **"Canva design URL"** heading at the bottom so future-you (and any agency or contractor) can fork the source design
3. Commit both: `Add Canva-built visual for LinkedIn Post #1`

We'll repeat this pattern for posts 2–24.

---

## When the Canva MCP is properly loaded in a Claude Code session

If you restart Claude Code and the Canva tools surface (tools named `mcp__claude_ai_Canva__*`), I can:
- Create the design programmatically from this brief
- Pull the exported PNG back into the repo
- Batch-generate posts 2–24 from their visual briefs in one pass

Until then, manual Canva is the path. This brief is the spec.
