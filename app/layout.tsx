import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "./components/PostHogProvider";
import { CookieConsent } from "./components/CookieConsent";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
  title: "Auxio — AI Operating System for eCommerce Sellers",
  description: "Know exactly what you're making. AI that acts for you.",
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
          <CookieConsent />
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
