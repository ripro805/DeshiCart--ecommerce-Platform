"use client";

import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useEffect, useState } from "react";
import { Truck, Loader2, Save, Trash2, Plus } from "lucide-react";

export default function ShippingPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", cost: 0, eta_days: 3, is_active: true });

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/api/shipping/methods/");
      setMethods(Array.isArray(res) ? res : res?.results || []);
    } catch { setMethods([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost("/api/shipping/methods/", form);
      setShowForm(false);
      setForm({ name: "", cost: 0, eta_days: 3, is_active: true });
      await load();
    } catch (e: any) { alert("Failed: " + e?.message); }
    finally { setSaving(false); }
  }

  async function del(id: number) {
    if (!confirm("Delete this method?")) return;
    await apiDelete(`/api/shipping/methods/${id}/`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shipping Methods</h1>
          <p className="text-sm text-slate-500">Delivery options for customers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Add Method
        </button>
      </div>

      {showForm && (
        <form onSubmit={add} className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">New Shipping Method</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Express Delivery" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cost (BDT)</label>
              <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ETA (days)</label>
              <input type="number" value={form.eta_days} onChange={(e) => setForm({ ...form, eta_days: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-md">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : methods.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Truck className="h-12 w-12 mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No shipping methods configured</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">ETA</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {methods.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3">৳{m.cost}</td>
                  <td className="px-4 py-3 text-slate-600">{m.eta_days} days</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      {m.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => del(m.id)} className="text-rose-600 hover:bg-rose-50 p-1 rounded"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}