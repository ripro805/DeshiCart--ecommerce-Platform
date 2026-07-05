"use client";

import { apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LifeBuoy, Loader2, Search, MessageCircle } from "lucide-react";

const STATUS_TONE: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  PENDING: "bg-blue-100 text-blue-700",
  CLOSED: "bg-slate-100 text-slate-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
};

const PRIORITY_TONE: Record<string, string> = {
  HIGH: "bg-rose-100 text-rose-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-slate-100 text-slate-700",
};

export default function SupportListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/support/tickets/");
        setItems(Array.isArray(res) ? res : res?.results || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((t) => {
      if (statusFilter !== "all" && (t.status || "").toUpperCase() !== statusFilter)
        return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${t.subject || ""} ${t.user_email || t.user?.email || ""}`
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(
    () => ({
      open: items.filter((t) => (t.status || "").toUpperCase() === "OPEN").length,
      pending: items.filter((t) => (t.status || "").toUpperCase() === "PENDING")
        .length,
      closed: items.filter((t) =>
        ["CLOSED", "RESOLVED"].includes((t.status || "").toUpperCase())
      ).length,
    }),
    [items]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">
          Customer inquiries and issues
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-sm text-muted-foreground">Open</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">
            {stats.open}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">
            {stats.pending}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-sm text-muted-foreground">Closed</div>
          <div className="mt-1 text-2xl font-bold text-muted-foreground">
            {stats.closed}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground"
            />
          </div>
          <div className="flex gap-1 rounded-md border border-border p-1">
            {["all", "OPEN", "PENDING", "CLOSED"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {s === "all"
                  ? "All"
                  : s[0] + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <LifeBuoy className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">No tickets found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/support/${t.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.user_email || t.user?.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        PRIORITY_TONE[(t.priority || "").toUpperCase()] ||
                        PRIORITY_TONE.LOW
                      }`}
                    >
                      {(t.priority || "low").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        STATUS_TONE[(t.status || "").toUpperCase()] ||
                        STATUS_TONE.OPEN
                      }`}
                    >
                      {(t.status || "open").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}