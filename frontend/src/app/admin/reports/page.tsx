"use client";

import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { apiGet } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { ErrorState, LoadingState } from "@/components/admin/feedback/states";
import { formatPrice } from "@/lib/utils";

type ReportCard = {
  key: string;
  title: string;
  description: string;
  endpoint: string;
  filename: string;
  tone: string;
};

const REPORTS: ReportCard[] = [
  { key: "sales", title: "Sales Report", description: "Daily, weekly, monthly revenue and order trends", endpoint: "/reports/sales/", filename: "sales.csv", tone: "bg-primary/10 text-primary" },
  { key: "products", title: "Products Inventory", description: "Stock levels, units sold, product status", endpoint: "/reports/inventory/", filename: "products.csv", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  { key: "customers", title: "Customers", description: "Customer list with order counts and total spend", endpoint: "/reports/customers/", filename: "customers.csv", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  { key: "orders", title: "Orders", description: "All orders with status, totals, dates", endpoint: "/admin/orders/", filename: "orders.csv", tone: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
];

export default function ReportsPage() {
  const { allowed, loading: permLoading } = usePermissionState("manage_reports");
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      try {
        const res: any = await apiGet("/analytics/overview/");
        setStats(res);
      } catch (e: any) {
        setStatsError(e?.message || "Failed to load overview");
      } finally {
        setStatsLoading(false);
      }
    })();
  }, [allowed]);

  async function download(r: ReportCard) {
    setDownloading(r.key);
    try {
      const res: any = await apiGet(r.endpoint);
      const data: any[] = Array.isArray(res) ? res : res?.results || [];
      if (!data.length) {
        toast.warn("No data", `${r.title} returned an empty export.`);
        return;
      }
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map((row: any) =>
          headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started", r.filename);
    } catch (e: any) {
      toast.error("Download failed", e?.message || "Please try again");
    } finally {
      setDownloading(null);
    }
  }

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need manage_reports to view this page." />;
  if (statsLoading) return <LoadingState label="Loading reports…" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Download CSV exports from your store</p>
      </header>

      {statsError && (
        <ErrorState title="Couldn't load overview" description={statsError} />
      )}

      {stats && (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Revenue</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              ৳{formatPrice(stats.total_revenue ?? stats.revenue ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Orders</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {(stats.total_orders ?? stats.orders ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Customers</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {(stats.total_customers ?? stats.customers ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Products</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {(stats.total_products ?? 0).toLocaleString()}
            </p>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REPORTS.map((r) => {
          const isBusy = downloading === r.key;
          return (
            <div
              key={r.key}
              className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <div className={`rounded-xl p-3 ${r.tone}`}>
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              </div>
              <button
                onClick={() => download(r)}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {isBusy ? "Preparing…" : "CSV"}
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}