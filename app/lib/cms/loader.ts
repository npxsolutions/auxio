/**
 * CMS loader — server-side fetch of a published marketing page + its sections.
 *
 * Uses the Supabase server client (cookie-based auth, works under RLS as anon
 * for public readers). RLS ensures only published pages + their sections are
 * returned; no server-side filtering needed here.
 */

import { createClient } from '../supabase-server'
import type { MarketingPageRow, RawSectionRow } from './types'

export type LoadResult =
  | { page: MarketingPageRow; sections: RawSectionRow[]; error: null }
  | { page: null; sections: null; error: 'not_found' | 'db_error' }

export async function loadMarketingPage(slug: string): Promise<LoadResult> {
  const supabase = await createClient()

  const { data: pageRow, error: pageErr } = await supabase
    .from('marketing_pages')
    .select('id, slug, title, description, og_image_url, status, published_at, created_at, updated_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle<MarketingPageRow>()

  if (pageErr) {
    // eslint-disable-next-line no-console
    console.error('[cms.loader] page fetch error', pageErr)
    return { page: null, sections: null, error: 'db_error' }
  }

  if (!pageRow) {
    return { page: null, sections: null, error: 'not_found' }
  }

  const { data: sectionRows, error: sectErr } = await supabase
    .from('marketing_sections')
    .select('id, page_id, type, position, props')
    .eq('page_id', pageRow.id)
    .order('position', { ascending: true })

  if (sectErr) {
    // eslint-disable-next-line no-console
    console.error('[cms.loader] sections fetch error', sectErr)
    return { page: null, sections: null, error: 'db_error' }
  }

  return {
    page: pageRow,
    sections: (sectionRows ?? []) as unknown as RawSectionRow[],
    error: null,
  }
}
