# Palvento — Videos

Captured by `npm run capture` (see `scripts/capture-assets.ts`). Source:
`https://palvento-lkqv.vercel.app`.

Output format: WebM (VP9), 1920×1080, recorded via Playwright's `context.recordVideo`.

## Flows

| # | Slug | Length | Where to use |
| --- | --- | --- | --- |
| 1 | `01-connect-first-marketplace.webm` | 60–70s | Shopify App Store hero reel, Product Hunt maker video, first email in onboarding sequence |
| 2 | `02-true-profit-multi-currency.webm` | 70–80s | LinkedIn organic, Capterra gallery (if it accepts video), sales-assist demo |
| 3 | `03-preflight-validator-missing-gtin.webm` | 70–80s | Feature announcement post, email to eBay-heavy segment, FAQ page embed |
| 4 | `04-publish-to-ebay.webm` | 70–90s | Shopify App Store gallery, Capterra gallery, landing-page looping preview |

## Transcoding for Shopify App Store (MP4)

Shopify App Store requires **MP4 (H.264)**, max 2 GB, 16:9. If `ffmpeg` is
available locally, transcode via:

```bash
for f in marketing/videos/*.webm; do
  ffmpeg -y -i "$f" -c:v libx264 -preset slow -crf 20 -vf scale=1920:1080 \
    -c:a aac -b:a 128k "${f%.webm}.mp4"
done
```

If `ffmpeg` is not installed, download a static build from
<https://ffmpeg.org/download.html> or install via Chocolatey / Homebrew:

- Windows: `choco install ffmpeg`
- macOS: `brew install ffmpeg`
- Linux: `apt install ffmpeg`

## Re-run

```bash
DEMO_USER_PASSWORD='...' npm run capture
# Screenshots only (skip videos):
CAPTURE_SKIP_VIDEOS=1 npm run capture
```

## Size note

If a WebM is >20 MB, either re-transcode (see ffmpeg block above) or use
`ffmpeg -i input.webm -b:v 1.5M -crf 32 output.webm` to squeeze it before
committing. Very large videos should be hosted in external blob storage
(Vercel Blob, S3, YouTube), not in git.
