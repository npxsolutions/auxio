import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "./components/PostHogProvider";
import { CookieConsent } from "./components/CookieConsent";
import { HelpWidget } from "./components/HelpWidget";
import { NpsPrompt } from "./components/NpsPrompt";
import { TrialBanner } from "./components/TrialBanner";
import { PageFeedbackMount } from "./components/PageFeedbackMount";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-mono' });
// Instrument Serif is the Palvento editorial display face. Loaded globally so
// every page inherits it via `var(--font-display)` — eliminates the per-page
// next/font import boilerplate and fixes the /enterprise fallback-to-Times bug.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: {
    default: "Palvento — The Global Commerce Operations Platform",
    template: "%s | Palvento",
  },
  description: "Palvento is the Commerce Operations Platform multichannel sellers run on worldwide. Inventory, orders, procurement, demand forecasting, P&L, and AI — unified across every marketplace, currency, and region. Trusted by sellers replacing Linnworks, Brightpearl, ChannelAdvisor, and Feedonomics.",
  keywords: ["commerce operations platform", "multichannel inventory management", "global ecommerce platform", "order management software", "inventory management software", "multichannel listing software", "Linnworks alternative", "Brightpearl alternative", "ChannelAdvisor alternative", "Feedonomics alternative", "eBay Amazon Shopify inventory sync", "multi-currency ecommerce", "international marketplace management"],
  alternates: {
    canonical: "https://palvento.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["en_GB", "en_AU", "en_CA", "de_DE", "fr_FR", "es_ES"],
    siteName: "Palvento",
    title: "Palvento — The Global Commerce Operations Platform",
    description: "Inventory, orders, procurement, forecasting, P&L, and AI for multichannel sellers worldwide. Live in 10 minutes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Palvento — The Global Commerce Operations Platform",
    description: "Inventory, orders, procurement, forecasting, P&L, and AI for multichannel sellers worldwide. Live in 10 minutes.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Palvento",
  url: "https://palvento.com",
  logo: "https://palvento.com/logo.svg",
  description: "Commerce Operations Platform for multichannel sellers — inventory, orders, procurement, forecasting, P&L, and AI unified across every marketplace, currency, and region.",
  sameAs: [
    "https://www.linkedin.com/company/palvento",
    "https://twitter.com/palventohq",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} ${geistMono.variable} ${instrumentSerif.variable}`} style={{ fontFamily: 'var(--font-geist), -apple-system, sans-serif' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <PostHogProvider>
          <TrialBanner />
          {children}
          <PageFeedbackMount />
          <HelpWidget />
          <NpsPrompt />
          <CookieConsent />
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
