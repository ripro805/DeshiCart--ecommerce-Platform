"use client";

import { apiGet } from "@/lib/api";
import { Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const REPORTS = [
  { key: "sales", title: "Sales Report", description: "Daily, weekly, monthly revenue and order trends", endpoint: "/api/reports/sales/", filename: "sales.csv" },
  { key: "products", title: "Products Inventory", description: "Stock levels, units sold, products status", endpoint: "/api/reports/products/", filename: "products.csv" },
  { key: "customers", title: "Customers", description: "Customer list with order counts and total spend", endpoint: "/api/reports/customers/", filename: "customers.csv" },
  { key: "orders", title: "Orders", description: "All orders with status, totals, dates", endpoint: "/api/reports/orders/", filename: "orders.csv" },
  { key: "tax", title: "Tax & VAT", description: "Tax collected per period", endpoint: "/api/reports/tax/", filename: "tax.csv" },
  { key: "shipping", title: "Shipping", description: "Shipping methods and delivery performance", endpoint: "/api/reports/shipping/", filename: "shipping.csv" },
];

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/api/reports/summary/");
        setStats(res);
      } catch {}
    })();
  }, []);

  async function download(r: any) {
    try {
      const res: any = await apiGet(r.endpoint);
      const data = Array.isArray(res) ? res : res?.results || [];
      if (!data.length) { alert("No data"); return; }
      const headers = Object.keys(data[0]);
      const csv = [headers.join(","), ...data.map((row: any) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = r.filename; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { alert("Download failed: " + e?.message); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">Download CSV exports from your store</p>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Total Revenue</div>
            <div className="text-2xl font-bold mt-1">৳{stats.total_revenue?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Total Orders</div>
            <div className="text-2xl font-bold mt-1">{stats.total_orders?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Total Customers</div>
            <div className="text-2xl font-bold mt-1">{stats.total_customers?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Total Products</div>
            <div className="text-2xl font-bold mt-1">{stats.total_products?.toLocaleString() || 0}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <div key={r.key} className="bg-white rounded-lg border border-slate-200 p-5 flex items-start gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{r.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{r.description}</p>
            </div>
            <button onClick={() => download(r)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100">
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}