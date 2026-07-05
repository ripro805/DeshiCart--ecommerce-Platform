"use client";

import { apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Loader2 } from "lucide-react";

export default function NewCMSPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", content: "", meta_title: "", meta_description: "", is_published: false });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/cms/pages/", form);
      router.push("/admin/cms");
    } catch (e: any) { alert("Failed: " + (e?.message || "")); }
    finally { setSubmitting(false); }
  }

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); }
  function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New CMS Page</h1>
        <p className="text-sm text-slate-500">Create a static content page</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!form.slug) set("slug", slugify(e.target.value));
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
          <textarea value={form.content} onChange={(e) => set("content", e.target.value)} required rows={12} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono" placeholder="<p>Page HTML or markdown...</p>" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
          <input value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
          <textarea value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_published} onChange={(e) => set("is_published", e.target.checked)} className="rounded border-slate-300" />
          <span>Publish immediately</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Create Page
        </button>
      </div>
    </form>
  );
}