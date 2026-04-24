/**
 * Marketing CMS — SectionRegistry.
 *
 * Maps a section `type` string to the React component that renders it.
 *
 * `renderSection` is the single entry point used by the dynamic marketing route.
 * It narrows an untyped DB row into a typed Section and dispatches to the right
 * component, logging (server-side) when a page references an unknown type so the
 * page can still render partially instead of crashing.
 */

import type { ReactElement } from 'react'
import type { Section, SectionType, RawSectionRow } from './types'
import { HeroSection } from './sections/hero'
import { FeatureGridSection } from './sections/feature-grid'
import { CtaSection } from './sections/cta'
import { StepFlowSection } from './sections/step-flow'
import { IntegrationGridSection } from './sections/integration-grid'
import { TestimonialSection } from './sections/testimonial'
import { PricingTableSection } from './sections/pricing-table'
import { FaqSection } from './sections/faq'
import { LogoWallSection } from './sections/logo-wall'

type SectionComponent<T extends Section> = (props: T['props']) => ReactElement

/**
 * Map of section type string → component.
 * Keep this in sync with the Section discriminated union in `types.ts` and with
 * the `marketing_section_types` seed rows in the migration.
 */
const SectionRegistry: {
  [K in SectionType]: SectionComponent<Extract<Section, { type: K }>>
} = {
  hero: HeroSection,
  feature_grid: FeatureGridSection,
  cta: CtaSection,
  step_flow: StepFlowSection,
  integration_grid: IntegrationGridSection,
  testimonial: TestimonialSection,
  pricing_table: PricingTableSection,
  faq: FaqSection,
  logo_wall: LogoWallSection,
}

/**
 * Type guard: narrows a raw DB row into a typed Section.
 * Returns null for unknown types so the caller can skip + log.
 */
function narrowSection(row: RawSectionRow): Section | null {
  if (row.type in SectionRegistry) {
    return { type: row.type as SectionType, props: row.props as Section['props'] } as Section
  }
  return null
}

/**
 * Render a single section row. Returns null for unknown types (caller can log).
 * Uses section id as React key if provided.
 */
export function renderSection(row: RawSectionRow): ReactElement | null {
  const section = narrowSection(row)
  if (!section) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[cms] Unknown section type "${row.type}" on page ${row.page_id} — skipping`)
    }
    return null
  }
  const Component = SectionRegistry[section.type] as SectionComponent<Section>
  return <Component key={row.id} {...(section.props as Section['props'])} />
}

/** Render an ordered list of sections. */
export function renderSections(rows: RawSectionRow[]): ReactElement[] {
  return rows
    .sort((a, b) => a.position - b.position)
    .map(renderSection)
    .filter((el): el is ReactElement => el !== null)
}

export { SectionRegistry }
