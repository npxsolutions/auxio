"use client";
import { useEffect, useState } from "react";
import { getOrders, Order } from "../lib/getOrders";
import { calculateProfit } from "../lib/calculateProfit";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getOrders("demo-user");
      setOrders(data);
      setLoading(false);
    }
    load();
  }, []);

  const stats = orders.reduce(
    (acc, order) => {
      const p = calculateProfit({
        sale_price: order.sale_price,
        supplier_cost: order.supplier_cost,
        shipping_cost: order.shipping_cost,
      });
      acc.totalSales += order.sale_price;
      acc.totalProfit += p.profit;
      acc.totalOrders += 1;
      acc.marginSum += p.margin_pct;
      return acc;
    },
    { totalSales: 0, totalProfit: 0, totalOrders: 0, marginSum: 0 }
  );

  const avgMargin =
    stats.totalOrders > 0
      ? Math.round((stats.marginSum / stats.totalOrders) * 10) / 10
      : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-gray-400 text-sm mt-1">True profit per order after all fees</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Sales", value: `£${stats.totalSales.toFixed(2)}` },
          { label: "True Profit", value: `£${stats.totalProfit.toFixed(2)}` },
          { label: "Total Orders", value: stats.totalOrders.toString() },
          { label: "Avg Margin", value: `${avgMargin}%` },
        ].map((s, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h2 className="font-semibold">All Orders</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No orders yet. Connect your eBay store to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left p-4">Product</th>
                <th className="text-right p-4">Sale Price</th>
                <th className="text-right p-4">eBay Fee</th>
                <th className="text-right p-4">Shipping</th>
                <th className="text-right p-4">Cost</th>
                <th className="text-right p-4">Profit</th>
                <th className="text-right p-4">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {orders.map((order) => {
                const p = calculateProfit({
                  sale_price: order.sale_price,
                  supplier_cost: order.supplier_cost,
                  shipping_cost: order.shipping_cost,
                });
                return (
                  <tr key={order.id} className="hover:bg-gray-800 transition-colors">
                    <td className="p-4 text-white">{order.title}</td>
                    <td className="p-4 text-right text-gray-300">£{order.sale_price.toFixed(2)}</td>
                    <td className="p-4 text-right text-gray-300">£{p.ebay_fee.toFixed(2)}</td>
                    <td className="p-4 text-right text-gray-300">£{p.shipping_cost.toFixed(2)}</td>
                    <td className="p-4 text-right text-gray-300">£{order.supplier_cost.toFixed(2)}</td>
                    <td className="p-4 text-right font-medium">
                      £{p.profit.toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        p.margin_label === "good"
                          ? "bg-green-900 text-green-400"
                          : p.margin_label === "warning"
                          ? "bg-yellow-900 text-yellow-400"
                          : "bg-red-900 text-red-400"
                      }`}>
                        {p.margin_pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}