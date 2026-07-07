"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarRange,
  CheckCircle2,
  Eye,
  Filter,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import { apiGet } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "@/components/admin/feedback/toast-store";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/admin/feedback/states";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type OrderStatus =
  | "NOT PAID"
  | "READY TO SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type Order = {
  id: number;
  user?: number;
  status: OrderStatus;
  total_price: string | number;
  created_at: string;
  updated_at?: string;
  items?: { id: number; quantity: number; price: string | number; product?: { id: number; name: string } }[];
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STATUS_META: Record<
  OrderStatus,
  { label: string; tone: string; icon: React.ReactNode }
> = {
  "NOT PAID": {
    label: "Not paid",
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    icon: <XCircle className="h-3 w-3" />,
  },
  "READY TO SHIP": {
    label: "Ready to ship",
    tone: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
    icon: <Package className="h-3 w-3" />,
  },
  SHIPPED: {
    label: "Shipped",
    tone: "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30",
    icon: <Truck className="h-3 w-3" />,
  },
  DELIVERED: {
    label: "Delivered",
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const STATUS_FILTERS: { value: "" | OrderStatus; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "NOT PAID", label: "Not paid" },
  { value: "READY TO SHIP", label: "Ready to ship" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAGE_SIZE = 20;

/* -------------------------------------------------------------------------- */
/*  Status pill                                                               */
/* -------------------------------------------------------------------------- */

function StatusPill({ status }: { status?: string }) {
  const meta = STATUS_META[status as OrderStatus] ?? {
    label: status || "—",
    tone: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
    icon: <Package className="h-3 w-3" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.tone}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ total: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  /* per-status counts (across full set, ignore filters) */
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [aggregateRevenue, setAggregateRevenue] = useState(0);

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  /* load filtered page */
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(PAGE_SIZE));
      if (statusFilter) params.set("status", statusFilter);

      const data = await apiGet<Paginated<Order> | Order[]>(
        `/admin/orders/?${params.toString()}`,
      );
      const results = Array.isArray(data) ? data : data.results ?? [];
      const total = Array.isArray(data) ? results.length : data.count;

      setItems(results);
      setCounts({ total });
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to load orders.";
      setError(typeof msg === "string" ? msg : "Failed to load orders.");
      setItems([]);
      setCounts({ total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  /* aggregate stats from a single wide fetch */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<Paginated<Order> | Order[]>(
          `/admin/orders/?page_size=200`,
        );
        if (cancelled) return;
        const arr: Order[] = Array.isArray(data) ? data : data.results ?? [];
        const byStatus: Record<string, number> = {};
        let revenue = 0;
        arr.forEach((o) => {
          byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
          revenue += Number(o.total_price ?? 0);
        });
        setStatusCounts(byStatus);
        setAggregateRevenue(revenue);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* client-side search within loaded page */
  const filtered = useMemo(() => {
    if (!debounced) return items;
    const q = debounced.toLowerCase();
    return items.filter((o) => {
      return (
        String(o.id).includes(q) ||
        String(o.user ?? "").includes(q) ||
        o.status.toLowerCase().includes(q)
      );
    });
  }, [items, debounced]);

  const totalPages = Math.max(1, Math.ceil(counts.total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Orders
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {counts.total} order{counts.total !== 1 ? "s" : ""} matching
            filters · total in system:{" "}
            {Object.values(statusCounts).reduce((a, b) => a + b, 0)}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="border-border bg-surface hover:bg-muted text-foreground inline-flex items-center gap-2 self-start rounded-lg border px-3 py-2 text-sm font-medium sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Total in system"
          value={Object.values(statusCounts).reduce((a, b) => a + b, 0)}
          tone="indigo"
        />
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Ready to ship"
          value={statusCounts["READY TO SHIP"] ?? 0}
          tone="amber"
        />
        <StatCard
          icon={<Truck className="h-4 w-4" />}
          label="Shipped"
          value={statusCounts.SHIPPED ?? 0}
          tone="violet"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Delivered"
          value={statusCounts.DELIVERED ?? 0}
          tone="emerald"
        />
      </div>

      {/* toolbar */}
      <div className="bg-surface border-border rounded-2xl border p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, user id, status…"
              className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/30 w-full rounded-lg border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-muted-foreground h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "" | OrderStatus);
                setPage(1);
              }}
              className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/30 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="text-muted-foreground hidden items-center gap-1.5 text-xs sm:flex">
              <CalendarRange className="h-3.5 w-3.5" />
              <span>{formatDate(new Date().toISOString())}</span>
            </div>
          </div>
        </div>
        <div className="text-muted-foreground mt-3 text-xs">
          Aggregate revenue across the last 200 orders:{" "}
          <span className="text-foreground font-medium">
            {formatPrice(aggregateRevenue)}
          </span>
        </div>
      </div>

      {/* table */}
      <div className="bg-surface border-border overflow-hidden rounded-2xl border">
        {loading ? (
          <LoadingState label="Loading orders…" />
        ) : error ? (
          <ErrorState
            description={error}
            onRetry={() => void load()}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={
              debounced || statusFilter
                ? "No orders match your filters."
                : "No orders yet."
            }
            description={
              debounced || statusFilter
                ? "Try clearing the filters or searching a different word."
                : "Orders will appear here once customers check out."
            }
            action={
              debounced || statusFilter ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Order</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">Customer</th>
                  <th className="px-5 py-3 text-left font-medium">Items</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/40 transition">
                    <td className="text-foreground px-5 py-3 font-mono text-xs">
                      #{o.id}
                    </td>
                    <td className="text-muted-foreground px-5 py-3">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="text-foreground px-5 py-3">
                      {o.user != null ? `User #${o.user}` : "—"}
                    </td>
                    <td className="text-muted-foreground px-5 py-3 text-xs">
                      {o.items?.length ?? 0} item
                      {(o.items?.length ?? 0) !== 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="text-foreground px-5 py-3 text-right font-medium tabular-nums">
                      {formatPrice(o.total_price)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="border-border bg-surface flex items-center justify-between gap-2 border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground text-xs">
              Page {page} of {totalPages} · {counts.total} order
              {counts.total !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border-border bg-background hover:bg-muted text-foreground rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="border-border bg-background hover:bg-muted text-foreground rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat card                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "indigo" | "amber" | "violet" | "emerald";
}) {
  const TONES = {
    indigo: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    violet: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  } as const;
  return (
    <div className="bg-surface border-border rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONES[tone]}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-muted-foreground text-xs">{label}</div>
          <div className="text-foreground text-xl font-bold tabular-nums">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}