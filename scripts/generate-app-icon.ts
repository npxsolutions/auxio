// One-shot: render the Palvento app icon at Shopify's 1200×1200 spec.
import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const svg = readFileSync('public/brand/palvento-avatar-1024.svg', 'utf8')
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { loadSystemFonts: true },
})
writeFileSync('public/brand/palvento-app-icon-1200.png', resvg.render().asPng())
console.log('wrote public/brand/palvento-app-icon-1200.png (1200×1200)')
