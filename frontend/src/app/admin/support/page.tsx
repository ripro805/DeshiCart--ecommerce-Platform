"use client";

import { apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LifeBuoy, Loader2, Search, MessageCircle } from "lucide-react";

export default function SupportListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/api/support/tickets/");
        setItems(Array.isArray(res) ? res : res?.results || []);
      } catch { setItems([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = items.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !(`${t.subject} ${t.user_email || t.user?.email || ""}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const stats = {
    open: items.filter((t) => t.status === "open").length,
    pending: items.filter((t) => t.status === "pending").length,
    closed: items.filter((t) => t.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <p className="text-sm text-slate-500">Customer inquiries and issues</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Open</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats.open}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Pending</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Closed</div>
          <div className="text-2xl font-bold text-slate-600 mt-1">{stats.closed}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..." className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div className="flex gap-1 border border-slate-200 rounded-md p-1">
            {["all", "open", "pending", "closed"].map((s) => (
              <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`px-3 py-1 text-xs font-medium rounded ${statusFilter === s ? "bg-indigo-600 text-white" : "text-slate-600"}`}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <LifeBuoy className="h-12 w-12 mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No tickets found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/support/${t.id}`} className="font-medium text-indigo-600 hover:underline">{t.subject}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.user_email || t.user?.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === "high" ? "bg-rose-100 text-rose-700" : t.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                      {t.priority || "low"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "open" ? "bg-amber-100 text-amber-700" : t.status === "pending" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}