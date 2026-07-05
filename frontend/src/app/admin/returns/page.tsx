"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, RotateCcw } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/feedback/states";
import { formatPrice, formatDate } from "@/lib/utils";

type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

const STATUS_FILTERS: ("all" | ReturnStatus)[] = ["all", "PENDING", "APPROVED", "REJECTED", "COMPLETED"];

const STATUS_TONE: Record<ReturnStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  APPROVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  REJECTED: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  COMPLETED: "bg-muted text-muted-foreground",
};

export default function ReturnsPage() {
  const { allowed, loading: permLoading } = usePermissionState("manage_returns");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ReturnStatus>("all");

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res: any = await apiGet("/returns/returns/");
      setItems(Array.isArray(res) ? res : res?.results || []);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (allowed) void load();
  }, [allowed]);

  async function setStatus(id: number, status: ReturnStatus) {
    const snapshot = items;
    // optimistic update
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status } : x)));
    try {
      try {
        await apiPatch(`/returns/returns/${id}/decide/`, { decision: status.toLowerCase(), note: "" });
      } catch {
        await apiPatch(`/returns/returns/${id}/`, { status });
      }
      toast.success("Status updated", `Return #${id} is now ${status.toLowerCase()}.`);
    } catch (e: any) {
      setItems(snapshot);
      toast.error("Update failed", e?.message || "Please try again");
    }
  }

  const counts: Record<string, number> = { all: items.length };
  items.forEach((r) => {
    const s = (r.status || "").toUpperCase();
    counts[s] = (counts[s] || 0) + 1;
  });

  const filtered = items.filter((r) => filter === "all" || (r.status || "").toUpperCase() === filter);

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need manage_returns to view this page." />;
  if (loading) return <LoadingState label="Loading return requests…" />;
  if (loadError) return <ErrorState title="Couldn't load returns" description={loadError} />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Returns & Refunds</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Triage and decide on customer return requests.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-5 py-3">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === s
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.toLowerCase()}
              <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {counts[s] || 0}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={RotateCcw}
              title={filter === "all" ? "No return requests yet" : `No ${filter.toLowerCase()} returns`}
              description={
                filter === "all"
                  ? "When customers request returns, they'll appear here for review."
                  : "Try a different filter."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Reason</th>
                  <th className="px-5 py-3 font-medium">Refund</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Requested</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition hover:bg-muted/40">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">#{r.id}</td>
                    <td className="px-5 py-3 text-foreground">#{r.order ?? r.order_id}</td>
                    <td className="px-5 py-3 text-foreground">
                      {r.user_email || `User #${r.user ?? r.user_id}`}
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-muted-foreground">
                      {r.reason || "—"}
                    </td>
                    <td className="px-5 py-3 font-medium tabular-nums text-foreground">
                      ৳{formatPrice(r.refund_amount)}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => setStatus(r.id, e.target.value.toUpperCase() as ReturnStatus)}
                        className={`rounded-lg border-0 px-2.5 py-1 text-xs font-medium capitalize outline-none focus:ring-2 focus:ring-primary/40 ${
                          STATUS_TONE[(r.status || "").toUpperCase() as ReturnStatus] ||
                          "bg-muted text-foreground"
                        }`}
                      >
                        {(["PENDING", "APPROVED", "REJECTED", "COMPLETED"] as ReturnStatus[]).map((s) => (
                          <option key={s} value={s} className="bg-surface text-foreground">
                            {s.toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{formatDate(r.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/returns/${r.id}`}
                        className="inline-flex rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        aria-label="View return"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}