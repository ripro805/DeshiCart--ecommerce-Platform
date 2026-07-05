"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  CheckCircle2,
  Filter,
  History,
  Loader2,
  Package,
  PackageX,
  RefreshCw,
  Search,
  Sliders,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import { apiGet, apiPost } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/admin/feedback/states";
import { usePermission } from "@/components/admin/layout/role-guard";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type StockProduct = {
  id: number;
  name: string;
  slug?: string;
  sku?: string;
  stock: number;
  low_stock_threshold?: number;
  category?: { id: number; name: string } | null;
  image_url?: string | null;
  is_active?: boolean;
};

type StockLog = {
  id: number;
  product: number;
  product_name: string;
  change: number;
  reason: "PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT" | "DAMAGE" | string;
  note?: string;
  created_by?: number | null;
  created_by_email?: string | null;
  created_at: string;
};

type ProductStats = {
  total: number;
  active: number;
  featured: number;
  low_stock: number;
  out_of_stock: number;
  average_price: number;
  by_category?: { id: number; name: string; count: number }[];
};

const REASONS = [
  { value: "PURCHASE", label: "Purchase (restock)" },
  { value: "SALE", label: "Sale" },
  { value: "RETURN", label: "Return" },
  { value: "ADJUSTMENT", label: "Manual adjustment" },
  { value: "DAMAGE", label: "Damage / loss" },
] as const;

const REASON_TONE: Record<string, string> = {
  PURCHASE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
  SALE: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
  RETURN: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30",
  ADJUSTMENT: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  DAMAGE: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
};

/* -------------------------------------------------------------------------- */
/*  Small primitives                                                          */
/* -------------------------------------------------------------------------- */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone = "default",
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "default" | "warn" | "danger" | "good";
  hint?: string;
}) {
  const toneClass =
    tone === "danger"
      ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
      : tone === "warn"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : tone === "good"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : "bg-primary/10 text-primary";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function stockTone(stock: number) {
  if (stock <= 0) return "danger" as const;
  if (stock <= 5) return "warn" as const;
  return "good" as const;
}

function stockLabel(stock: number) {
  if (stock <= 0) return "Out of stock";
  if (stock <= 5) return "Critical";
  return "Low";
}

/* -------------------------------------------------------------------------- */
/*  Quick adjust dialog                                                       */
/* -------------------------------------------------------------------------- */

function QuickAdjustDialog({
  open,
  product,
  onClose,
  onSubmit,
}: {
  open: boolean;
  product: StockProduct | null;
  onClose: () => void;
  onSubmit: (payload: { change: number; reason: string; note: string }) => Promise<void>;
}) {
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState<string>("1");
  const [reason, setReason] = useState<string>("PURCHASE");
  const [note, setNote] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDirection("in");
      setAmount("1");
      setReason("PURCHASE");
      setNote("");
      setErr(null);
      setBusy(false);
    }
  }, [open, product?.id]);

  if (!open || !product) return null;

  const numeric = Number(amount);
  const valid = Number.isFinite(numeric) && numeric > 0;
  const computedChange = direction === "in" ? Math.abs(numeric) : -Math.abs(numeric);
  const projected = Math.max(0, (product.stock || 0) + computedChange);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setErr("Enter a positive whole number.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({
        change: computedChange,
        reason,
        note: note.trim(),
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to adjust stock.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              Adjust stock
            </h2>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {product.name}
              {product.sku ? (
                <span className="ml-2 font-mono text-xs">{product.sku}</span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Current stock
              </p>
              <p className="text-sm font-semibold text-foreground">
                {product.stock} units
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                After change
              </p>
              <p
                className={`text-sm font-semibold ${
                  computedChange >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {projected} units
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Direction
              </label>
              <div className="flex rounded-lg border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setDirection("in")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition ${
                    direction === "in"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <ArrowUp className="h-3.5 w-3.5" /> In
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("out")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition ${
                    direction === "out"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <ArrowDown className="h-3.5 w-3.5" /> Out
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Note (optional)
            </label>
            <textarea
              rows={2}
              maxLength={255}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Restocked from supplier PO-1234"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {err ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{err}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !valid}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sliders className="h-3.5 w-3.5" />
              )}
              {busy ? "Saving…" : "Apply adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminInventoryPage() {
  const canManage = usePermission("manage_inventory");

  // Stats
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Low stock list
  const [lowStock, setLowStock] = useState<StockProduct[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);
  const [lowStockError, setLowStockError] = useState<string | null>(null);
  const [lowSearch, setLowSearch] = useState("");

  // Logs
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logReason, setLogReason] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [logTotalPages, setLogTotalPages] = useState(1);

  // Dialog
  const [adjustFor, setAdjustFor] = useState<StockProduct | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  /* --------------------------- data loaders ----------------------------- */

  async function loadStats() {
    setStatsLoading(true);
    try {
      const res: any = await apiGet("/admin/products/stats/");
      setStats(res || null);
    } catch {
      // Non-fatal; stats are decorative.
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadLowStock() {
    setLowStockLoading(true);
    setLowStockError(null);
    try {
      const res: any = await apiGet("/products/low-stock/");
      const list: StockProduct[] = Array.isArray(res)
        ? res
        : res?.results || res?.data?.results || [];
      setLowStock(list);
    } catch (e: any) {
      setLowStockError(e?.message || "Failed to load low-stock items.");
      setLowStock([]);
    } finally {
      setLowStockLoading(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(logPage));
      params.set("ordering", "-created_at");
      if (logSearch.trim()) params.set("search", logSearch.trim());
      const res: any = await apiGet(`/admin/stock-logs/?${params.toString()}`);
      const list: StockLog[] = res?.results || res || [];
      setLogs(list);
      setLogTotal(res?.count || list.length);
      const total = res?.count || list.length;
      const size = res?.results?.length || list.length || 1;
      setLogTotalPages(Math.max(1, Math.ceil(total / size)));
    } catch (e: any) {
      setLogsError(e?.message || "Failed to load stock movements.");
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  async function refreshAll() {
    setRefreshing(true);
    await Promise.all([loadStats(), loadLowStock(), loadLogs()]);
    setLastSync(new Date());
    setRefreshing(false);
  }

  useEffect(() => {
    loadStats();
    loadLowStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logPage, logReason]);

  /* ------------------------------ handlers ------------------------------ */

  async function submitAdjustment(payload: {
    change: number;
    reason: string;
    note: string;
  }) {
    if (!adjustFor) return;
    try {
      await apiPost(`/admin/products/${adjustFor.id}/adjust-stock/`, payload);
      toast.success(
        `Stock adjusted by ${payload.change >= 0 ? "+" : ""}${payload.change}.`,
      );
      setAdjustFor(null);
      await refreshAll();
    } catch (e: any) {
      toast.error(e?.message || "Could not save adjustment.");
      throw e;
    }
  }

  /* ------------------------------ derived ------------------------------- */

  const filteredLowStock = useMemo(() => {
    if (!lowSearch.trim()) return lowStock;
    const q = lowSearch.trim().toLowerCase();
    return lowStock.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q),
    );
  }, [lowStock, lowSearch]);

  const totalUnits = useMemo(() => {
    return lowStock.reduce((acc, p) => acc + (p.stock || 0), 0);
  }, [lowStock]);

  const outCount = useMemo(
    () => lowStock.filter((p) => (p.stock || 0) <= 0).length,
    [lowStock],
  );

  const criticalCount = useMemo(
    () => lowStock.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length,
    [lowStock],
  );

  /* -------------------------------- view -------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track stock levels, react to low inventory, and review every
            movement.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last synced {lastSync.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Package className="h-4 w-4" />
            Manage products
          </Link>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<Boxes className="h-5 w-5" />}
          label="Tracked products"
          value={
            statsLoading ? (
              <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" />
            ) : (
              (stats?.total ?? "—")
            )
          }
          hint={
            stats
              ? `${stats.active ?? 0} active · ${stats.featured ?? 0} featured`
              : undefined
          }
        />
        <StatTile
          icon={<TrendingDown className="h-5 w-5" />}
          label="Low stock items"
          tone="warn"
          value={
            lowStockLoading ? (
              <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" />
            ) : (
              lowStock.length
            )
          }
          hint={`≤ ${stats?.low_stock_threshold ?? 10} units`}
        />
        <StatTile
          icon={<PackageX className="h-5 w-5" />}
          label="Out of stock"
          tone="danger"
          value={
            lowStockLoading ? (
              <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" />
            ) : (
              outCount
            )
          }
          hint={`${criticalCount} critical (≤5)`}
        />
        <StatTile
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Total units in low-stock list"
          tone="good"
          value={
            lowStockLoading ? (
              <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" />
            ) : (
              totalUnits
            )
          }
          hint="Sum of units across flagged items"
        />
      </div>

      {/* Low stock + dialog mounted at root */}
      <QuickAdjustDialog
        open={!!adjustFor}
        product={adjustFor}
        onClose={() => setAdjustFor(null)}
        onSubmit={submitAdjustment}
      />

      {/* Low stock table */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low stock alerts
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Products at or below 10 units. Click “Adjust” to record a
              movement.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={lowSearch}
              onChange={(e) => setLowSearch(e.target.value)}
              placeholder="Search name, SKU, category…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {lowStockLoading ? (
          <LoadingState label="Loading low-stock items…" />
        ) : lowStockError ? (
          <ErrorState
            title="Could not load stock"
            description={lowStockError}
            onRetry={loadLowStock}
          />
        ) : filteredLowStock.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}
            title="Nothing low on stock"
            description={
              lowSearch.trim()
                ? "No matches for your search."
                : "All products are above the low-stock threshold."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-background/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Product</th>
                  <th className="px-5 py-3 text-left font-medium">Category</th>
                  <th className="px-5 py-3 text-right font-medium">Stock</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Threshold
                  </th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLowStock.map((p) => {
                  const tone = stockTone(p.stock || 0);
                  return (
                    <tr
                      key={p.id}
                      className="transition hover:bg-muted/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                            {p.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.image_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {p.name}
                            </p>
                            {p.sku ? (
                              <p className="truncate font-mono text-[11px] text-muted-foreground">
                                {p.sku}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {p.category?.name || "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`text-base font-semibold ${
                            tone === "danger"
                              ? "text-rose-600 dark:text-rose-400"
                              : tone === "warn"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground"
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {p.low_stock_threshold ?? 5}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products`}
                            className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            View
                          </Link>
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => setAdjustFor(p)}
                              className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                            >
                              <Sliders className="h-3 w-3" /> Adjust
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Stock movement log */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <History className="h-4 w-4 text-primary" />
              Stock movement log
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Every adjustment recorded against a product.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={logSearch}
                onChange={(e) => {
                  setLogSearch(e.target.value);
                  setLogPage(1);
                }}
                placeholder="Search by product…"
                className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={logReason}
                onChange={(e) => {
                  setLogReason(e.target.value);
                  setLogPage(1);
                }}
                className="appearance-none rounded-lg border border-border bg-background py-2 pl-8 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All reasons</option>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {logsLoading ? (
          <LoadingState label="Loading movements…" />
        ) : logsError ? (
          <ErrorState
            title="Could not load movements"
            description={logsError}
            onRetry={loadLogs}
          />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No stock movements yet"
            description="Adjustments you make to products will appear here."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-background/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">When</th>
                    <th className="px-5 py-3 text-left font-medium">Product</th>
                    <th className="px-5 py-3 text-right font-medium">Change</th>
                    <th className="px-5 py-3 text-left font-medium">Reason</th>
                    <th className="px-5 py-3 text-left font-medium">Note</th>
                    <th className="px-5 py-3 text-left font-medium">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((l) => {
                    const positive = (l.change || 0) >= 0;
                    return (
                      <tr
                        key={l.id}
                        className="transition hover:bg-muted/40"
                      >
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {new Date(l.created_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <p className="truncate font-medium text-foreground">
                            {l.product_name || `#${l.product}`}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-semibold ${
                              positive
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {positive ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5" />
                            )}
                            {positive ? "+" : ""}
                            {l.change}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                              REASON_TONE[l.reason] ||
                              "border-border bg-muted text-muted-foreground"
                            }`}
                          >
                            {l.reason}
                          </span>
                        </td>
                        <td className="px-5 py-3 max-w-xs truncate text-muted-foreground">
                          {l.note || "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {l.created_by_email || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logTotalPages > 1 ? (
              <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground">
                <span>
                  Page {logPage} of {logTotalPages} · {logTotal} entries
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                    disabled={logPage <= 1}
                    className="rounded-md border border-border bg-background px-2 py-1 text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLogPage((p) => Math.min(logTotalPages, p + 1))
                    }
                    disabled={logPage >= logTotalPages}
                    className="rounded-md border border-border bg-background px-2 py-1 text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}