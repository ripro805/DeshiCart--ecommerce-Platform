"use client";

import { apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Loader2 } from "lucide-react";

export default function NewCampaignPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    campaign_type: "sale",
    discount: "10",
    discount_type: "percentage",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/api/marketing/campaigns/", { ...form, discount: Number(form.discount) });
      router.push("/admin/marketing/campaigns");
    } catch (e: any) { alert("Failed: " + (e?.message || "")); }
    finally { setSubmitting(false); }
  }

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Campaign</h1>
        <p className="text-sm text-slate-500">Create a marketing campaign</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select value={form.campaign_type} onChange={(e) => set("campaign_type", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
              <option value="sale">Sale</option>
              <option value="seasonal">Seasonal</option>
              <option value="clearance">Clearance</option>
              <option value="bundle">Bundle</option>
              <option value="bogo">BOGO</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Discount *</label>
            <div className="flex gap-2">
              <input type="number" step="0.01" value={form.discount} onChange={(e) => set("discount", e.target.value)} required className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md" />
              <select value={form.discount_type} onChange={(e) => set("discount_type", e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-md">
                <option value="percentage">%</option>
                <option value="fixed">৳</option>
              </select>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
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
          Create Campaign
        </button>
      </div>
    </form>
  );
}