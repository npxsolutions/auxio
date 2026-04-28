import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://palvento.com'
const TITLE = 'For Shopify sellers — Per-channel P&L, real fees reconciled'
const DESC = 'Shopify-led sellers running 2-4 marketplaces: stop estimating. Real reconciled fees from eBay, Shopify and Etsy live today. 10 founding partners, 40% off for life.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/for-shopify-sellers` },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: `${SITE_URL}/for-shopify-sellers`,
    type: 'website',
    siteName: 'Palvento',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESC,
  },
}

export default function ForShopifySellersLayout({ children }: { children: React.ReactNode }) {
  return children
}
