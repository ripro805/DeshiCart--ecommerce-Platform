"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package, ShoppingCart, Users, Tag, Wallet, AlertTriangle,
  TrendingUp, Loader2, RefreshCw,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

type Stat = { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string; href?: string };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Parallel data fetch
      const [products, orders, users, categories] = await Promise.allSettled([
        apiGet<any>("/products/"),
        apiGet<any>("/orders/"),
        apiGet<any>("/auth/users/"),
        apiGet<any>("/categories/"),
      ]);
      const productCount = products.status === "fulfilled" ? (products.value?.count ?? (Array.isArray(products.value) ? products.value.length : 0)) : 0;
      const orderCount = orders.status === "fulfilled" ? (orders.value?.count ?? (Array.isArray(orders.value) ? orders.value.length : 0)) : 0;
      const userCount = users.status === "fulfilled" ? (users.value?.count ?? (Array.isArray(users.value) ? users.value.length : 0)) : 0;
      const categoryCount = categories.status === "fulfilled" ? (categories.value?.count ?? (Array.isArray(categories.value) ? categories.value.length : 0)) : 0;

      setStats([
        { label: "Products", value: productCount, icon: Package, color: "bg-indigo-500", href: "/admin/products" },
        { label: "Orders", value: orderCount, icon: ShoppingCart, color: "bg-emerald-500", href: "/admin/orders" },
        { label: "Users", value: userCount, icon: Users, color: "bg-amber-500", href: "/admin/users" },
        { label: "Categories", value: categoryCount, icon: Tag, color: "bg-rose-500", href: "/admin/categories" },
      ]);

      // Recent orders
      if (orders.status === "fulfilled") {
        const list = Array.isArray(orders.value) ? orders.value : (orders.value?.results ?? []);
        setRecentOrders(list.slice(0, 8));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your store activity</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-md hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Could not load some stats: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const inner = (
            <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-md ${s.color} text-white flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
          return s.href ? <Link key={s.label} href={s.href}>{inner}</Link> : <div key={s.label}>{inner}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">No orders yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Order</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs">#{String(o.id).slice(0, 8)}</td>
                    <td className="px-5 py-3 text-slate-700">{o.user_email || o.email || o.user?.email || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{o.status || "pending"}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{formatPrice(o.total_price ?? o.total ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-900">Quick links</h2>
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/admin/products/new" className="text-indigo-600 hover:underline">+ Add new product</Link></li>
            <li><Link href="/admin/orders?status=pending" className="text-indigo-600 hover:underline">Pending orders</Link></li>
            <li><Link href="/admin/users" className="text-indigo-600 hover:underline">Manage users</Link></li>
            <li><Link href="/admin/coupons" className="text-indigo-600 hover:underline">Coupons</Link></li>
            <li><Link href="/admin/reports" className="text-indigo-600 hover:underline">Export reports</Link></li>
            <li><Link href="/admin/store-settings" className="text-indigo-600 hover:underline">Store settings</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}