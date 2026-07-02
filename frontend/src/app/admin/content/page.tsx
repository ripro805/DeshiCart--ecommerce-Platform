"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useEffect, useState } from "react";
import { LayoutGrid, Save, Loader2, Plus, Trash2 } from "lucide-react";

export default function ContentPage() {
  const [content, setContent] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/api/content/homepage/");
        setContent(res);
      } catch {
        setContent({
          hero_title: "Welcome to DeshiCart",
          hero_subtitle: "Authentic products from across Bangladesh",
          featured_categories: [],
          promo_blocks: [],
        });
      } finally { setLoaded(true); }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await apiPost("/api/content/homepage/", content);
      alert("Content saved");
    } catch (e: any) { alert("Failed: " + e?.message); }
    finally { setSaving(false); }
  }

  function set(k: string, v: any) { setContent((f: any) => ({ ...f, [k]: v })); }

  if (!loaded) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Homepage Content</h1>
        <p className="text-sm text-slate-500">Configure what customers see on the homepage</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> Hero Section</h3>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Hero Title</label>
          <input value={content.hero_title || ""} onChange={(e) => set("hero_title", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Hero Subtitle</label>
          <textarea value={content.hero_subtitle || ""} onChange={(e) => set("hero_subtitle", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Promo Blocks</h3>
          <button type="button" onClick={() => set("promo_blocks", [...(content.promo_blocks || []), { title: "", text: "", color: "#4f46e5" }])} className="text-xs inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {(content.promo_blocks || []).map((b: any, i: number) => (
          <div key={i} className="border border-slate-200 rounded-md p-3 space-y-2 relative">
            <button type="button" onClick={() => set("promo_blocks", content.promo_blocks.filter((_: any, idx: number) => idx !== i))} className="absolute top-2 right-2 text-rose-600 p-1">
              <Trash2 className="h-3 w-3" />
            </button>
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Title" value={b.title || ""} onChange={(e) => set("promo_blocks", content.promo_blocks.map((x: any, idx: number) => idx === i ? { ...x, title: e.target.value } : x))} className="px-2 py-1 text-sm border border-slate-200 rounded col-span-2" />
              <input type="color" value={b.color || "#4f46e5"} onChange={(e) => set("promo_blocks", content.promo_blocks.map((x: any, idx: number) => idx === i ? { ...x, color: e.target.value } : x))} className="h-8 rounded border border-slate-200" />
            </div>
            <textarea placeholder="Description" value={b.text || ""} onChange={(e) => set("promo_blocks", content.promo_blocks.map((x: any, idx: number) => idx === i ? { ...x, text: e.target.value } : x))} rows={2} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Content
        </button>
      </div>
    </div>
  );
}