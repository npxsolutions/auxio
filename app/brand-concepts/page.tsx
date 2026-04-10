import { jakarta, dmsans, manrope, worksans, nunitosans, spaceGrotesk } from './fonts'
import BrandConceptsClient from './BrandConceptsClient'

export const metadata = { title: 'Brand Concepts' }

export default function BrandConceptsPage() {
  const fontVars = [
    jakarta.variable,
    dmsans.variable,
    manrope.variable,
    worksans.variable,
    nunitosans.variable,
    spaceGrotesk.variable,
  ].join(' ')

  return (
    <div className={fontVars}>
      <BrandConceptsClient />
    </div>
  )
}
