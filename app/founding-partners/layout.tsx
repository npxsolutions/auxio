import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://palvento.com'
const TITLE = 'Founding partners — 10 spots, 40% off for life'
const DESC = 'The first 10 multichannel sellers shape the roadmap and lock founding pricing for the life of their subscription. Direct Slack with the founding team. No contract.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/founding-partners` },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: `${SITE_URL}/founding-partners`,
    type: 'website',
    siteName: 'Palvento',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESC,
  },
}

export default function FoundingPartnersLayout({ children }: { children: React.ReactNode }) {
  return children
}
