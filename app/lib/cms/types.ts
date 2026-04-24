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

export type StepFlowSection = {
  type: 'step_flow'
  props: {
    eyebrow?: string
    title?: string
    subtitle?: string
    steps: Array<{ label: string; description?: string; duration?: string }>
  }
}

export type IntegrationGridSection = {
  type: 'integration_grid'
  props: {
    eyebrow?: string
    title?: string
    columns?: 3 | 4 | 5 | 6
    /** Each integration: name + 1-2 bullets, optionally a status badge. */
    integrations: Array<{
      name: string
      description?: string
      status?: 'live' | 'beta' | 'coming_soon'
    }>
  }
}

export type TestimonialSection = {
  type: 'testimonial'
  props: {
    quote: string
    /** Name of the author. */
    author: string
    /** Title + company. */
    role?: string
    /** Optional company logo alt. */
    company?: string
  }
}

export type PricingTableSection = {
  type: 'pricing_table'
  props: {
    eyebrow?: string
    title?: string
    tiers: Array<{
      name: string
      price: string       // already-formatted, e.g. '$79' or 'Custom'
      cadence?: string    // '/month', '/year', 'one-time'
      features: string[]
      ctaLabel: string
      ctaHref: string
      highlight?: boolean
    }>
  }
}

export type FaqSection = {
  type: 'faq'
  props: {
    eyebrow?: string
    title?: string
    items: Array<{ question: string; answer: string }>
  }
}

export type LogoWallSection = {
  type: 'logo_wall'
  props: {
    eyebrow?: string
    /** Each logo: 1-3 word name, no image needed for this MVP variant. */
    logos: Array<{ name: string }>
  }
}

/** Discriminated union of every section kind the registry knows how to render. */
export type Section =
  | HeroSection
  | FeatureGridSection
  | CtaSection
  | StepFlowSection
  | IntegrationGridSection
  | TestimonialSection
  | PricingTableSection
  | FaqSection
  | LogoWallSection

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
