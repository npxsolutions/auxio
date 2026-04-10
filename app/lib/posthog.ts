import { PostHog } from 'posthog-node'

// Server-side PostHog client — use for tracking events in API routes / server components
export function getPostHogClient() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null
  return new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
}
