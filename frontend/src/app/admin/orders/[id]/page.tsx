"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api";
import { formatPrice, formatDateTime } from "@/lib/utils";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrderDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet(`/orders/${id}/`).then((data: any) => {
      setOrder(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function updateStatus(newStatus: string) {
    setSaving(true);
    try {
      await apiPatch(`/orders/${id}/`, { status: newStatus });
      setOrder((o: any) => ({ ...o, status: newStatus }));
    } catch {
      alert("Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return <div className="p-8 text-center text-slate-500">Order not found</div>;
  }

  const items = order.items || order.cart_items || order.order_items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order #{String(order.id).slice(0, 8)}</h1>
          <p className="text-sm text-slate-500">{formatDateTime(order.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Items ({items.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it: any, i: number) => (
                  <tr key={i}>
                    <td className="px-5 py-3">{it.product?.name || it.name || `Item #${i + 1}`}</td>
                    <td className="px-5 py-3 text-right">{it.quantity}</td>
                    <td className="px-5 py-3 text-right">{formatPrice(it.price || it.unit_price)}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatPrice((it.price || 0) * (it.quantity || 1))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-5 py-3 text-right font-medium">Total</td>
                  <td className="px-5 py-3 text-right font-bold text-lg">{formatPrice(order.total_price ?? order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Status</h2>
            <div className="space-y-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={saving || order.status === s}
                  className={`w-full px-3 py-2 text-sm rounded-md capitalize text-left flex items-center justify-between ${
                    order.status === s ? "bg-indigo-600 text-white" : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <span>{s}</span>
                  {order.status === s && <Save className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Customer</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="font-medium">{order.user_email || order.email || order.user?.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd>{order.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Address</dt>
                <dd className="whitespace-pre-line">{order.shipping_address || order.address || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}