import { bricolage, playfair, barlow, outfit, syne, cormorant } from './fonts'
import BrandConceptsClient from './BrandConceptsClient'

export default function BrandConceptsPage() {
  const fontVars = [
    bricolage.variable,
    playfair.variable,
    barlow.variable,
    outfit.variable,
    syne.variable,
    cormorant.variable,
  ].join(' ')

  return (
    <div className={fontVars}>
      <BrandConceptsClient />
    </div>
  )
}
