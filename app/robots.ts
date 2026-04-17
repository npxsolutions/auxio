import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/api/', '/onboarding', '/billing', '/settings'],
    },
    sitemap: 'https://palvento.io/sitemap.xml',
  }
}
