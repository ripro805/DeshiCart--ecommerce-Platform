"use client";

import { apiGet, apiDelete } from "@/lib/api";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Loader2, Copy } from "lucide-react";
import Link from "next/link";

export default function CouponsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/api/coupons/");
      setItems(Array.isArray(res) ? res : res?.results || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function del(id: number) {
    if (!confirm("Delete this coupon?")) return;
    await apiDelete(`/api/coupons/${id}/`);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  const filtered = items.filter((c) => !search || c.code?.toLowerCase().includes(search.toLowerCase()));

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    alert("Copied: " + code);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
          <p className="text-sm text-slate-500">Discount codes and promotions</p>
        </div>
        <Link href="/admin/coupons/new" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Coupon
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200">
          <input
            type="text"
            placeholder="Search by code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No coupons yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Code</th>
                <th className="px-5 py-3 text-left">Discount</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Min Order</th>
                <th className="px-5 py-3 text-left">Used / Limit</th>
                <th className="px-5 py-3 text-left">Expires</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <button onClick={() => copy(c.code)} className="inline-flex items-center gap-1 font-mono font-semibold text-indigo-600 hover:text-indigo-700">
                      {c.code} <Copy className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="px-5 py-3 font-medium">{c.discount}{c.discount_type === "percentage" ? "%" : ` ${c.currency || "BDT"}`}</td>
                  <td className="px-5 py-3 text-slate-600">{c.discount_type}</td>
                  <td className="px-5 py-3">{c.min_order_value || "—"}</td>
                  <td className="px-5 py-3">{c.used_count || 0} / {c.usage_limit || "∞"}</td>
                  <td className="px-5 py-3 text-slate-600">{c.valid_to || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/coupons/${c.id}`} className="inline-flex p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button onClick={() => del(c.id)} className="inline-flex p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
