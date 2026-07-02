"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useEffect, useState } from "react";
import { Settings, Save, Loader2 } from "lucide-react";

export default function StoreSettingsPage() {
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/api/store/settings/");
        setForm(res);
      } catch {
        setForm({
          store_name: "DeshiCart",
          store_email: "support@deshicart.bd",
          store_phone: "+880 1700 000000",
          currency: "BDT",
          tax_rate: 5,
          min_order: 500,
          free_shipping_threshold: 3000,
          payment_methods: ["cod", "bkash", "nagad", "card"],
        });
      } finally { setLoaded(true); }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost("/api/store/settings/", form);
      alert("Settings saved");
    } catch (e: any) { alert("Save failed: " + e?.message); }
    finally { setSaving(false); }
  }

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  if (!loaded) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <form onSubmit={save} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Store Settings</h1>
        <p className="text-sm text-slate-500">General configuration for your store</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Settings className="h-4 w-4" /> General
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Store Name">
            <input value={form.store_name || ""} onChange={(e) => set("store_name", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </Field>
          <Field label="Currency">
            <select value={form.currency || "BDT"} onChange={(e) => set("currency", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
              <option>BDT</option><option>USD</option><option>INR</option>
            </select>
          </Field>
          <Field label="Support Email">
            <input type="email" value={form.store_email || ""} onChange={(e) => set("store_email", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </Field>
          <Field label="Support Phone">
            <input value={form.store_phone || ""} onChange={(e) => set("store_phone", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Commerce</h3>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Tax Rate (%)">
            <input type="number" value={form.tax_rate || 0} onChange={(e) => set("tax_rate", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </Field>
          <Field label="Min Order (BDT)">
            <input type="number" value={form.min_order || 0} onChange={(e) => set("min_order", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </Field>
          <Field label="Free Shipping Above (BDT)">
            <input type="number" value={form.free_shipping_threshold || 0} onChange={(e) => set("free_shipping_threshold", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </Field>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Payment Methods</label>
          <div className="flex flex-wrap gap-3">
            {[{ k: "cod", l: "Cash on Delivery" }, { k: "bkash", l: "bKash" }, { k: "nagad", l: "Nagad" }, { k: "card", l: "Card" }].map((m) => (
              <label key={m.k} className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.payment_methods?.includes(m.k)}
                  onChange={(e) => {
                    const next = new Set(form.payment_methods || []);
                    if (e.target.checked) next.add(m.k); else next.delete(m.k);
                    set("payment_methods", Array.from(next));
                  }}
                />
                {m.l}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}