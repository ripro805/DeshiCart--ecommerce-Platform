"use client";

import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Loader2, FileText } from "lucide-react";
import Link from "next/link";

export default function CMSPages() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/api/cms/pages/");
      setItems(Array.isArray(res) ? res : res?.results || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function del(id: number) {
    if (!confirm("Delete this page?")) return;
    await apiDelete(`/api/cms/pages/${id}/`);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CMS Pages</h1>
          <p className="text-sm text-slate-500">Static pages: About, Terms, Privacy, etc.</p>
        </div>
        <Link href="/admin/cms/new" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Page
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No pages yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Title</th>
                <th className="px-5 py-3 text-left">Slug</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">/{p.slug}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.is_published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {p.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{new Date(p.updated_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/cms/${p.id}`} className="inline-flex p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button onClick={() => del(p.id)} className="inline-flex p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded">
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