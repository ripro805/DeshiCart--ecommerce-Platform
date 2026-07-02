"use client";

import { apiGet } from "@/lib/api";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Mouse, ShoppingCart, DollarSign, Users } from "lucide-react";

export default function MarketingAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, c]: any[] = await Promise.all([
          apiGet("/api/marketing/analytics/stats/").catch(() => null),
          apiGet("/api/marketing/campaigns/").catch(() => []),
        ]);
        setStats(s);
        setCampaigns(Array.isArray(c) ? c : c?.results || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  const cards = [
    { label: "Total Clicks", value: stats?.total_clicks ?? "—", icon: Mouse, color: "text-indigo-600 bg-indigo-50" },
    { label: "Conversions", value: stats?.conversions ?? "—", icon: ShoppingCart, color: "text-emerald-600 bg-emerald-50" },
    { label: "Revenue", value: stats?.revenue ?? "—", icon: DollarSign, color: "text-amber-600 bg-amber-50" },
    { label: "Subscribers", value: stats?.subscribers ?? "—", icon: Users, color: "text-fuchsia-600 bg-fuchsia-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marketing Analytics</h1>
        <p className="text-sm text-slate-500">Campaign and channel performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-lg border border-slate-200 p-5">
            <div className={`inline-flex h-9 w-9 rounded-lg ${c.color} items-center justify-center mb-3`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Campaign Performance</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-slate-500">No campaigns yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Campaign</th>
                <th className="px-3 py-2 text-right">Impressions</th>
                <th className="px-3 py-2 text-right">Clicks</th>
                <th className="px-3 py-2 text-right">CTR</th>
                <th className="px-3 py-2 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => {
                const ctr = c.impressions ? ((c.clicks || 0) / c.impressions * 100).toFixed(2) : "—";
                return (
                  <tr key={c.id}>
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{c.impressions?.toLocaleString() || "—"}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{c.clicks?.toLocaleString() || "—"}</td>
                    <td className="px-3 py-2 text-right font-medium">{ctr}{ctr !== "—" ? "%" : ""}</td>
                    <td className="px-3 py-2 text-right">{c.clicks > c.impressions * 0.05 ? <TrendingUp className="h-4 w-4 inline text-emerald-500" /> : <TrendingDown className="h-4 w-4 inline text-rose-500" />}</td>
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