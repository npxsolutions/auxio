"use client";
import { useState, useEffect } from "react";

const mockStoreData = {
  topProducts: [
    { sku: "LAT001", name: "Lattafa Yara EDP 100ml", price: 34.99, cost: 14.20, margin: 24.1, stock: 3, sold7d: 28 },
    { sku: "ARM001", name: "Armaf Club de Nuit 105ml", price: 47.99, cost: 19.21, margin: 20.5, stock: 12, sold7d: 19 },
    { sku: "JPG001", name: "Jean Paul Gaultier Scandal 80ml", price: 58.99, cost: 28.40, margin: 12.2, stock: 8, sold7d: 11 },
    { sku: "POL001", name: "Police Contemporary Cherry 100ml", price: 38.99, cost: 15.55, margin: 20.6, stock: 24, sold7d: 15 },
    { sku: "LAN001", name: "Lanvin Sweet Jasmine 50ml", price: 47.99, cost: 19.21, margin: 8.6, stock: 6, sold7d: 4 },
  ],
  totalSales: 4821.50,
  totalProfit: 1102.40,
  totalOrders: 127,
  avgMargin: 22.8,
};

export default function Home() {
  const [insights, setInsights] = useState([
    { icon: "🤖", title: "Loading AI insights...", body: "Claude is analysing your store data.", action: "Wait" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeData: mockStoreData }),
        });
        const data = await res.json();
        if (data.insights) setInsights(data.insights);
      } catch (e) {
        setInsights([{ icon: "⚠️", title: "Error", body: "Could not load insights.", action: "Retry" }]);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm">Good morning — here is your store today</p>
        </div>
        <div className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">Growth Plan</div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Sales", value: "£4,821.50", change: "Up 12% this week", color: "text-green-400" },
          { label: "True Profit", value: "£1,102.40", change: "Up 8% this week", color: "text-green-400" },
          { label: "Orders", value: "127", change: "22 today", color: "text-green-400" },
          { label: "Avg Margin", value: "22.8%", change: "Down 1.2% vs last week", color: "text-yellow-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
            <p className={`text-sm mt-1 ${stat.color}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">

        {/* Best Sellers */}
        <div className="col-span-2 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="font-semibold text-white mb-4">Best Sellers - True Profit</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left pb-3">Product</th>
                <th className="text-right pb-3">Price</th>
                <th className="text-right pb-3">Cost</th>
                <th className="text-right pb-3">Stock</th>
                <th className="text-right pb-3">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {mockStoreData.topProducts.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 text-white">{item.name}</td>
                  <td className="py-3 text-right text-gray-300">£{item.price}</td>
                  <td className="py-3 text-right text-gray-300">£{item.cost}</td>
                  <td className="py-3 text-right text-gray-300">{item.stock}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      item.margin >= 20 ? "bg-green-900 text-green-400" :
                      item.margin >= 10 ? "bg-yellow-900 text-yellow-400" :
                      "bg-red-900 text-red-400"
                    }`}>
                      {item.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Insights */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-white">AI Insights</h2>
            {loading && <span className="text-xs text-blue-400 animate-pulse">Claude thinking...</span>}
          </div>
          <div className="space-y-4">
            {insights.map((insight, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>{insight.icon}</span>
                  <span className="font-medium text-sm">{insight.title}</span>
                </div>
                <p className="text-gray-400 text-xs mb-3">{insight.body}</p>
                <button className="text-blue-400 text-xs font-medium hover:text-blue-300">
                  {insight.action} →
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
