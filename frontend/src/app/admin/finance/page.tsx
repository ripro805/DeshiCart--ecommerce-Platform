"use client";

import { useEffect, useState } from "react";
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight,
  Receipt, Loader2,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/feedback/states";
import { formatPrice, formatDate } from "@/lib/utils";

type TxType = "INCOME" | "EXPENSE" | "REFUND" | string;

const TYPE_TONE: Record<string, string> = {
  INCOME:  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  EXPENSE: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  REFUND:  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

const TYPE_SIGN: Record<string, string> = {
  INCOME:  "+",
  REFUND:  "+",
  EXPENSE: "−",
};

const TYPE_AMOUNT_COLOR: Record<string, string> = {
  INCOME:  "text-emerald-700 dark:text-emerald-300",
  REFUND:  "text-amber-700 dark:text-amber-300",
  EXPENSE: "text-rose-700 dark:text-rose-300",
};

function Kpi({
  label, value, icon: Icon, tone, sign,
}: { label: string; value: string; icon: any; tone: string; sign?: "pos" | "neg" }) {
  const valueTone =
    sign === "pos" ? "text-emerald-700 dark:text-emerald-300" :
    sign === "neg" ? "text-rose-700 dark:text-rose-300" :
    "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`mt-3 text-2xl font-semibold tabular-nums ${valueTone}`}>৳{value}</p>
    </div>
  );
}

export default function FinancePage() {
  const { allowed, loading: permLoading } = usePermissionState("manage_finance");
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [s, t]: any = await Promise.all([
          apiGet("/finance/summary/").catch(() => null),
          apiGet("/finance/transactions/").catch(() => []),
        ]);
        setSummary(s);
        setTransactions(Array.isArray(t) ? t : t?.results || []);
      } catch (e: any) {
        setLoadError(e?.message || "Failed to load finance data");
        toast.error("Finance data failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed]);

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need the manage_finance permission to view this page." />;
  if (loading) return <LoadingState label="Loading finance data…" />;
  if (loadError) return <ErrorState title="Couldn't load finance" description={loadError} />;

  const income  = Number(summary?.total_income   ?? summary?.total_revenue ?? 0);
  const expense = Number(summary?.total_expense  ?? summary?.total_payouts ?? 0);
  const refund  = Number(summary?.total_refunds  ?? 0);
  const net     = Number(summary?.net_profit     ?? income - expense - refund);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Finance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenue, payouts, and transactions
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Total Income"
          value={formatPrice(income)}
          icon={TrendingUp}
          tone="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        />
        <Kpi
          label="Expenses"
          value={formatPrice(expense)}
          icon={ArrowUpRight}
          tone="bg-rose-500/15 text-rose-700 dark:text-rose-300"
        />
        <Kpi
          label="Refunds"
          value={formatPrice(refund)}
          icon={ArrowDownRight}
          tone="bg-amber-500/15 text-amber-700 dark:text-amber-300"
        />
        <Kpi
          label="Net"
          value={formatPrice(net)}
          icon={Wallet}
          tone={net >= 0
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-rose-500/15 text-rose-700 dark:text-rose-300"}
          sign={net >= 0 ? "pos" : "neg"}
        />
      </div>

      {/* Transactions table */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="flex items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Recent Transactions</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {transactions.length === 0
                ? "No transactions recorded yet"
                : `${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </header>

        {transactions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Income, expenses, and refunds will appear here once orders are placed."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((t) => {
                  const type = (t.type || "") as TxType;
                  const tone = TYPE_TONE[type] || "bg-muted text-muted-foreground";
                  const sign = TYPE_SIGN[type] || "";
                  const color = TYPE_AMOUNT_COLOR[type] || "text-foreground";
                  return (
                    <tr key={t.id} className="transition hover:bg-muted/40">
                      <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
                          {type || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-foreground">
                        {t.description || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {t.reference || t.order_id || "—"}
                      </td>
                      <td className={`whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums ${color}`}>
                        {sign}৳{formatPrice(t.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}