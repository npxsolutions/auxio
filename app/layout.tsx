import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

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
      <body className={`${geist.className}`}>
        {children}
      </body>
    </html>
  );
}
