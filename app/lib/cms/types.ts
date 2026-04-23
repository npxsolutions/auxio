/**
 * Marketing CMS — section types.
 *
 * The TypeScript types here are the source of truth for what section shapes are
 * allowed. The SectionRegistry (registry.tsx) maps each `type` string to the
 * component that renders it. The Supabase `marketing_section_types` table is a
 * denormalised mirror of this registry for admin-UI consumption in Phase 5.
 *
 * To add a new section type:
 *   1. Add a variant to the `Section` union below with its props shape.
 *   2. Implement the component in `./sections/{type}.tsx`.
 *   3. Register it in `./registry.tsx`.
 *   4. Insert a row into `marketing_section_types` via a migration.
 */

export type HeroSection = {
  type: 'hero'
  props: {
    /** Small uppercase label above the headline. */
    eyebrow?: string
    /** Primary display headline. */
    headline: string
    /** Sub-headline paragraph. */
    subhead?: string
    /** Primary CTA button label + href. */
    ctaLabel?: string
    ctaHref?: string
    /** Optional secondary CTA. */
    secondaryCtaLabel?: string
    secondaryCtaHref?: string
    /** Layout variant. */
    variant?: 'default' | 'centered'
  }
}

export type FeatureGridSection = {
  type: 'feature_grid'
  props: {
    eyebrow?: string
    title?: string
    /** 2, 3, or 4 columns. Defaults to 2. */
    columns?: 2 | 3 | 4
    features: Array<{
      title: string
      description?: string
      bullets?: string[]
    }>
  }
}

export type CtaSection = {
  type: 'cta'
  props: {
    title: string
    description?: string
    primaryLabel: string
    primaryHref: string
    secondaryLabel?: string
    secondaryHref?: string
  }
}

/** Discriminated union of every section kind the registry knows how to render. */
export type Section = HeroSection | FeatureGridSection | CtaSection

/** The keys of the Section union — i.e. allowed values of `section.type`. */
export type SectionType = Section['type']

/** Row shape returned from `marketing_sections` before it's narrowed. */
export type RawSectionRow = {
  id: string
  page_id: string
  type: string
  position: number
  props: Record<string, unknown>
}

/** Row shape returned from `marketing_pages`. */
export type MarketingPageRow = {
  id: string
  slug: string
  title: string
  description: string | null
  og_image_url: string | null
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  updated_at: string
}

/** A page plus its ordered sections, ready to render. */
export type MarketingPageWithSections = MarketingPageRow & {
  sections: Section[]
}
