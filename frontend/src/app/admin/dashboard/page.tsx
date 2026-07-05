"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DollarSign, ShoppingCart, Users, TrendingUp, Package, AlertTriangle,
  ArrowUpRight, RefreshCcw, Loader2, Sparkles,
  CheckCircle2, Clock, Truck, XCircle, Wallet, Receipt, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiGet } from "@/lib/api";
import { cn, formatPrice, formatDate } from "@/lib/utils";

type Overview = {
  days: number;
  revenue: number;
  revenue_30d: number;
  revenue_7d: number;
  orders: number;
  orders_30d: number;
  orders_7d: number;
  avg_order_value: number;
  new_customers: number;
  total_customers: number;
  low_stock_count: number;
  out_of_stock_count: number;
  by_status?: Record<string, number>;
  orders_by_status: Record<string, number>;
  low_stock_products: Array<{ id: number; name: string; sku: string; stock: number; image_url?: string; image_external_url?: string; image?: string; low_stock_threshold?: number }>;
  top_products?: Array<{ product_id: number; name: string; units_sold: number; revenue: number }>;
  top_categories?: Array<{ id: number; name: string; count?: number; revenue?: number }>;
  recent_orders?: Array<any>;
  daily?: Array<{ date: string; revenue: number; orders: number }>;
};

const RANGES = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

function statusColor(s: string): string {
  const k = (s || "").toUpperCase();
  if (k.includes("CANCEL") || k.includes("REJECT") || k === "REFUNDED") return "bg-rose-100 text-rose-700 ring-rose-200";
  if (k.includes("DELIVER") || k === "COMPLETED") return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (k.includes("SHIP") || k.includes("TRANSIT")) return "bg-violet-100 text-violet-700 ring-violet-200";
  if (k.includes("PAID") || k === "PROCESSING") return "bg-indigo-100 text-indigo-700 ring-indigo-200";
  return "bg-amber-100 text-amber-700 ring-amber-200";
}

function statusIcon(s: string) {
  const k = (s || "").toUpperCase();
  if (k.includes("CANCEL") || k.includes("REJECT") || k === "REFUNDED") return XCircle;
  if (k.includes("DELIVER") || k === "COMPLETED") return CheckCircle2;
  if (k.includes("SHIP") || k.includes("TRANSIT")) return Truck;
  if (k.includes("PAID") || k === "PROCESSING") return Clock;
  return Clock;
}

export default function AdminDashboardPage() {
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [finance, setFinance] = useState<any | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [ov, tp, fn, od, sl] = await Promise.allSettled([
        apiGet(`/analytics/overview/?days=${days}`),
        apiGet(`/analytics/top-products/?days=${days}&limit=5`),
        apiGet(`/finance/summary/`),
        apiGet(`/admin/orders/?page=1&page_size=6`),
        apiGet(`/analytics/sales/?days=${days}`),
      ]);
      // Surface silent failures so staff-only admins can see why numbers are zero.
      ([
        ["overview", ov],
        ["top-products", tp],
        ["finance", fn],
        ["orders", od],
        ["sales", sl],
      ] as const).forEach(([key, r]) => {
        if (r.status === "rejected") {
          // eslint-disable-next-line no-console
          console.warn(`[dashboard] ${key} fetch failed:`, r.reason?.message ?? r.reason);
        }
      });
      if (ov.status === "fulfilled") setOverview((ov.value as any) || {});
      if (tp.status === "fulfilled") {
        const v: any = tp.value;
        setTopProducts(v?.top || v?.results || v || []);
      }
      if (fn.status === "fulfilled") setFinance(fn.value);
      if (od.status === "fulfilled") {
        const v: any = od.value;
        setRecentOrders(Array.isArray(v) ? v : v?.results || []);
      }
      if (sl.status === "fulfilled") {
        const v: any = sl.value;
        setSales(v?.daily ?? (Array.isArray(v) ? v : []));
      }
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, [days]);

  const kpis = useMemo(() => {
    const o = (overview || {}) as any;
    const f = (finance || {}) as any;
    const revenue = o.revenue ?? f.total_revenue ?? 0;
    const orders = o.orders ?? 0;
    const aov = o.avg_order_value ?? 0;
    const totalCustomers = o.total_customers ?? 0;
    return [
      { label: `Revenue (${days}d)`, value: formatPrice(revenue), sub: `Last 30d: ${formatPrice(o.revenue_30d ?? 0)}`, icon: DollarSign, gradient: "from-primary to-accent" },
      { label: `Orders (${days}d)`, value: String(orders), sub: `Last 30d: ${o.orders_30d ?? 0}`, icon: ShoppingCart, gradient: "from-indigo-600 to-primary" },
      { label: "Customers", value: String(totalCustomers), sub: `${o.new_customers ?? 0} new in ${days}d`, icon: Users, gradient: "from-amber-500 to-orange-600" },
      { label: "Avg Order", value: formatPrice(aov, true), sub: `Net profit: ${formatPrice(f.net_profit ?? 0)}`, icon: TrendingUp, gradient: "from-rose-500 to-pink-600" },
    ];
  }, [overview, finance, days]);

  if (loading && !overview) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusTotal = Math.max(1, Object.values((overview as any)?.orders_by_status || {}).reduce<number>((a, b) => a + Number(b), 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Live Admin Console
          </div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time overview of your store, last {days} days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-surface p-1 shadow-sm">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setDays(r.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  days === r.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-muted disabled:opacity-50 shadow-sm"
          >
            <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md"
            >
              <div className={cn("absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r", k.gradient)} />
              <div className="flex items-start justify-between">
                <div className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md", k.gradient)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-2xl font-bold text-foreground">{k.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground">
                Daily revenue across the last {days} days
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
              <ArrowUpRight className="h-3 w-3" /> Live
            </div>
          </div>
          <RevenueSparkline data={sales} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Finance</h3>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <FinanceRow label="Total Revenue" value={finance?.total_income ?? finance?.total_revenue} positive />
            <FinanceRow label="Total Payouts" value={finance?.total_expense ?? finance?.total_payouts} />
            <FinanceRow label="Refunds" value={finance?.total_refunds} negative />
            <div className="h-px bg-border" />
            <FinanceRow label="Net Profit" value={finance?.net_profit} highlight />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Low Stock Alerts
              </h3>
              <p className="text-xs text-muted-foreground">
                {(overview as any)?.low_stock_count ?? 0} products with 5 or fewer units,{" "}
                {(overview as any)?.out_of_stock_count ?? 0} out of stock
              </p>
            </div>
            <Link href="/admin/products" className="text-xs text-primary hover:underline">
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {((overview as any)?.low_stock_products || []).slice(0, 8).map((p: any) => (
              <div
                key={p.id}
                className="group relative rounded-xl border border-border bg-surface p-3 transition hover:border-primary hover:shadow-sm"
              >
                <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-muted">
                  <img src={p.image_url || p.image_external_url || p.image || "/placeholder.png"} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <div className="line-clamp-2 text-xs font-medium text-foreground">{p.name}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">{p.sku}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      p.stock === 0
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    Stock: {p.stock ?? 0} / threshold {p.low_stock_threshold ?? 5}
                  </span>
                </div>
              </div>
            ))}
            {(!((overview as any)?.low_stock_products || []).length) && (
              <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
                All stock levels are healthy.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Top Products</h3>
            <Link href="/admin/analytics" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No sales yet</div>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((p: any, idx) => {
                const max = topProducts[0]?.revenue || 1;
                const pct = Math.round((Number(p.revenue || 0) / Number(max)) * 100);
                return (
                  <li key={p.product_id || p.id} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                        idx === 0
                          ? "bg-amber-100 text-amber-700"
                          : idx === 1
                          ? "bg-primary/10 text-primary"
                          : idx === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{pct}%</span>
                        <span>{p.units_sold} sold</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-foreground">{formatPrice(p.revenue || 0)}</div>
                      <div className="text-[11px] text-muted-foreground">{p.units_sold} units</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-surface shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-base font-semibold text-foreground">Recent Orders</h3>
            <Link href="/admin/orders" className="inline-flex items-center text-xs text-primary hover:underline">
              All orders <ChevronRight className="ml-0.5 h-3 w-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left">Order</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((o: any) => {
                    const status = o.status || o.order_status || "Pending";
                    const Icon = statusIcon(status);
                    return (
                      <tr key={o.id || o.order_id} className="hover:bg-muted/40">
                        <td className="px-5 py-3 font-mono text-xs text-foreground">
                          #{o.order_number || o.id}
                        </td>
                        <td className="px-5 py-3 text-foreground">
                          {o.user_email || o.customer?.email || o.customer?.name || (o.user ? `User #${o.user}` : "-")}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1",
                              statusColor(status)
                            )}
                          >
                            <Icon className="h-3 w-3" /> {status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {o.created_at ? formatDate(o.created_at) : "-"}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-foreground">
                          {formatPrice(o.total ?? o.total_price ?? o.grand_total ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Order Status</h3>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            {Object.entries(
              (overview as any)?.orders_by_status ?? {}
            ).map(([s, v]) => (
              <div key={s} className="space-y-1">
                <div className="flex items-center justify-between text-xs"><span className="capitalize text-muted-foreground">{s}</span><span className="font-semibold text-foreground">{String(v)}</span></div>
              </div>
            ))}
            {Object.keys(
              (overview as any)?.orders_by_status ?? {}
            ).length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">No orders yet</div>
            )}
          </div>

          <div className="my-5 h-px bg-border" />

          <h3 className="mb-3 text-base font-semibold text-foreground">Top Categories</h3>
          <ul className="space-y-2">
            {(overview?.top_categories || []).slice(0, 5).map((c) => {
              const label = c.name || `Category`;
              const val = c.count ?? 0;
              return (
                <li key={label} className="flex items-center justify-between text-sm">
                  <span className="truncate text-foreground">{label}</span>
                  <span className="font-semibold text-foreground">
                    {Number(val).toLocaleString()} sold
                  </span>
                </li>
              );
            })}
            {(((overview as any)?.top_categories || []).length === 0) && (
              <li className="py-2 text-center text-xs text-muted-foreground">No category data</li>
            )}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

function FinanceRow({
  label,
  value,
  positive,
  negative,
  highlight,
}: {
  label: string;
  value?: number;
  positive?: boolean;
  negative?: boolean;
  highlight?: boolean;
}) {
  const v = Number(value || 0);
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        highlight && "-mx-2 rounded-lg bg-primary/10 px-2 py-2 ring-1 ring-primary/30"
      )}
    >
      <span
        className={cn("text-sm", highlight ? "font-semibold text-foreground" : "text-muted-foreground")}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums text-sm font-semibold",
          highlight
            ? "text-primary"
            : positive
            ? "text-emerald-600"
            : negative
            ? "text-rose-600"
            : "text-foreground"
        )}
      >
        {formatPrice(v)}
      </span>
    </div>
  );
}

function RevenueSparkline({ data }: { data: any[] }) {
  const safe = Array.isArray(data) ? data : [];
  if (safe.length === 0) {
    return <div className="py-12 text-center text-sm text-muted-foreground">No sales in this period</div>;
  }
  const W = 800,
    H = 220,
    PAD = 16;
  const max = Math.max(1, ...safe.map((d) => Number(d.revenue) || 0));
  const stepX = safe.length > 1 ? (W - PAD * 2) / (safe.length - 1) : 0;
  const points = safe.map((d, i) => {
    const x = PAD + i * stepX;
    const y = H - PAD - ((Number(d.revenue) || 0) / max) * (H - PAD * 2);
    return { x, y, label: d.date, value: Number(d.revenue) || 0 };
  });

  const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  const areaD = `${pathD} L ${PAD + (points.length - 1) * stepX},${H - PAD} L ${PAD},${H - PAD} Z`;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full">
        <defs>
          <linearGradient id="revArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="revLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1={PAD}
            x2={W - PAD}
            y1={PAD + (H - PAD * 2) * p}
            y2={PAD + (H - PAD * 2) * p}
            stroke="currentColor"
            className="text-border"
            strokeDasharray="4 4"
          />
        ))}
        <motion.path d={areaD} fill="url(#revArea)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.path
          d={pathD}
          fill="none"
          stroke="url(#revLine)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="hsl(var(--surface))"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + i * 0.02 }}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}