// [lib/ab] — thin PostHog feature-flag wrapper for declarative A/B experiments.
'use client'

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

export type FlagKey =
  | 'hero-headline-v2'
  | 'pricing-page-cta-copy'

/** React hook — returns whether a flag is enabled for the current user. */
export function useFlag(flag: FlagKey, defaultValue: boolean = false): boolean {
  const [enabled, setEnabled] = useState<boolean>(defaultValue)
  useEffect(() => {
    try {
      if (!posthog.__loaded) return
      const check = () => {
        const v = posthog.isFeatureEnabled(flag)
        if (typeof v === 'boolean') setEnabled(v)
      }
      check()
      posthog.onFeatureFlags(check)
    } catch (err) {
      console.error('[lib/ab:useFlag] posthog check failed', err)
    }
  }, [flag])
  return enabled
}

/** Fire a conversion event against PostHog for experiment analysis. */
export function trackConversion(event: string, props?: Record<string, unknown>): void {
  try {
    if (!posthog.__loaded) return
    posthog.capture(event, props)
  } catch (err) {
    console.error('[lib/ab:trackConversion] posthog capture failed', err)
  }
}
