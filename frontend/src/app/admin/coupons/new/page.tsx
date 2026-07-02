"use client";

import { apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Loader2 } from "lucide-react";

export default function NewCouponPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount: "10",
    discount_type: "percentage",
    min_order_value: "0",
    usage_limit: "",
    valid_from: "",
    valid_to: "",
    is_active: true,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/api/coupons/", {
        ...form,
        discount: Number(form.discount),
        min_order_value: Number(form.min_order_value),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      });
      router.push("/admin/coupons");
    } catch (e: any) {
      alert("Failed: " + (e?.message || "unknown error"));
    } finally {
      setSubmitting(false);
    }
  }

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Coupon</h1>
        <p className="text-sm text-slate-500">Create a discount code</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
            <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type *</label>
            <select value={form.discount_type} onChange={(e) => set("discount_type", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <input value={form.description} onChange={(e) => set("description", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Discount Value *</label>
            <input type="number" step="0.01" value={form.discount} onChange={(e) => set("discount", e.target.value)} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Min Order Value</label>
            <input type="number" step="0.01" value={form.min_order_value} onChange={(e) => set("min_order_value", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usage Limit</label>
            <input type="number" value={form.usage_limit} onChange={(e) => set("usage_limit", e.target.value)} placeholder="Unlimited" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valid From</label>
            <input type="date" value={form.valid_from} onChange={(e) => set("valid_from", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valid To</label>
            <input type="date" value={form.valid_to} onChange={(e) => set("valid_to", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
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
          Create Coupon
        </button>
      </div>
    </form>
  );
}