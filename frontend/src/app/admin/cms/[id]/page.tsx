"use client";

import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Save, Loader2, Trash2 } from "lucide-react";

export default function EditCMSPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet(`/api/cms/pages/${id}/`);
        setForm(res);
      } catch { alert("Failed to load"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPatch(`/api/cms/pages/${id}/`, form);
      router.push("/admin/cms");
    } catch (e: any) { alert("Failed: " + (e?.message || "")); }
    finally { setSubmitting(false); }
  }

  async function del() {
    if (!confirm("Delete this page?")) return;
    await apiDelete(`/api/cms/pages/${id}/`);
    router.push("/admin/cms");
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!form) return null;

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Page</h1>
          <p className="text-sm text-slate-500">{form.title}</p>
        </div>
        <button type="button" onClick={del} className="inline-flex items-center gap-2 px-3 py-1.5 text-rose-600 text-sm bg-white border border-rose-200 rounded-md hover:bg-rose-50">
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input value={form.title || ""} onChange={(e) => set("title", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
            <input value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
          <textarea value={form.content || ""} onChange={(e) => set("content", e.target.value)} rows={14} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
          <input value={form.meta_title || ""} onChange={(e) => set("meta_title", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
          <textarea value={form.meta_description || ""} onChange={(e) => set("meta_description", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.is_published} onChange={(e) => set("is_published", e.target.checked)} className="rounded border-slate-300" />
          <span>Published</span>
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