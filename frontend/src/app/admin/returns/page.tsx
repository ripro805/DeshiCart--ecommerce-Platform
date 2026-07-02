"use client";

import { apiGet, apiPatch } from "@/lib/api";
import { useEffect, useState } from "react";
import { Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ReturnsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/api/returns/");
      const data = Array.isArray(res) ? res : res?.results || [];
      setItems(data);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function setStatus(id: number, status: string) {
    await apiPatch(`/api/returns/${id}/`, { status });
    setItems((xs) => xs.map((x) => x.id === id ? { ...x, status } : x));
  }

  const filtered = items.filter((r) => filter === "all" || r.status === filter);

  const STATUS_BADGES: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    completed: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Returns & Refunds</h1>
        <p className="text-sm text-slate-500">Manage return requests</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 inline-flex flex-wrap gap-1">
          {["all", "pending", "approved", "rejected", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${filter === s ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No return requests</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Order</th>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Reason</th>
                <th className="px-5 py-3 text-left">Refund</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Requested</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">#{r.id}</td>
                  <td className="px-5 py-3 text-slate-700">{r.order_number || `#${r.order}`}</td>
                  <td className="px-5 py-3 text-slate-700">{r.user_email || r.user || "—"}</td>
                  <td className="px-5 py-3 text-slate-600 max-w-xs truncate">{r.reason || r.reason_category || "—"}</td>
                  <td className="px-5 py-3 font-medium">{r.refund_amount || "—"}</td>
                  <td className="px-5 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => setStatus(r.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-md border-0 font-medium capitalize ${STATUS_BADGES[r.status] || "bg-slate-100"}`}
                    >
                      {["pending", "approved", "rejected", "completed"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/returns/${r.id}`} className="inline-flex p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
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