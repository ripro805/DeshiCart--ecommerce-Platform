"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";

type Category = { id: number; name: string };

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      apiGet(`/products/${id}/`),
      apiGet<any>("/categories/"),
    ]).then(([product, cats]: any) => {
      setForm({
        ...product,
        category: String(product.category?.id ?? product.category ?? ""),
      });
      setCategories(Array.isArray(cats) ? cats : cats?.results || []);
      setLoading(false);
    }).catch((e) => {
      setError(e?.message || "Failed to load product");
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        category: parseInt(form.category),
        stock: parseInt(form.stock || "0"),
        low_stock_threshold: parseInt(form.low_stock_threshold || "5"),
      };
      await apiPatch(`/products/${id}/`, payload);
      router.push("/admin/products");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await apiDelete(`/products/${id}/`);
      router.push("/admin/products");
    } catch {
      alert("Failed to delete product");
    }
  }

  function update(key: string, value: any) {
    setForm((f: any) => ({ ...f, [key]: value }));
  }

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 hover:bg-slate-100 rounded-md">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
            <p className="text-sm text-slate-500">#{id}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-rose-800 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name *" className="md:col-span-2">
            <input required value={form.name || ""} onChange={(e) => update("name", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </Field>
          <Field label="SKU">
            <input value={form.sku || ""} onChange={(e) => update("sku", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </Field>
          <Field label="Slug">
            <input value={form.slug || ""} onChange={(e) => update("slug", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </Field>
          <Field label="Brand">
            <input value={form.brand || ""} onChange={(e) => update("brand", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </Field>
          <Field label="Category *">
            <select required value={form.category} onChange={(e) => update("category", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Price *">
            <input required type="number" step="0.01" value={form.price || ""} onChange={(e) => update("price", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </Field>
          <Field label="Discounted Price">
            <input type="number" step="0.01" value={form.discounted_price || ""} onChange={(e) => update("discounted_price", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </Field>
          <Field label="Stock">
            <input type="number" value={form.stock ?? 0} onChange={(e) => update("stock", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </Field>
          <Field label="Image URL" className="md:col-span-2">
            <input value={form.image_external_url || ""} onChange={(e) => update("image_external_url", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </Field>
          <Field label="Short Description" className="md:col-span-2">
            <input value={form.short_description || ""} onChange={(e) => update("short_description", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </Field>
          <Field label="Description *" className="md:col-span-2">
            <textarea required rows={8} value={form.description || ""} onChange={(e) => update("description", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </Field>
        </div>

        <div className="flex gap-6 pt-4 border-t border-slate-200">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => update("is_active", e.target.checked)} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} />
            Featured
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Link href="/admin/products" className="px-4 py-2 text-sm border border-slate-200 rounded-md hover:bg-slate-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}