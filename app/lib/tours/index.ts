'use client'

/**
 * Product tour registry + hook.
 *
 * Uses driver.js (lazy-imported so SSR stays clean). Each tour is keyed by
 * TourId and targeted via `data-tour="<slug>"` attributes rendered on the
 * relevant pages.
 *
 * Per-user completion is persisted to localStorage under:
 *   tour-completed-{id}-{userId}
 *
 * The hook auto-fires the tour once per user (after a 600ms DOM-settle
 * delay) and returns { start, reset } so callers can wire a "?" menu.
 */

import { useCallback, useEffect, useRef } from 'react'

export type TourSide = 'left' | 'right' | 'top' | 'bottom'

export interface TourStep {
  element: string
  popover: {
    title: string
    description: string
    side?: TourSide
  }
}

export type TourId = 'dashboard' | 'listings' | 'channels' | 'repricing' | 'profit'

// Using data-tour attribute selectors — no class-name collisions, stable under
// style refactors.
export const TOURS: Record<TourId, TourStep[]> = {
  dashboard: [
    {
      element: '[data-tour="dashboard-kpis"]',
      popover: {
        title: 'Today at a glance',
        description:
          'Your live KPIs — revenue, profit, orders, margin — refreshed every time a channel syncs. This is the first number you check every morning.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="dashboard-orders"]',
      popover: {
        title: 'Live order feed',
        description:
          'Orders flow in as each marketplace pings us. Click any row to see the full profit breakdown for that sale.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="dashboard-alerts"]',
      popover: {
        title: 'Margin alerts',
        description:
          'When a listing dips below your floor or a channel starts haemorrhaging cash, it surfaces here — not buried in a weekly email.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="dashboard-connect"]',
      popover: {
        title: 'Connect another channel',
        description:
          'More channels, more accurate net margin. eBay, Amazon, Shopify, Etsy, Walmart — link them once, Palvento keeps them synced.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="dashboard-health"]',
      popover: {
        title: 'Anything broken?',
        description:
          'Sync errors and failed channel calls land here first. Fix them before they cost you a Buy Box.',
        side: 'top',
      },
    },
  ],
  listings: [
    {
      element: '[data-tour="listings-filters"]',
      popover: {
        title: 'Filter chips',
        description:
          'Slice your catalogue by status, channel, low stock, low margin. Combine chips to find exactly what needs work.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="listings-columns"]',
      popover: {
        title: 'Column picker',
        description:
          'Show only the columns that matter to you — velocity, days-of-cover, competitor price. The view is saved per user.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="listings-bulk"]',
      popover: {
        title: 'Bulk actions',
        description:
          'Select rows and push price, stock, or channel changes to dozens of listings at once instead of clicking one by one.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="listings-cost"]',
      popover: {
        title: 'Add cost prices for true margin',
        description:
          'Without cost prices, margin is a guess. Add them in bulk via CSV import, and every profit number in Palvento becomes real.',
        side: 'bottom',
      },
    },
  ],
  channels: [
    {
      element: '[data-tour="channels-live"]',
      popover: {
        title: 'Live channels',
        description:
          'Every marketplace currently feeding orders, stock and fees into Palvento. Test or sync any one on demand.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="channels-connect"]',
      popover: {
        title: 'Pick your next marketplace',
        description:
          'Each additional channel compounds your data — better competitor pricing, truer blended margin, a sharper forecast.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="channels-soon"]',
      popover: {
        title: 'Coming soon',
        description:
          'Integrations in active build. Vote on priority from the help menu — the loudest customer wins.',
        side: 'top',
      },
    },
  ],
  repricing: [
    {
      element: '[data-tour="repricing-rules"]',
      popover: {
        title: 'Active rules',
        description:
          'Each rule is a small strategy — beat the lowest, match Buy Box, timed reduction. Toggle on or off any time.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="repricing-form"]',
      popover: {
        title: 'Floor + ceiling',
        description:
          'Hard floor stops repricing from eating your margin. Ceiling stops it from torching your Buy Box. Set both every time.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="repricing-log"]',
      popover: {
        title: 'Activity log',
        description:
          'Every price change, every rule, with before/after. Use this to audit aggressive rules before they run wild.',
        side: 'top',
      },
    },
  ],
  profit: [
    {
      element: '[data-tour="profit-net"]',
      popover: {
        title: 'True net margin',
        description:
          'Revenue minus COGS minus fees minus ad spend — the number on your bank statement, not the one on your invoice.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="profit-breakdown"]',
      popover: {
        title: 'Per-channel breakdown',
        description:
          'See which marketplace is actually paying rent. One channel almost always subsidises the rest — find yours.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="profit-flags"]',
      popover: {
        title: 'Cost prices missing?',
        description:
          'Any SKU without a cost price shows up here. Fill these in and your net profit stops being a rough estimate.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="profit-export"]',
      popover: {
        title: 'Export this view',
        description:
          'Pull the full P&L as CSV for your accountant, your board deck, or your future self at tax time.',
        side: 'left',
      },
    },
  ],
}

const storageKey = (id: TourId, userId: string) => `tour-completed-${id}-${userId}`

/** Lazy-imported driver instance so SSR bundles stay clean. */
async function loadDriver() {
  const mod = await import('driver.js')
  // Driver.js exposes a named export `driver`.
  return mod.driver
}

/**
 * Launch a tour for the given id. Resolves once the tour has ended (finished
 * or dismissed) so callers can await the lifecycle.
 */
export async function runTour(id: TourId, onComplete?: () => void) {
  try {
    const driver = await loadDriver()
    const steps = TOURS[id]
    if (!steps?.length) return
    const instance = driver({
      showProgress: true,
      allowClose: true,
      overlayOpacity: 0.55,
      stagePadding: 4,
      stageRadius: 8,
      steps: steps.map(s => ({
        element: s.element,
        popover: {
          title: s.popover.title,
          description: s.popover.description,
          side: s.popover.side,
        },
      })),
      onDestroyed: () => {
        try { onComplete?.() } catch (e) { console.error(`[tour:${id}] onComplete failed`, e) }
      },
    })
    instance.drive()
  } catch (err) {
    console.error(`[tour:${id}] failed to launch`, err)
  }
}

export interface UseTourResult {
  /** Manually start the tour (used by the "?" menu). */
  start: () => void
  /** Forget completion so the auto-fire can trigger again. */
  reset: () => void
  /** Reset every tour id on this browser for this user. */
  resetAll: () => void
}

/**
 * React hook: auto-fire a tour once per user on mount.
 *
 * @param id       TourId
 * @param userId   stable id (null = guest / not ready → no-op)
 * @param options  { autoStart?: boolean } — disable auto-fire for pages that
 *                 want to gate the tour behind a "first-session" check
 */
export function useTour(
  id: TourId,
  userId: string | null | undefined,
  options: { autoStart?: boolean } = {},
): UseTourResult {
  const { autoStart = true } = options
  const firedRef = useRef(false)

  const markComplete = useCallback(() => {
    if (!userId || typeof window === 'undefined') return
    try { window.localStorage.setItem(storageKey(id, userId), '1') }
    catch (e) { console.error(`[tour:${id}] could not persist completion`, e) }
  }, [id, userId])

  const start = useCallback(() => {
    runTour(id, markComplete)
  }, [id, markComplete])

  const reset = useCallback(() => {
    if (!userId || typeof window === 'undefined') return
    try { window.localStorage.removeItem(storageKey(id, userId)) }
    catch (e) { console.error(`[tour:${id}] could not reset`, e) }
  }, [id, userId])

  const resetAll = useCallback(() => {
    if (!userId || typeof window === 'undefined') return
    const ids: TourId[] = ['dashboard', 'listings', 'channels', 'repricing', 'profit']
    ids.forEach(t => {
      try { window.localStorage.removeItem(storageKey(t, userId)) }
      catch (e) { console.error(`[tour:${t}] could not reset`, e) }
    })
  }, [userId])

  useEffect(() => {
    if (!autoStart) return
    if (!userId || typeof window === 'undefined') return
    if (firedRef.current) return

    let completed = false
    try { completed = window.localStorage.getItem(storageKey(id, userId)) === '1' }
    catch { /* ignore — private mode, etc. */ }
    if (completed) return

    firedRef.current = true
    const timer = window.setTimeout(() => {
      runTour(id, markComplete)
    }, 600)
    return () => window.clearTimeout(timer)
  }, [autoStart, id, userId, markComplete])

  return { start, reset, resetAll }
}
