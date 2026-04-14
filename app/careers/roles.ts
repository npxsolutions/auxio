// [careers/roles] — source of truth for open roles. Edit comp bands inline.
export type Role = {
  slug: 'founding-engineer' | 'head-of-growth' | 'founding-designer'
  title: string
  team: string
  location: string
  compBand: string // equity % + salary band — placeholders for user to fill
  summary: string
}

export const ROLES: Role[] = [
  {
    slug: 'founding-engineer',
    title: 'Founding Engineer',
    team: 'Engineering',
    location: 'Remote — global',
    compBand: '0.5–2.0% equity · $[SALARY_MIN]–$[SALARY_MAX]',
    summary: 'Full-stack across Next.js, Supabase, and Stripe. Ship the product spine end-to-end.',
  },
  {
    slug: 'head-of-growth',
    title: 'Head of Growth',
    team: 'Go-to-market',
    location: 'Remote — global',
    compBand: '0.5–1.5% equity · $[SALARY_MIN]–$[SALARY_MAX]',
    summary: 'Commerce-ops native. Own the entire GTM stack — content, SEO, paid, partnerships, onboarding.',
  },
  {
    slug: 'founding-designer',
    title: 'Founding Designer',
    team: 'Design',
    location: 'Remote — global',
    compBand: '0.5–1.5% equity · $[SALARY_MIN]–$[SALARY_MAX]',
    summary: 'End-to-end craft across product, marketing, and brand. Set the taste bar.',
  },
]

export const roleBySlug = (slug: string) => ROLES.find(r => r.slug === slug)
