"use client";

import { apiGet } from "@/lib/api";
import { useEffect, useState } from "react";
import { Wallet, Loader2, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function FinancePage() {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, t]: any = await Promise.all([
          apiGet("/api/finance/summary/").catch(() => null),
          apiGet("/api/finance/transactions/").catch(() => []),
        ]);
        setSummary(s);
        setTransactions(Array.isArray(t) ? t : t?.results || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-500">Revenue, payouts, and transactions</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Total Revenue</div>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold mt-1">৳{summary?.total_revenue?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Payouts</div>
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold mt-1">৳{summary?.total_payouts?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Refunds</div>
            <ArrowDownRight className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold mt-1">৳{summary?.total_refunds?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Net Profit</div>
            <Wallet className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold mt-1">৳{summary?.net_profit?.toLocaleString() || 0}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-16">
            <Wallet className="h-12 w-12 mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No transactions yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{t.description}</td>
                  <td className={`px-4 py-3 text-right font-medium ${t.type === "credit" ? "text-emerald-700" : "text-rose-700"}`}>
                    {t.type === "credit" ? "+" : "-"}৳{parseFloat(t.amount || 0).toLocaleString()}
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