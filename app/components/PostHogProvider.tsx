'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function PostHogPageView() {
  const pathname  = usePathname()
  const sp        = useSearchParams()
  const ph        = usePostHog()

  useEffect(() => {
    if (!pathname) return
    let url = window.origin + pathname
    const qs = sp?.toString()
    if (qs) url += '?' + qs
    ph.capture('$pageview', { $current_url: url })
  }, [pathname, sp, ph])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key  = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'
    if (!key) return

    posthog.init(key, {
      api_host:               host,
      person_profiles:        'identified_only',
      capture_pageview:       false, // manual via PostHogPageView
      capture_pageleave:      true,
    })
  }, [])

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return <>{children}</>

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}
