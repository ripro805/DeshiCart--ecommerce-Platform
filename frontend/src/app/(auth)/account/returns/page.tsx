"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Undo2, Loader2, Plus } from "lucide-react";

export default function AccountReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ order_id: "", reason: "", description: "" });

  async function load() {
    setLoading(true);
    try {
      const [r, o]: any = await Promise.all([
        apiGet("/api/returns/").catch(() => []),
        apiGet("/api/orders/").catch(() => []),
      ]);
      setReturns(Array.isArray(r) ? r : r?.results || []);
      setOrders(Array.isArray(o) ? o : o?.results || []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/api/returns/", { order: parseInt(form.order_id), reason: form.reason, description: form.description });
      setShowForm(false);
      setForm({ order_id: "", reason: "", description: "" });
      await load();
    } catch (e: any) { alert("Failed: " + e?.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Returns</h1>
          <p className="text-sm text-slate-500">{returns.length} requests</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Return
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Order</label>
            <select value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
              <option value="">Select an order</option>
              {orders.map((o) => <option key={o.id} value={o.id}>Order #{o.order_number || o.id} · ৳{o.total}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reason</label>
            <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
              <option value="">Select reason</option>
              <option value="defective">Defective product</option>
              <option value="wrong_item">Wrong item received</option>
              <option value="not_as_described">Not as described</option>
              <option value="damaged">Damaged in transit</option>
              <option value="change_of_mind">Change of mind</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-md">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Submit Request"}
            </button>
          </div>
        </form>
      )}

      {returns.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Undo2 className="h-12 w-12 mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No return requests</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          {returns.map((r) => (
            <Link key={r.id} href={`/account/returns/${r.id}`} className="block p-4 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Return #{r.id}</div>
                  <p className="text-sm text-slate-600 mt-1">{r.reason}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${r.status === "approved" ? "bg-emerald-100 text-emerald-700" : r.status === "rejected" ? "bg-rose-100 text-rose-700" : r.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                  {r.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}