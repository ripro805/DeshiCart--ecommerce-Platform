"use client";

import { apiPost, apiGet } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";

export default function NewCategoryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parent: "",
    display_order: "0",
    image_url: "",
    is_active: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/categories/");
        const list = Array.isArray(res) ? res : res?.results || [];
        setCategories(list);
      } catch {}
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
        await apiPost("/categories/", {
        ...form,
        parent: form.parent ? Number(form.parent) : null,
        display_order: Number(form.display_order),
      });
      router.push("/admin/categories");
    } catch (e: any) {
      alert("Failed: " + (e?.message || "unknown"));
    } finally {
      setSubmitting(false);
    }
  }

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); }
  function nameToSlug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Category</h1>
        <p className="text-sm text-slate-500">Add a top-level or subcategory</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!form.slug) set("slug", nameToSlug(e.target.value));
              }}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category</label>
            <select value={form.parent} onChange={(e) => set("parent", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
              <option value="">— Top Level —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
            <input type="number" value={form.display_order} onChange={(e) => set("display_order", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
          <input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="rounded border-slate-300" />
          <span>Active</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Create Category
        </button>
      </div>
    </form>
  );
}