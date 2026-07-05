"use client";

import { apiGet, apiDelete } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, Loader2, Search, FolderTree, FolderOpen } from "lucide-react";
import Link from "next/link";

export default function CategoriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const { ask, dialog: confirmDialog } = useConfirm();

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/categories/");
      const data = Array.isArray(res) ? res : res?.results || [];
      setItems(data);
    } catch (err: any) {
      console.error("[CategoriesPage] load failed:", err);
      setItems([]);
      const detail = err?.response?.data ? JSON.stringify(err.response.data) : err?.message || String(err);
      toast.error(`Failed to load categories (${err?.response?.status ?? "?"})`);
      console.error("diag:", detail);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  function del(id: number, name: string) {
    setBusyId(id);
    void ask({
      title: "Delete category?",
      description: `"${name}" will be removed. Subcategories will be orphaned.`,
      tone: "danger",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await apiDelete(`/categories/${id}/`);
          setItems((xs) => xs.filter((x) => x.id !== id));
          toast.success(`Category "${name}" deleted`);
        } catch (err: any) {
          const detail = err?.response?.data ? JSON.stringify(err.response.data) : err?.message;
          toast.error(`Delete failed: ${detail || "unknown error"}`);
          throw err;
        }
      },
    }).finally(() => setBusyId(null));
  }

  const stats = useMemo(() => {
    const active = items.filter((c) => c.is_active).length;
    const inactive = items.length - active;
    return { total: items.length, active, inactive };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.is_active) ||
        (statusFilter === "inactive" && !c.is_active);
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize your product catalog into browseable groups
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Category
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-warm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</span>
            <FolderTree className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 text-2xl font-bold text-foreground">{stats.total}</div>
          <p className="text-xs text-muted-foreground">categories in catalog</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-warm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active</span>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600">{stats.active}</div>
          <p className="text-xs text-muted-foreground">visible to customers</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-warm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inactive</span>
            <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground" />
          </div>
          <div className="mt-3 text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
          <p className="text-xs text-muted-foreground">hidden from storefront</p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-lg border border-border bg-surface">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="inline-flex rounded-md border border-border bg-background p-0.5 text-xs">
            {(["all", "active", "inactive"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`rounded-[5px] px-3 py-1 font-medium capitalize transition-colors ${
                  statusFilter === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FolderOpen className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No categories found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length === 0
                ? "Add your first category to start organizing products"
                : "Try adjusting your search or filter"}
            </p>
            {items.length === 0 && (
              <Link
                href="/admin/categories/new"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                New Category
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Slug</th>
                <th className="px-5 py-3 text-left">Products</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.image}
                          alt={c.name}
                          className="h-9 w-9 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <FolderTree className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{c.name}</div>
                        {c.description && (
                          <div className="truncate text-xs text-muted-foreground max-w-xs">
                            {c.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{c.slug}</span>
                  </td>
                  <td className="px-5 py-3 text-foreground">
                    {c.product_count ?? "-"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/admin/categories/${c.id}`}
                        className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => del(c.id, c.name)}
                        disabled={busyId === c.id}
                        className="rounded p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        {busyId === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filtered.length} of {items.length}
              {statusFilter !== "all" && ` (${statusFilter})`}
            </span>
            <span>
              {stats.active} active · {stats.inactive} inactive
            </span>
          </div>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}
