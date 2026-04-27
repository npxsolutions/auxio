/**
 * Dynamic sitemap — static marketing routes plus CMS-driven pages from
 * `marketing_pages` (Phase 0 CMS). Published pages only.
 */
import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600 // 1h cache

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://palvento.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                           lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/features`,             lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/integrations`,         lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/integrations/ebay`,    lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/integrations/amazon`,  lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/integrations/shopify`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/integrations/onbuy`,   lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/pricing`,              lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/blog`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/vs/baselinker`,        lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/vs/linnworks`,         lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/about`,                lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`,              lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`,              lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms`,                lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // CMS-driven marketing pages
  let cmsEntries: MetadataRoute.Sitemap = []
  try {
    const { data } = await getSupabase()
      .from('marketing_pages')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    cmsEntries = (data ?? []).map((p) => ({
      url: `${BASE}/cms/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.published_at ?? Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (err) {
    console.error('[sitemap] CMS fetch failed', err)
  }

  return [...staticRoutes, ...cmsEntries]
}
