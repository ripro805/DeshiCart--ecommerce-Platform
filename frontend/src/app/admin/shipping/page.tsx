"use client";

import { useEffect, useState } from "react";
import { Truck, Plus, Edit, Trash2 } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/feedback/states";
import { formatPrice } from "@/lib/utils";

type Method = {
  id: number;
  name: string;
  description?: string;
  price?: number | string;
  is_active?: boolean;
  estimated_days_min?: number;
  estimated_days_max?: number;
};

export default function ShippingPage() {
  const { allowed, loading: permLoading } = usePermissionState("manage_shipping");
  const [items, setItems] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { ask, dialog: confirmDialog } = useConfirm();

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res: any = await apiGet("/shipping/rates/");
      setItems(Array.isArray(res) ? res : res?.results || []);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load shipping methods");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (allowed) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  async function del(m: Method) {
    const ok = await ask({
      title: "Delete shipping method?",
      description: `"${m.name}" will be removed. Existing orders referencing it will keep their snapshot.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await apiDelete(`/shipping/rates/${m.id}/`);
      setItems((xs) => xs.filter((x) => x.id !== m.id));
      toast.success("Shipping method deleted", m.name);
    } catch (e: any) {
      toast.error("Delete failed", e?.message || "Please try again");
    }
  }

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need manage_shipping to view this page." />;
  if (loading) return <LoadingState label="Loading shipping methods…" />;
  if (loadError) return <ErrorState title="Couldn't load shipping methods" description={loadError} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shipping</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage shipping methods, rates and delivery windows
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          onClick={() => toast.info("Editor coming soon", "Use the API to add a shipping method for now.")}
        >
          <Plus className="h-4 w-4" />
          New Method
        </button>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <EmptyState
            icon={Truck}
            title="No shipping methods yet"
            description="Add your first method to start offering delivery options at checkout."
            action={
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Refresh
              </button>
            }
          />
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">ETA</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((m) => (
                  <tr key={m.id} className="transition hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{m.name}</p>
                          {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground">৳{formatPrice(m.price ?? 0)}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {m.estimated_days_min || m.estimated_days_max
                        ? `${m.estimated_days_min ?? "?"}–${m.estimated_days_max ?? "?"} days`
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          m.is_active
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => toast.info("Editor coming soon")}
                          className="inline-flex rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => del(m)}
                          className="inline-flex rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {confirmDialog}
    </div>
  );
}
