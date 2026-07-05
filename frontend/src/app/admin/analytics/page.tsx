"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";
import { apiGet } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { ErrorState, LoadingState } from "@/components/admin/feedback/states";

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { allowed, loading: permLoading } = usePermissionState("manage_analytics");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res: any = await apiGet("/analytics/overview/");
        setData(res);
      } catch (e: any) {
        setLoadError(e?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed]);

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need manage_analytics to view analytics." />;
  if (loading) return <LoadingState label="Loading analytics…" />;
  if (loadError) return <ErrorState title="Couldn't load analytics" description={loadError} />;

  const cards = [
    { key: "revenue",    label: "Revenue (30d)",    value: `৳${formatPrice(data?.revenue_30d ?? 0)}`, icon: DollarSign,  tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
    { key: "orders",     label: "Orders (30d)",     value: (data?.orders_30d ?? 0).toLocaleString(),  icon: ShoppingBag, tone: "bg-primary/10 text-primary" },
    { key: "customers",  label: "New Customers",    value: (data?.new_customers ?? 0).toLocaleString(), icon: Users,     tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
    { key: "aov",        label: "Avg Order Value",  value: `৳${formatPrice(data?.avg_order_value ?? 0)}`, icon: TrendingUp, tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Store performance overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Kpi key={c.key} label={c.label} value={c.value} icon={c.icon} tone={c.tone} />
        ))}
      </div>

      {data?.top_products?.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <header className="border-b border-border p-5">
            <h2 className="text-base font-semibold text-foreground">Top Products</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Best sellers by units sold</p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 text-right font-medium">Units Sold</th>
                  <th className="px-5 py-3 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.top_products.map((p: any, i: number) => (
                  <tr key={i} className="transition hover:bg-muted/40">
                    <td className="px-5 py-3 text-foreground">{p.name}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-foreground">{(p.units_sold ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-foreground">৳{formatPrice(p.revenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}