import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Fulcra — The Global Commerce Operations Platform",
    template: "%s | Fulcra",
  },
  description: "Fulcra is the Commerce Operations Platform multichannel sellers run on worldwide. Inventory, orders, procurement, demand forecasting, P&L, and AI — unified across every marketplace, currency, and region. Trusted by sellers replacing Linnworks, Brightpearl, ChannelAdvisor, and Feedonomics.",
  keywords: ["commerce operations platform", "multichannel inventory management", "global ecommerce platform", "order management software", "inventory management software", "multichannel listing software", "Linnworks alternative", "Brightpearl alternative", "ChannelAdvisor alternative", "Feedonomics alternative", "eBay Amazon Shopify inventory sync", "multi-currency ecommerce", "international marketplace management"],
  alternates: {
    canonical: "https://auxio.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["en_GB", "en_AU", "en_CA", "de_DE", "fr_FR", "es_ES"],
    siteName: "Fulcra",
    title: "Fulcra — The Global Commerce Operations Platform",
    description: "Inventory, orders, procurement, forecasting, P&L, and AI for multichannel sellers worldwide. Live in 10 minutes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fulcra — The Global Commerce Operations Platform",
    description: "Inventory, orders, procurement, forecasting, P&L, and AI for multichannel sellers worldwide. Live in 10 minutes.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} ${geistMono.variable}`} style={{ fontFamily: 'var(--font-geist), -apple-system, sans-serif' }}>
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
