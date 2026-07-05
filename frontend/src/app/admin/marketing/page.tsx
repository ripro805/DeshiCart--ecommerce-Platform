"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Megaphone, Image as ImageIcon, Mail, BarChart3, ArrowRight,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { usePermission } from "@/components/admin/layout/role-guard";
import { ErrorState, LoadingState } from "@/components/admin/feedback/states";

const TILES = [
  {
    href: "/admin/marketing/campaigns",
    title: "Campaigns",
    desc: "Time-bound promotional campaigns and discounts",
    icon: Megaphone,
    tone: "bg-primary/10 text-primary",
  },
  {
    href: "/admin/marketing/banners",
    title: "Banners",
    desc: "Homepage hero and category banners",
    icon: ImageIcon,
    tone: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
  },
  {
    href: "/admin/marketing/newsletter",
    title: "Newsletter",
    desc: "Send email newsletters to subscribers",
    icon: Mail,
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  {
    href: "/admin/marketing/analytics",
    title: "Marketing Analytics",
    desc: "Campaign performance and conversion rates",
    icon: BarChart3,
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
];

export default function MarketingHub() {
  const { allowed, loading: permLoading } = usePermission("manage_marketing");
  const [counts, setCounts] = useState<{ campaigns?: number; banners?: number; subscribers?: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      try {
        const [c, b, n] = await Promise.allSettled([
          apiGet("/marketing/campaigns/"),
          apiGet("/marketing/banners/"),
          apiGet("/marketing/newsletter/"),
        ]);
        setCounts({
          campaigns: c.status === "fulfilled" ? (Array.isArray(c.value) ? c.value.length : (c.value as any)?.count ?? 0) : 0,
          banners:   b.status === "fulfilled" ? (Array.isArray(b.value) ? b.value.length : (b.value as any)?.count ?? 0) : 0,
          subscribers: n.status === "fulfilled" ? (Array.isArray(n.value) ? n.value.length : (n.value as any)?.count ?? 0) : 0,
        });
      } catch {
        setCounts({});
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed]);

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" message="You need the manage_marketing permission to view this page." />;

  const stats = [
    { label: "Active Campaigns", value: counts.campaigns ?? 0, tile: 0 },
    { label: "Banners",          value: counts.banners ?? 0,   tile: 1 },
    { label: "Subscribers",      value: counts.subscribers ?? 0, tile: 2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Marketing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Campaigns, banners, newsletters and analytics
        </p>
      </div>

      {loading ? (
        <LoadingState label="Loading counts…" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-2xl border border-border bg-surface p-6 transition hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${t.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}