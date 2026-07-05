"use client";

import { apiGet } from "@/lib/api";
import { useEffect, useState } from "react";
import {
  Loader2,
  Users,
  Mail,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react";

type Subscriber = {
  id: number;
  email: string;
  is_active?: boolean;
  subscribed_at?: string;
};

function fmt(d?: string): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export default function NewsletterPage() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const res: any = await apiGet("/marketing/newsletter/");
      const data = res?.results ?? res?.data ?? res;
      setSubs(Array.isArray(data) ? data : []);
    } catch {
      setSubs([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const active = subs.filter((s) => s.is_active).length;
  const filtered = search
    ? subs.filter((s) =>
        s.email.toLowerCase().includes(search.toLowerCase())
      )
    : subs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Newsletter subscribers
        </h1>
        <p className="text-sm text-muted-foreground">
          Email subscribers from the marketing signup form
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat
          label="Total subscribers"
          value={subs.length}
          icon={Users}
          color="text-primary bg-primary/10"
        />
        <Stat
          label="Active"
          value={active}
          icon={CheckCircle2}
          color="text-emerald-600 bg-emerald-50"
        />
        <Stat
          label="Unsubscribed"
          value={subs.length - active}
          icon={XCircle}
          color="text-slate-600 bg-muted"
        />
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <Mail className="h-4 w-4 text-primary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email…"
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
          />
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {subs.length}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {search
              ? "No subscribers match your search."
              : "No newsletter subscribers yet."}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      s.is_active
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {s.email}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {fmt(s.subscribed_at)}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    s.is_active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.is_active ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" /> Inactive
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
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
