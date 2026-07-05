"use client";

import { apiGet, apiPatch } from "@/lib/api";
import { useEffect, useState } from "react";
import {
  Megaphone,
  Loader2,
  Power,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type Campaign = {
  id: number;
  name: string;
  description?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  created_at?: string;
};

function fmt(d?: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

export default function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/marketing/campaigns/");
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

  async function toggle(id: number, current: boolean) {
    try {
      await apiPatch(`/marketing/campaigns/${id}/`, { is_active: !current });
      setItems((xs) =>
        xs.map((x) => (x.id === id ? { ...x, is_active: !current } : x))
      );
    } catch (e: any) {
      alert("Failed: " + (e?.message || ""));
    }
  }

  const active = items.filter((c) => c.is_active).length;
  const total = items.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
        <p className="text-sm text-muted-foreground">
          Marketing campaigns driving site-wide promotions
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat
          label="Total"
          value={total}
          icon={Megaphone}
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
          value={total - active}
          icon={XCircle}
          color="text-slate-600 bg-muted"
        />
      </div>

      <section className="rounded-lg border border-border bg-surface">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No campaigns yet. Create one via{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              admin → Marketing → Campaigns
            </code>{" "}
            in Django admin, or POST to{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              /api/marketing/campaigns/
            </code>
            .
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((c) => {
              const start = fmt(c.starts_at);
              const end = fmt(c.ends_at);
              return (
                <li
                  key={c.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-muted/40"
                >
                  <div
                    className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      c.is_active
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {c.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          c.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {c.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    )}
                    {(start || end) && (
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {start && <span>Start {start}</span>}
                        {start && end && <span>→</span>}
                        {end && <span>End {end}</span>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggle(c.id, c.is_active)}
                    title={c.is_active ? "Deactivate" : "Activate"}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-muted ${
                      c.is_active
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
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