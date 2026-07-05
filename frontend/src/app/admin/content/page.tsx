"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, HelpCircle, LinkIcon } from "lucide-react";
import { apiGet } from "@/lib/api";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { ErrorState, LoadingState } from "@/components/admin/feedback/states";
import { toast } from "@/components/admin/feedback/toast-store";

type Page = { id: number; title: string; slug: string };
type FAQ = { id: number; question: string; answer: string };
type ContentHome = { pages?: Page[]; faqs?: FAQ[] };

export default function ContentPage() {
  const { allowed, loading: permLoading } = usePermissionState("manage_content");
  const [data, setData] = useState<ContentHome>({ pages: [], faqs: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      try {
        const res: any = await apiGet("/content/home/");
        const payload = res?.data ?? res ?? {};
        setData({
          pages: Array.isArray(payload.pages) ? payload.pages : [],
          faqs: Array.isArray(payload.faqs) ? payload.faqs : [],
        });
      } catch (e: any) {
        setLoadError(e?.message || "Failed to load content");
        toast.error("Content load failed", e?.message || "Try again");
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed]);

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need manage_content to view this page." />;
  if (loading) return <LoadingState label="Loading content…" />;
  if (loadError) return <ErrorState title="Couldn't load content" description={loadError} />;

  const pages = data.pages ?? [];
  const faqs = data.faqs ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Public-facing content surfaced across the storefront
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-3xl font-semibold tabular-nums text-foreground">{pages.length}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Published pages</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <HelpCircle className="h-5 w-5" />
          </div>
          <p className="text-3xl font-semibold tabular-nums text-foreground">{faqs.length}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Active FAQs</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Quick links
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link
              href="/admin/cms"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-foreground hover:bg-muted"
            >
              <LinkIcon className="h-4 w-4 text-primary" />
              Manage CMS pages
            </Link>
            <Link
              href="/admin/support"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-foreground hover:bg-muted"
            >
              <LinkIcon className="h-4 w-4 text-primary" />
              Manage FAQs & tickets
            </Link>
            <Link
              href="/admin/appearance"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-foreground hover:bg-muted"
            >
              <LinkIcon className="h-4 w-4 text-primary" />
              Hero & theme
            </Link>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Published pages</h2>
          <span className="text-xs text-muted-foreground">{pages.length} total</span>
        </header>
        {pages.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No published pages yet
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {pages.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                  <p className="truncate text-xs text-muted-foreground">/{p.slug}</p>
                </div>
                <Link href="/admin/cms" className="text-xs font-medium text-primary hover:underline">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Active FAQs</h2>
          <span className="text-xs text-muted-foreground">{faqs.length} total</span>
        </header>
        {faqs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No active FAQs yet
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {faqs.map((f) => (
              <li key={f.id} className="px-5 py-4 hover:bg-muted/30">
                <p className="text-sm font-medium text-foreground">{f.question}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{f.answer}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}