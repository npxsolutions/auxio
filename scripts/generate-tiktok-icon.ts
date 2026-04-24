// One-shot: render the Palvento app icon at TikTok Shop's 512×512 spec.
import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const svg = readFileSync('public/brand/palvento-avatar-1024.svg', 'utf8')
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 512 },
  font: { loadSystemFonts: true },
})
writeFileSync('public/brand/palvento-app-icon-512.png', resvg.render().asPng())
console.log('wrote public/brand/palvento-app-icon-512.png (512×512)')
