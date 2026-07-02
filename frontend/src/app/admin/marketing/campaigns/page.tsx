"use client";

import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CampaignsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/api/marketing/campaigns/");
      setItems(Array.isArray(res) ? res : res?.results || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function toggle(id: number, active: boolean) {
    await apiPatch(`/api/marketing/campaigns/${id}/`, { is_active: !active });
    setItems((xs) => xs.map((x) => x.id === id ? { ...x, is_active: !active } : x));
  }

  async function del(id: number) {
    if (!confirm("Delete this campaign?")) return;
    await apiDelete(`/api/marketing/campaigns/${id}/`);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500">Manage promotional campaigns</p>
        </div>
        <Link href="/admin/marketing/campaigns/new" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Campaign
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No campaigns yet. <Link href="/admin/marketing/campaigns/new" className="text-indigo-600 hover:underline">Create your first campaign</Link></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Period</th>
                <th className="px-5 py-3 text-left">Discount</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-5 py-3 text-slate-600 capitalize">{c.campaign_type || c.type || "—"}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{c.start_date || "—"} → {c.end_date || "—"}</td>
                  <td className="px-5 py-3 font-medium">{c.discount}{c.discount_type === "percentage" ? "%" : ""}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggle(c.id, c.is_active)} className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/marketing/campaigns/${c.id}`} className="inline-flex p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
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