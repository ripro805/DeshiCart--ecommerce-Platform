"use client";

import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";

export default function BannersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", image_url: "", link: "", position: "hero", is_active: true });

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/api/marketing/banners/");
      setItems(Array.isArray(res) ? res : res?.results || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiPost("/api/marketing/banners/", form);
      setShowForm(false);
      setForm({ title: "", image_url: "", link: "", position: "hero", is_active: true });
      void load();
    } catch (e: any) { alert("Failed: " + (e?.message || "")); }
  }

  async function del(id: number) {
    if (!confirm("Delete this banner?")) return;
    await apiDelete(`/api/marketing/banners/${id}/`);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Banners</h1>
          <p className="text-sm text-slate-500">Homepage and category page banners</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Banner
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
              <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
                <option value="hero">Hero (Homepage)</option>
                <option value="category">Category</option>
                <option value="sidebar">Sidebar</option>
                <option value="footer">Footer</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URL *</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} required placeholder="https://..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Link URL</label>
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">Create</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-slate-200">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No banners yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {items.map((b) => (
              <div key={b.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="aspect-[3/1] bg-slate-100 relative">
                  {b.image_url ? <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-400 text-xs">No image</div>}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{b.title}</h3>
                      <p className="text-xs text-slate-500 capitalize">{b.position}</p>
                    </div>
                    <button onClick={() => del(b.id)} className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}