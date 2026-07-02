"use client";

import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Save, Loader2, Trash2 } from "lucide-react";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, list]: any[] = await Promise.all([
          apiGet(`/api/categories/${id}/`),
          apiGet("/api/categories/").catch(() => []),
        ]);
        setForm(c);
        setCats(Array.isArray(list) ? list : list?.results || []);
      } catch { alert("Failed to load"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (payload.parent === "") delete payload.parent;
      if (payload.parent) payload.parent = Number(payload.parent);
      await apiPatch(`/api/categories/${id}/`, payload);
      router.push("/admin/categories");
    } catch (e: any) {
      alert("Failed: " + (e?.message || ""));
    } finally {
      setSubmitting(false);
    }
  }

  async function del() {
    if (!confirm("Delete this category? Subcategories will be orphaned.")) return;
    await apiDelete(`/api/categories/${id}/`);
    router.push("/admin/categories");
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!form) return null;

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Category</h1>
          <p className="text-sm text-slate-500">{form.name}</p>
        </div>
        <button type="button" onClick={del} className="inline-flex items-center gap-2 px-3 py-1.5 text-rose-600 text-sm bg-white border border-rose-200 rounded-md hover:bg-rose-50">
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input value={form.name || ""} onChange={(e) => set("name", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
            <input value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parent</label>
            <select value={form.parent || ""} onChange={(e) => set("parent", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
              <option value="">— Top Level —</option>
              {cats.filter((c) => c.id !== Number(id)).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
            <input type="number" value={form.display_order || 0} onChange={(e) => set("display_order", Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
          <input value={form.image_url || ""} onChange={(e) => set("image_url", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="rounded border-slate-300" />
          <span>Active</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>
    </form>
  );
}