"use client";

import { apiGet } from "@/lib/api";
import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  Link as LinkIcon,
  MapPin,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

type Banner = {
  id: number;
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
  position?: string;
  is_active?: boolean;
  order?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
};

const POSITION_COLOR: Record<string, string> = {
  HERO: "bg-violet-50 text-violet-700",
  SIDEBAR: "bg-sky-50 text-sky-700",
  FOOTER: "bg-amber-50 text-amber-700",
  POPUP: "bg-rose-50 text-rose-700",
  CATEGORY: "bg-emerald-50 text-emerald-700",
};

function fmt(d?: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

export default function BannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/marketing/banners/");
      const data = res?.results ?? res?.data ?? res;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const active = items.filter((b) => b.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Banners</h1>
        <p className="text-sm text-muted-foreground">
          Hero, sidebar, footer, popup, and category banners
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          label="Total"
          value={items.length}
          icon={ImageIcon}
          color="text-primary bg-primary/10"
        />
        <Stat
          label="Active"
          value={active}
          icon={CheckCircle2}
          color="text-emerald-600 bg-emerald-50"
        />
        <Stat
          label="Inactive"
          value={items.length - active}
          icon={XCircle}
          color="text-slate-600 bg-muted"
        />
        <Stat
          label="Positions"
          value={
            new Set(items.map((b) => b.position).filter(Boolean)).size
          }
          icon={MapPin}
          color="text-violet-600 bg-violet-50"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          No banners yet. Add banners via Django admin at{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            /admin/marketing/banner/
          </code>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((b) => {
            const start = fmt(b.starts_at);
            const end = fmt(b.ends_at);
            return (
              <article
                key={b.id}
                className="overflow-hidden rounded-lg border border-border bg-surface"
              >
                <div className="relative aspect-[16/9] w-full bg-muted">
                  {b.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.image}
                      alt={b.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="absolute left-2 top-2 flex gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        POSITION_COLOR[b.position ?? ""] ??
                        "bg-muted text-foreground"
                      }`}
                    >
                      {b.position || "—"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        b.is_active
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      {b.is_active ? "Live" : "Off"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {b.title}
                  </h3>
                  {b.subtitle && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {b.subtitle}
                    </p>
                  )}
                  {b.link && (
                    <a
                      href={b.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      <LinkIcon className="h-3 w-3" />
                      <span className="truncate">{b.link}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                    <span>Order: {b.order ?? 0}</span>
                    {(start || end) && (
                      <span>
                        {start ?? "—"} → {end ?? "—"}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}