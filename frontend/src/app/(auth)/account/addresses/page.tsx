"use client";

import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Loader2, Save } from "lucide-react";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "Home", line1: "", city: "", postcode: "", phone: "", is_default: false });

  async function load() {
    try {
      const res: any = await apiGet("/addresses/");
      setAddresses(Array.isArray(res) ? res : res?.results || []);
    } catch { setAddresses([]); }
  }

  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost("/addresses/", form);
      setShowForm(false);
      setForm({ label: "Home", line1: "", city: "", postcode: "", phone: "", is_default: false });
      await load();
    } catch (e: any) { alert("Failed: " + e?.message); }
    finally { setSaving(false); }
  }

  async function del(id: number) {
    if (!confirm("Delete this address?")) return;
    await apiDelete(`/addresses/${id}/`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Addresses</h1>
          <p className="text-sm text-slate-500">Manage shipping addresses</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Add Address
        </button>
      </div>

      {showForm && (
        <form onSubmit={add} className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Label</label>
              <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
                <option>Home</option><option>Office</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
              <input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Postcode</label>
              <input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm mt-3">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
            Set as default address
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-md">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <MapPin className="h-12 w-12 mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No addresses saved</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className="bg-white rounded-lg border border-slate-200 p-4 relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-slate-900">{a.label}</div>
                  {a.is_default && <span className="text-xs text-indigo-600">default</span>}
                </div>
                <button onClick={() => del(a.id)} className="text-rose-600 p-1 hover:bg-rose-50 rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
              <p className="mt-2 text-sm text-slate-700">{a.line1}</p>
              <p className="text-sm text-slate-700">{a.city} {a.postcode}</p>
              {a.phone && <p className="text-sm text-slate-500 mt-1">{a.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}