import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "./components/PostHogProvider";
import { CookieConsent } from "./components/CookieConsent";
import { HelpWidget } from "./components/HelpWidget";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
  title: {
    default: "Auxio — UK's Commerce Operations Platform",
    template: "%s | Auxio",
  },
  description: "Auxio is the UK's Commerce Operations Platform for multichannel sellers. Inventory, orders, procurement, demand forecasting, P&L, and AI — all in one place. Trusted by UK sellers switching from Linnworks and Brightpearl.",
  keywords: ["multichannel inventory management UK", "ecommerce operations platform", "order management software UK", "inventory management software", "multichannel listing software", "Linnworks alternative", "Brightpearl alternative", "eBay Amazon Shopify inventory sync"],
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Auxio",
    title: "Auxio — UK's Commerce Operations Platform",
    description: "Inventory, orders, procurement, forecasting, P&L, and AI for UK multichannel sellers. Live in 10 minutes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auxio — UK's Commerce Operations Platform",
    description: "Inventory, orders, procurement, forecasting, P&L, and AI for UK multichannel sellers. Live in 10 minutes.",
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
          {children}
          <HelpWidget />
          <CookieConsent />
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
