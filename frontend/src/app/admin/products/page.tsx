"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  EyeOff,
  Filter,
  ImageIcon,
  Loader2,
  Package as PackageIcon,
  Plus,
  RefreshCw,
  Search,
  Star,
  Tag,
  Trash2,
} from "lucide-react";

import { apiGet, apiDelete, apiPatch } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/admin/feedback/states";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { usePermission } from "@/components/admin/layout/role-guard";

/* ------------------------------------------------------------------------- */
/*  Types                                                                    */
/* ------------------------------------------------------------------------- */

type Category = { id: number; name: string };

type Product = {
  id: number;
  name: string;
  slug?: string;
  sku?: string;
  brand?: string;
  brand_ref?: { id: number; name: string } | null;
  category?: number | { id: number; name: string };
  category_name?: string;
  subcategory?: { id: number; name: string } | null;
  price?: number | string;
  cost_price?: number | string | null;
  discounted_price?: number | string | null;
  stock?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  is_featured?: boolean;
  image_url?: string | null;
  image_external_url?: string | null;
  average_rating?: number;
  review_count?: number;
  total_reviews?: number;
  rating?: number;
  created_at?: string;
  updated_at?: string;
};

type SortKey = "newest" | "oldest" | "name" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc";

/* ------------------------------------------------------------------------- */
/*  Helpers                                                                  */
/* ------------------------------------------------------------------------- */

function getProductImage(p: Product): string | null {
  return p.image_url ?? p.image_external_url ?? null;
}

function getCategoryName(p: Product): string {
  if (typeof p.category === "object" && p.category) return p.category.name ?? "—";
  if (p.category_name) return p.category_name;
  return "—";
}

function getEffectivePrice(p: Product): number {
  const raw = p.discounted_price ?? p.price ?? 0;
  const n = typeof raw === "string" ? Number(raw) : raw;
  return Number.isFinite(n) ? n : 0;
}

function getStockTone(stock: number, threshold: number) {
  if (stock <= 0) return "rose";
  if (stock <= threshold) return "amber";
  return "emerald";
}

function formatMoney(value: number | string | undefined | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isFinite(n)) {
    return `৳ ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `৳ ${value}`;
}

/* ------------------------------------------------------------------------- */
/*  Constants                                                                */
/* ------------------------------------------------------------------------- */

const STOCK_REASONS = [
  "PURCHASE",
  "RETURN",
  "ADJUSTMENT",
  "DAMAGE",
  "SALE",
] as const;

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name (A→Z)" },
  { value: "price-asc", label: "Price (low→high)" },
  { value: "price-desc", label: "Price (high→low)" },
  { value: "stock-asc", label: "Stock (low→high)" },
  { value: "stock-desc", label: "Stock (high→low)" },
];

/* ------------------------------------------------------------------------- */
/*  Page                                                                     */
/* ------------------------------------------------------------------------- */

export default function AdminProductsPage() {
  const { ask, dialog: confirmDialog } = useConfirm();
  const canManage = usePermission("manage_products");
  const canDelete = usePermission("delete_product");

  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "not-featured">(
    "all",
  );
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "low" | "out">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  /* ----------------------------- Debounce search ---------------------------- */

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  /* ----------------------------- Load categories ---------------------------- */

  const loadCategories = useCallback(async () => {
    try {
      const res: any = await apiGet(`/categories/?page_size=200`);
      const list: Category[] = Array.isArray(res)
        ? res
        : (res?.results ?? []);
      setCategories(list);
    } catch {
      setCategories([]);
    }
  }, []);

  /* ----------------------------- Load products ------------------------------ */

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (statusFilter !== "all") {
        params.set("is_active", statusFilter === "active" ? "true" : "false");
      }
      if (featuredFilter !== "all") {
        params.set("is_featured", featuredFilter === "featured" ? "true" : "false");
      }
      if (categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }

      const res: any = await apiGet(`/admin/products/?${params.toString()}`);
      const list: Product[] = Array.isArray(res)
        ? res
        : (res?.results ?? []);
      setItems(list);
      setTotalCount(typeof res?.count === "number" ? res.count : list.length);
    } catch (err: any) {
      setLoadError(err?.message || "Failed to load products");
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter, featuredFilter, categoryFilter]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ----------------------------- Filtering / sorting ------------------------ */

  const filteredAndSorted = useMemo(() => {
    let list = items.slice();

    if (stockFilter !== "all") {
      list = list.filter((p) => {
        const stock = Number(p.stock ?? 0);
        const threshold = Number(p.low_stock_threshold ?? 5);
        if (stockFilter === "out") return stock <= 0;
        if (stockFilter === "low") return stock > 0 && stock <= threshold;
        return stock > threshold;
      });
    }

    list.sort((a, b) => {
      switch (sortKey) {
        case "newest":
          return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        case "oldest":
          return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
        case "name":
          return (a.name ?? "").localeCompare(b.name ?? "");
        case "price-asc":
          return getEffectivePrice(a) - getEffectivePrice(b);
        case "price-desc":
          return getEffectivePrice(b) - getEffectivePrice(a);
        case "stock-asc":
          return Number(a.stock ?? 0) - Number(b.stock ?? 0);
        case "stock-desc":
          return Number(b.stock ?? 0) - Number(a.stock ?? 0);
        default:
          return 0;
      }
    });

    return list;
  }, [items, stockFilter, sortKey]);

  /* ----------------------------- Aggregate stats ---------------------------- */

  const stats = useMemo(() => {
    let total = 0;
    let active = 0;
    let featured = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;

    items.forEach((p) => {
      total += 1;
      if (p.is_active) active += 1;
      if (p.is_featured) featured += 1;
      const stock = Number(p.stock ?? 0);
      const threshold = Number(p.low_stock_threshold ?? 5);
      if (stock <= 0) outOfStock += 1;
      else if (stock <= threshold) lowStock += 1;
      const price = getEffectivePrice(p);
      totalValue += price * stock;
    });

    return { total, active, featured, lowStock, outOfStock, totalValue };
  }, [items]);

  /* ----------------------------- Actions ------------------------------------ */

  const handleToggleActive = useCallback(
    async (p: Product) => {
      if (!canManage) {
        toast.error("You don't have permission to modify products.");
        return;
      }
      setToggling(p.id);
      try {
        await apiPatch(`/admin/products/${p.id}/`, {
          is_active: !p.is_active,
        });
        setItems((xs) =>
          xs.map((x) => (x.id === p.id ? { ...x, is_active: !p.is_active } : x)),
        );
        toast.success(
          p.is_active ? "Product hidden from storefront." : "Product made visible.",
        );
      } catch (err: any) {
        toast.error(err?.message || "Failed to update product.");
      } finally {
        setToggling(null);
      }
    },
    [canManage],
  );

  const handleDelete = useCallback(
    (p: Product) => {
      if (!canDelete) {
        toast.error("You don't have permission to delete products.");
        return;
      }
      void ask({
        tone: "danger",
        title: `Delete "${p.name}"?`,
        description:
          "This will permanently remove the product, its variants, and any related data. This cannot be undone.",
        confirmLabel: "Delete product",
        onConfirm: async () => {
          setDeleting(p.id);
          try {
            await apiDelete(`/admin/products/${p.id}/`);
            setItems((xs) => xs.filter((x) => x.id !== p.id));
            setTotalCount((c) => Math.max(0, c - 1));
            toast.success(`Deleted "${p.name}".`);
          } catch (err: any) {
            toast.error(err?.message || "Failed to delete product.");
            throw err;
          } finally {
            setDeleting(null);
          }
        },
      });
    },
    [ask, canDelete],
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setFeaturedFilter("all");
    setStockFilter("all");
    setCategoryFilter("all");
    setSortKey("newest");
    setPage(1);
  }, []);

  const filtersActive =
    !!debouncedSearch ||
    statusFilter !== "all" ||
    featuredFilter !== "all" ||
    stockFilter !== "all" ||
    categoryFilter !== "all";

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, featuredFilter, stockFilter, categoryFilter, sortKey]);

  /* ----------------------------- Render ------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your catalog, prices, stock and visibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {canManage && (
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<Boxes className="h-4 w-4" />}
          tone="indigo"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<Eye className="h-4 w-4" />}
          tone="emerald"
        />
        <StatCard
          label="Inactive"
          value={stats.total - stats.active}
          icon={<EyeOff className="h-4 w-4" />}
          tone="slate"
        />
        <StatCard
          label="Featured"
          value={stats.featured}
          icon={<Star className="h-4 w-4" />}
          tone="amber"
        />
        <StatCard
          label="Low stock"
          value={stats.lowStock}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone="amber"
        />
        <StatCard
          label="Out of stock"
          value={stats.outOfStock}
          icon={<PackageIcon className="h-4 w-4" />}
          tone="rose"
        />
      </div>

      {/* Toolbar */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, SKU, brand…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          {/* Featured filter */}
          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value as typeof featuredFilter)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All products</option>
            <option value="featured">Featured</option>
            <option value="not-featured">Not featured</option>
          </select>

          {/* Stock filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Any stock</option>
            <option value="in-stock">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <div className="ml-auto flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtersActive && (
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-2 text-xs text-muted-foreground">
            <span>
              Filters active — showing {filteredAndSorted.length} of {items.length}{" "}
              loaded ({totalCount} total)
            </span>
            <button
              onClick={clearFilters}
              className="rounded px-2 py-1 text-foreground hover:bg-muted"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Body */}
        {loading ? (
          <LoadingState label="Loading products…" />
        ) : loadError ? (
          <ErrorState
            message={loadError}
            onRetry={() => void load()}
          />
        ) : filteredAndSorted.length === 0 ? (
          <EmptyState
            icon={<PackageIcon className="h-10 w-10" />}
            title={filtersActive ? "No products match your filters" : "No products yet"}
            description={
              filtersActive
                ? "Try clearing the filters or adjusting your search."
                : "Get started by adding your first product to the catalog."
            }
            action={
              filtersActive ? (
                <button
                  onClick={clearFilters}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Clear filters
                </button>
              ) : canManage ? (
                <Link
                  href="/admin/products/new"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </Link>
              ) : null
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left">Product</th>
                    <th className="px-5 py-3 text-left">SKU</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-right">Price</th>
                    <th className="px-5 py-3 text-right">Stock</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedItems.map((p) => {
                    const stock = Number(p.stock ?? 0);
                    const threshold = Number(p.low_stock_threshold ?? 5);
                    const stockTone = getStockTone(stock, threshold);
                    const img = getProductImage(p);
                    const isToggling = toggling === p.id;
                    const isDeleting = deleting === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-muted/40">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/products/${p.id}`}
                                className="block truncate font-medium text-foreground hover:text-primary"
                                title={p.name}
                              >
                                {p.name}
                              </Link>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-mono">#{p.id}</span>
                                {p.brand_ref?.name && (
                                  <span className="inline-flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {p.brand_ref.name}
                                  </span>
                                )}
                                {typeof p.average_rating === "number" &&
                                  p.average_rating > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                      {p.average_rating.toFixed(1)}
                                      <span className="text-muted-foreground/60">
                                        ({p.review_count ?? p.total_reviews ?? 0})
                                      </span>
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                          {p.sku ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-foreground">
                          {getCategoryName(p)}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums">
                          <div className="font-medium text-foreground">
                            {formatMoney(getEffectivePrice(p))}
                          </div>
                          {p.discounted_price &&
                            Number(p.discounted_price) > 0 &&
                            Number(p.discounted_price) < Number(p.price ?? 0) && (
                              <div className="text-xs text-muted-foreground line-through">
                                {formatMoney(p.price)}
                              </div>
                            )}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums">
                          <span
                            className={
                              stockTone === "rose"
                                ? "font-semibold text-rose-600"
                                : stockTone === "amber"
                                  ? "font-semibold text-amber-600"
                                  : "text-foreground"
                            }
                          >
                            {stock}
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {stock <= 0
                              ? "Out of stock"
                              : stock <= threshold
                                ? "Low stock"
                                : "Healthy"}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {p.is_active ? (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 ring-1 ring-emerald-500/30">
                                Active
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-500/30">
                                Hidden
                              </span>
                            )}
                            {p.is_featured && (
                              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 ring-1 ring-amber-500/30">
                                Featured
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            {canManage && (
                              <button
                                onClick={() => void handleToggleActive(p)}
                                disabled={isToggling}
                                className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50"
                                title={p.is_active ? "Hide" : "Show"}
                              >
                                {isToggling ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : p.is_active ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(p)}
                                disabled={isDeleting}
                                className="rounded p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-50"
                                title="Delete"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
              <span className="text-muted-foreground">
                Showing {paginatedItems.length} of {filteredAndSorted.length} loaded
                {totalCount > items.length && ` (${totalCount} total)`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded border border-border px-3 py-1 text-foreground hover:bg-muted disabled:opacity-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <span className="text-muted-foreground">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded border border-border px-3 py-1 text-foreground hover:bg-muted disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmDialog}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  StatCard                                                                 */
/* ------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone: "indigo" | "emerald" | "amber" | "rose" | "slate";
}) {
  const tones: Record<typeof tone, string> = {
    indigo: "bg-indigo-500/10 text-indigo-600 ring-indigo-500/30",
    emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-600 ring-amber-500/30",
    rose: "bg-rose-500/10 text-rose-600 ring-rose-500/30",
    slate: "bg-slate-500/10 text-slate-600 ring-slate-500/30",
  };
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={`rounded-md p-1.5 ring-1 ${tones[tone]}`}>{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}

// Suppress lint warnings for unused imports in some bundlers
void STOCK_REASONS;
void ArrowUp;
void ArrowDown;