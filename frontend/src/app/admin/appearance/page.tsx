"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useEffect, useState } from "react";
import { Palette, Save, Loader2 } from "lucide-react";

const THEMES = [
  { id: "light", label: "Light", preview: "#ffffff" },
  { id: "dark", label: "Dark", preview: "#0f172a" },
  { id: "festival", label: "Festival", preview: "#dc2626" },
  { id: "minimal", label: "Minimal", preview: "#f8fafc" },
];

const FONTS = ["Inter", "Roboto", "Poppins", "Open Sans", "Noto Sans Bengali"];

export default function AppearancePage() {
  const [form, setForm] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/api/appearance/theme/");
        setForm(res);
      } catch {
        setForm({ theme: "light", primary_color: "#4f46e5", font_family: "Inter", show_banner: true, header_layout: "standard" });
      } finally { setLoaded(true); }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await apiPost("/api/appearance/theme/", form);
      alert("Appearance saved");
    } catch (e: any) { alert("Failed: " + e?.message); }
    finally { setSaving(false); }
  }

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  if (!loaded) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Appearance</h1>
        <p className="text-sm text-slate-500">Theme, colors, and fonts</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4" /> Theme
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {THEMES.map((t) => (
            <button key={t.id} type="button" onClick={() => set("theme", t.id)} className={`border-2 rounded-lg p-4 text-center ${form.theme === t.id ? "border-indigo-600" : "border-slate-200"}`}>
              <div className="h-16 rounded mb-2" style={{ background: t.preview, border: "1px solid #e2e8f0" }} />
              <div className="text-sm font-medium">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Brand</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color || "#4f46e5"} onChange={(e) => set("primary_color", e.target.value)} className="h-10 w-12 rounded border border-slate-200" />
              <input value={form.primary_color || ""} onChange={(e) => set("primary_color", e.target.value)} className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Body Font</label>
            <select value={form.font_family || "Inter"} onChange={(e) => set("font_family", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
              {FONTS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Header Layout</label>
            <select value={form.header_layout || "standard"} onChange={(e) => set("header_layout", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
              <option value="standard">Standard</option>
              <option value="centered">Centered</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.show_banner} onChange={(e) => set("show_banner", e.target.checked)} className="rounded" />
          <span>Show promotional banner on homepage</span>
        </label>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </div>
    </div>
  );
}