import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  async redirects() {
    return Array.from({ length: 8 }, (_, i) => i + 1).map((n) => ({
      source: `/li-w${n}`,
      destination: `/founding-partners?utm_source=linkedin&utm_medium=organic&utm_campaign=launch-wk${n}`,
      permanent: false,
    }))
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
})
