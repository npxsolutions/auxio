/**
 * Dynamic CMS route — /cms/[slug]
 *
 * Server component. Loads a published marketing page by slug from Supabase and
 * renders its sections via the SectionRegistry. Returns 404 for unknown or
 * draft-only slugs.
 *
 * Phase 0 lives under /cms/ to avoid colliding with existing hardcoded routes.
 * Phase 5 will migrate landing pages into the CMS and (optionally) remap
 * top-level routes via middleware or a renamed route group.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadMarketingPage } from '@/app/lib/cms/loader'
import { renderSections } from '@/app/lib/cms/registry'

type RouteParams = { slug: string }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://palvento.com'

export async function generateMetadata(
  { params }: { params: Promise<RouteParams> }
): Promise<Metadata> {
  const { slug } = await params
  const { page } = await loadMarketingPage(slug)
  if (!page) {
    return { title: 'Not found · Palvento' }
  }
  const canonicalUrl = `${SITE_URL}/cms/${slug}`
  return {
    title: page.title,
    description: page.description ?? undefined,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: page.title,
      description: page.description ?? undefined,
      url: canonicalUrl,
      images: page.og_image_url ? [page.og_image_url] : undefined,
      type: 'website',
    },
    twitter: {
      card: page.og_image_url ? 'summary_large_image' : 'summary',
      title: page.title,
      description: page.description ?? undefined,
      images: page.og_image_url ? [page.og_image_url] : undefined,
    },
  }
}

export default async function MarketingPageRoute(
  { params }: { params: Promise<RouteParams> }
) {
  const { slug } = await params
  const { page, sections, error } = await loadMarketingPage(slug)

  if (error === 'not_found' || !page || !sections) {
    notFound()
  }

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description ?? undefined,
    url: `${SITE_URL}/cms/${slug}`,
    datePublished: page.published_at ?? undefined,
    dateModified: page.updated_at,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Palvento',
      url: SITE_URL,
    },
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      {renderSections(sections)}
    </main>
  )
}
