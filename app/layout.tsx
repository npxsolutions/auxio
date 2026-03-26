import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auxio — AI Operating System for eBay Sellers",
  description: "Know exactly what you're making. AI that acts for you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-950 text-white`}>
        <div className="flex min-h-screen">

          {/* Sidebar */}
          <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full">
            <div className="p-6 border-b border-gray-800">
              <h1 className="text-xl font-bold text-white">Auxio</h1>
              <p className="text-gray-500 text-xs mt-1">eBay AI OS</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {[
                { icon: "📊", label: "Dashboard", active: true },
                { icon: "📦", label: "Inventory" },
                { icon: "🏷️", label: "Listings" },
                { icon: "📈", label: "Analytics" },
                { icon: "🤖", label: "AI Agent" },
                { icon: "💬", label: "AI Chat" },
                { icon: "⚙️", label: "Settings" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${
                    item.active
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-800">
              <div className="bg-blue-950 rounded-lg p-3">
                <p className="text-blue-400 text-xs font-medium">Growth Plan</p>
                <p className="text-gray-400 text-xs mt-1">AI features active</p>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="ml-56 flex-1 p-8">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}