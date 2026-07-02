"use client";

import { apiGet } from "@/lib/api";
import { useEffect, useState } from "react";
import { TrendingUp, Users, ShoppingBag, DollarSign, Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/api/analytics/overview/");
        setData(res);
      } catch { setData(null); }
      finally { setLoading(false); }
    })();
  }, []);

  const cards = [
    { key: "revenue", label: "Revenue (30d)", value: data?.revenue_30d, icon: DollarSign, color: "emerald" },
    { key: "orders", label: "Orders (30d)", value: data?.orders_30d, icon: ShoppingBag, color: "indigo" },
    { key: "customers", label: "New Customers", value: data?.new_customers, icon: Users, color: "amber" },
    { key: "aov", label: "Avg Order Value", value: data?.avg_order_value, icon: TrendingUp, color: "rose" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Store performance overview</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            {cards.map(({ key, label, value, icon: Icon, color }) => (
              <div key={key} className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">{label}</div>
                  <Icon className={`h-4 w-4 text-${color}-600`} />
                </div>
                <div className="text-2xl font-bold mt-1">{key === "revenue" || key === "aov" ? `৳${(value || 0).toLocaleString()}` : (value || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {data?.top_products?.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold">Top Products</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2 text-right">Units Sold</th>
                    <th className="px-4 py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.top_products.map((p: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2 text-right">{p.units_sold}</td>
                      <td className="px-4 py-2 text-right">৳{p.revenue?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}