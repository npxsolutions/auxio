# Palvento Brand Assets

Canonical logo files live here. Production app code references the three root-level SVGs (`public/logo.svg`, `public/logo-mark.svg`, `public/logo-wordmark.svg`) for favicons, nav marks, and embedded use. Files in this directory are the full brand system — variants, reverses, and download-ready avatars for social profiles.

## Concept

The mark is a **gable over an inner cutout**, with a cobalt bar seated at the base of the cutout.

- The **outer chevron** is the wall — "palvento" is the Italian term for a Mediterranean wind-shelter wall.
- The **inner void** is the shelter itself.
- The **cobalt bar** is the feed flowing through — clean, catalogued, protected from the marketplace chaos outside.

The mark reads at 16px (favicon), 256px (avatar), and 2048px (print) without re-drawing.

## Colour

| Token | Hex | Use |
|---|---|---|
| Ink | `#0b0f1a` | Primary mark + text on light |
| Cream | `#f3f0ea` | Canvas / background |
| Cobalt | `#1d5fdb` | Accent, feed bar, editorial italic highlights |
| Cobalt soft | `#7bb7ff` | Accent on dark backgrounds |

## File index

| File | Viewbox | When to use |
|---|---|---|
| `../logo.svg` | 512×512 | Favicon-adjacent, App Store icon, PWA manifest |
| `../logo-mark.svg` | 256×256 | Bare mark — nav, inline use, stamps |
| `../logo-wordmark.svg` | 520×128 | Horizontal wordmark — email signature, site header |
| `palvento-mark.svg` | 256×256 | Canonical colour mark |
| `palvento-mark-inverse.svg` | 256×256 | Mark on dark backgrounds (cream + cobalt soft) |
| `palvento-mark-mono-black.svg` | 256×256 | Single-colour black — print, embossing, favicons at small sizes |
| `palvento-mark-mono-white.svg` | 256×256 | Single-colour white — dark single-colour contexts |
| `palvento-wordmark.svg` | 520×128 | Horizontal wordmark, colour |
| `palvento-wordmark-inverse.svg` | 520×128 | Horizontal wordmark, dark background |
| `palvento-avatar-1024.svg` | 1024×1024 | LinkedIn / X / GitHub / App Store avatar — cream with rounded corners |
| `palvento-avatar-1024-dark.svg` | 1024×1024 | Dark-mode avatar variant |

## Typography

The wordmark sets "Palvento" in **Instrument Serif italic** — the same display face used across the product UI (see `app/layout.tsx` where it's loaded globally as `--font-display`). Keep that face if you ever re-draw the wordmark; it is the most recognisable non-mark brand element.

## Sizing & clearspace

- **Clearspace** around the mark: equal to the height of the cobalt bar (≈ `bar-height × 1`). Nothing should encroach inside that margin.
- **Minimum mark size:** 16px (favicon). Below that, the inner cutout disappears and the cobalt bar becomes a single pixel.
- **Avatar safe area:** the 1024×1024 avatar already bakes in ~20% padding. Do not crop further for square social platforms.

## Don'ts

- Don't recolour the cobalt bar to anything outside the approved palette.
- Don't rotate the mark. The chevron is axial — tilting it breaks the shelter metaphor.
- Don't stretch. The path is precision-drawn; non-uniform scale wrecks the optical balance.
- Don't remove the cobalt bar from the default mark — it is half the identity. Mono variants are the only exception and live in their own files.

## Raster exports

These files are SVG for lossless scaling. LinkedIn, GitHub, and most modern platforms accept SVG for brand marks.

For platforms that require PNG/JPG (e.g. email clients, some CRM avatars), export via any SVG → PNG tool:
- **Quickest:** open the SVG in a browser, screenshot.
- **Programmatic:** `npx @resvg/resvg-cli palvento-avatar-1024.svg -o out.png`
- **Canva:** upload the SVG, export at the required raster size.

PNG exports are not committed here; regenerate on demand to avoid binary bloat in the repo.
