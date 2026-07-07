"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/feedback/states";
import { formatDate } from "@/lib/utils";

export default function CMSPages() {
  const { allowed, loading: permLoading } = usePermissionState("manage_cms");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { ask, dialog: confirmDialog } = useConfirm();

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res: any = await apiGet("/cms/pages/");
      setItems(Array.isArray(res) ? res : res?.results || []);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (allowed) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  async function del(p: any) {
    const ok = await ask({
      title: "Delete this page?",
      description: `"${p.title}" will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await apiDelete(`/cms/pages/${p.id}/`);
      setItems((xs) => xs.filter((x) => x.id !== p.id));
      toast.success("Page deleted");
    } catch (e: any) {
      toast.error("Delete failed", e?.message || "Please try again");
    }
  }

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need the manage_cms permission to view pages." />;
  if (loading) return <LoadingState label="Loading pages…" />;
  if (loadError) return <ErrorState title="Couldn't load pages" description={loadError} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">CMS Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Static pages: About, Terms, Privacy, etc.
          </p>
        </div>
        <Link
          href="/admin/cms/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Page
        </Link>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        {items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title="No pages yet"
              description="Create your first CMS page — About, Terms, Privacy, etc."
              action={<Link href="/admin/cms/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"><Plus className="h-4 w-4" />New Page</Link>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((p) => (
                  <tr key={p.id} className="transition hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      /{p.slug}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.is_published
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatDate(p.updated_at || p.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/admin/cms/${p.id}`}
                          className="inline-flex items-center gap-1 rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => del(p)}
                          className="inline-flex items-center gap-1 rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {confirmDialog}
    </div>
  );
}