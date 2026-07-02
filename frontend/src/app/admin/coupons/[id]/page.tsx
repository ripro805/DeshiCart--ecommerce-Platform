"use client";

import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Save, Loader2, Trash2 } from "lucide-react";

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet(`/api/coupons/${id}/`);
        setForm(res);
      } catch { alert("Failed to load"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPatch(`/api/coupons/${id}/`, form);
      router.push("/admin/coupons");
    } catch (e: any) {
      alert("Failed: " + (e?.message || ""));
    } finally {
      setSubmitting(false);
    }
  }

  async function del() {
    if (!confirm("Delete this coupon?")) return;
    await apiDelete(`/api/coupons/${id}/`);
    router.push("/admin/coupons");
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!form) return null;

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Coupon</h1>
          <p className="text-sm text-slate-500 font-mono">{form.code}</p>
        </div>
        <button type="button" onClick={del} className="inline-flex items-center gap-2 px-3 py-1.5 text-rose-600 text-sm bg-white border border-rose-200 rounded-md hover:bg-rose-50">
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <input value={form.code || ""} onChange={(e) => set("code", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select value={form.discount_type || "percentage"} onChange={(e) => set("discount_type", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <input value={form.description || ""} onChange={(e) => set("description", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Discount</label>
            <input type="number" step="0.01" value={form.discount || 0} onChange={(e) => set("discount", Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Min Order</label>
            <input type="number" step="0.01" value={form.min_order_value || 0} onChange={(e) => set("min_order_value", Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usage Limit</label>
            <input type="number" value={form.usage_limit || ""} onChange={(e) => set("usage_limit", e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valid From</label>
            <input type="date" value={form.valid_from?.split("T")[0] || ""} onChange={(e) => set("valid_from", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valid To</label>
            <input type="date" value={form.valid_to?.split("T")[0] || ""} onChange={(e) => set("valid_to", e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="rounded border-slate-300" />
          <span>Active</span>
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