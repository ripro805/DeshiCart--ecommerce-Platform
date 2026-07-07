"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TicketPercent, Calendar, Plus } from "lucide-react";
import { apiGet } from "@/lib/api";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/feedback/states";
import { formatPrice, formatDate } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  PERCENT: "Percent",
  FIXED: "Fixed amount",
  FREE_SHIPPING: "Free shipping",
};

export default function CouponsPage() {
  const { allowed, loading: permLoading } = usePermissionState("manage_coupons");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      try {
        const res: any = await apiGet("/coupons/coupons/");
        setCoupons(Array.isArray(res) ? res : res?.results || []);
      } catch (e: any) {
        setLoadError(e?.message || "Failed to load coupons");
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed]);

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need manage_coupons to view this page." />;
  if (loading) return <LoadingState label="Loading coupons…" />;
  if (loadError) return <ErrorState title="Couldn't load coupons" description={loadError} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Coupons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Promotional codes and discounts ({coupons.length})
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Coupon
        </Link>
      </header>

      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <EmptyState
            icon={TicketPercent}
            title="No coupons yet"
            description="Create your first promotional code to drive conversions."
            action={<Link href="/admin/coupons/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"><Plus className="h-4 w-4" />New Coupon</Link>}
          />
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => {
            const used = c.used_count || 0;
            const max = c.max_uses || 0;
            const ratio = max > 0 ? Math.min(1, used / max) : 0;
            const expired = c.valid_to && new Date(c.valid_to).getTime() < Date.now();
            const status = c.is_flash_sale ? "flash" : expired ? "expired" : c.is_active ? "active" : "inactive";
            return (
              <article
                key={c.id}
                className="rounded-2xl border border-border bg-surface p-5 space-y-3 transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-lg font-semibold text-foreground">{c.code}</div>
                    <p className="text-xs text-muted-foreground">{c.description || "—"}</p>
                  </div>
                  <StatusPill status={status} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-primary">
                    {c.discount_type === "PERCENT"
                      ? `${c.value}%`
                      : c.discount_type === "FREE_SHIPPING"
                      ? "FREE"
                      : `৳${formatPrice(c.value)}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {TYPE_LABEL[c.discount_type] || c.discount_type}
                  </span>
                </div>

                {max > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>used {used}</span>
                      <span>of {max.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${expired ? "bg-muted-foreground/40" : "bg-primary"}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {c.valid_from ? formatDate(c.valid_from) : "—"} → {c.valid_to ? formatDate(c.valid_to) : "—"}
                </div>

                {c.min_order > 0 && (
                  <div className="text-[11px] text-muted-foreground">min order ৳{formatPrice(c.min_order)}</div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "active" | "inactive" | "flash" | "expired" }) {
  const map: Record<typeof status, { label: string; tone: string }> = {
    active: { label: "active", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
    inactive: { label: "inactive", tone: "bg-muted text-muted-foreground" },
    flash: { label: "⚡ flash", tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
    expired: { label: "expired", tone: "bg-muted text-muted-foreground" },
  };
  const { label, tone } = map[status];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{label}</span>;
}
