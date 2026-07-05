"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  Globe,
  Loader2,
  Save,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { usePermission } from "@/components/admin/layout/role-guard";
import {
  ErrorState,
  LoadingState,
} from "@/components/admin/feedback/states";

type Page = {
  id: number;
  title: string;
  slug: string;
  content?: string;
  is_published?: boolean;
  meta_description?: string | null;
  meta_keywords?: string | null;
  author?: string | null;
  author_email?: string | null;
  created_at?: string;
  updated_at?: string | null;
  views?: number;
};

export default function CmsPageDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const canManage = usePermission("manage_cms");
  const { ask, dialog: confirmDialog } = useConfirm();

  const [row, setRow] = useState<Page | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [metaKw, setMetaKw] = useState("");
  const [published, setPublished] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await apiGet(`/cms/pages/${id}/`);
      const p: Page = {
        id: res?.id,
        title: res?.title || "",
        slug: res?.slug || "",
        content: res?.content ?? "",
        is_published: res?.is_published ?? false,
        meta_description: res?.meta_description ?? "",
        meta_keywords: res?.meta_keywords ?? "",
        author: res?.author ?? null,
        author_email: res?.author_email ?? null,
        created_at: res?.created_at,
        updated_at: res?.updated_at ?? null,
        views: res?.views ?? 0,
      };
      setRow(p);
      setTitle(p.title);
      setSlug(p.slug);
      setContent(p.content || "");
      setMetaDesc(p.meta_description || "");
      setMetaKw(p.meta_keywords || "");
      setPublished(!!p.is_published);
      setDirty(false);
    } catch (e: any) {
      setError(e?.message || "Failed to load page.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void load();
  }, [id, load]);

  // Auto-slug from title.
  useEffect(() => {
    if (!row) return;
    if (title && !slug) {
      setSlug(
        title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const onSave = useCallback(async () => {
    if (!row) return;
    if (!canManage) {
      toast.error("You don't have permission to manage CMS pages.");
      return;
    }
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        content,
        meta_description: metaDesc,
        meta_keywords: metaKw,
        is_published: published,
      };
      const res: any = await apiPatch(`/cms/pages/${row.id}/`, payload);
      setRow((r) =>
        r
          ? {
              ...r,
              title: payload.title,
              slug: payload.slug,
              content: payload.content,
              meta_description: payload.meta_description,
              meta_keywords: payload.meta_keywords,
              is_published: payload.is_published,
              updated_at: res?.updated_at ?? new Date().toISOString(),
            }
          : r
      );
      setDirty(false);
      toast.success("Page saved.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save page.");
    } finally {
      setSaving(false);
    }
  }, [row, canManage, title, slug, content, metaDesc, metaKw, published]);

  const removePage = useCallback(async () => {
    if (!row) return;
    const ok = await ask({
      title: "Delete this page?",
      description: `Page “${row.title}” will be permanently removed and unavailable at /${row.slug}.`,
      confirmLabel: "Delete page",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await apiDelete(`/cms/pages/${row.id}/`);
      toast.success("Page deleted.");
      router.push("/admin/cms");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete page.");
    }
  }, [row, ask, router]);

  const togglePublish = useCallback(async () => {
    if (!row) return;
    if (!canManage) return;
    const next = !published;
    setPublished(next);
    setSaving(true);
    try {
      await apiPatch(`/cms/pages/${row.id}/`, { is_published: next });
      setRow((r) => (r ? { ...r, is_published: next } : r));
      toast.success(next ? "Page published." : "Page unpublished.");
    } catch (e: any) {
      setPublished(!next);
      toast.error(e?.message || "Failed to toggle publish.");
    } finally {
      setSaving(false);
    }
  }, [row, canManage, published]);

  const wordCount = content
    ? content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const readMinutes = Math.max(1, Math.round(wordCount / 200));

  if (loading) {
    return <LoadingState label="Loading page…" />;
  }
  if (error || !row) {
    return (
      <ErrorState
        title="Couldn't load this page"
        message={error || "Page not found."}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/cms"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            CMS
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{row.title}</h1>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              /{row.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" />
            {showPreview ? "Hide preview" : "Preview"}
          </button>
          <button
            type="button"
            onClick={() => void togglePublish()}
            disabled={!canManage || saving}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
              published
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            {published ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Published
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5" />
                Publish
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={!canManage || saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: content editor */}
        <div className="space-y-6 lg:col-span-2">
          <Section icon={<FileText className="h-4 w-4 text-primary" />} title="Content">
            <Field label="Title" required>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
                disabled={!canManage}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              />
            </Field>

            <Field label="Slug" required hint="URL-safe identifier — lowercase letters, digits and dashes.">
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setDirty(true);
                }}
                disabled={!canManage}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              />
            </Field>

            <Field
              label={`Body content · ${wordCount} words · ${readMinutes} min read`}
            >
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setDirty(true);
                }}
                disabled={!canManage}
                rows={18}
                placeholder="Start writing your page content here. Plain text and markdown-style formatting are supported."
                className="w-full rounded-md border border-border bg-background px-3 py-3 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              />
            </Field>

            {showPreview ? (
              <div className="mt-3 rounded-md border border-border bg-background p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Live preview
                </p>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  {title || "Untitled"}
                </h2>
                <div className="whitespace-pre-line text-sm text-foreground">
                  {content || "No content yet."}
                </div>
              </div>
            ) : null}
          </Section>

          {/* Danger zone */}
          {canManage ? (
            <section className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <h2 className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                  Danger zone
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Permanently delete this page. The URL /{row.slug} will stop working immediately.
              </p>
              <button
                onClick={() => void removePage()}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-background px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete page
              </button>
            </section>
          ) : null}
        </div>

        {/* Right: SEO + meta */}
        <div className="space-y-6">
          <Section icon={<Search className="h-4 w-4 text-primary" />} title="SEO">
            <Field
              label="Meta description"
              hint="Shown in search results. 120-160 chars recommended."
            >
              <textarea
                rows={3}
                value={metaDesc}
                onChange={(e) => {
                  setMetaDesc(e.target.value);
                  setDirty(true);
                }}
                disabled={!canManage}
                placeholder="Brief description for search engines and social previews…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {metaDesc.length}/160
              </p>
            </Field>

            <Field
              label="Meta keywords"
              hint="Comma-separated. Used by older search engines."
            >
              <input
                value={metaKw}
                onChange={(e) => {
                  setMetaKw(e.target.value);
                  setDirty(true);
                }}
                disabled={!canManage}
                placeholder="deshi cart, ecommerce, deals"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              />
            </Field>
          </Section>

          <Section title="Search engine preview">
            <div className="space-y-1 rounded-md border border-border bg-background p-3">
              <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
                deshishop.com/p/{slug || row.slug || "page-slug"}
              </p>
              <p className="text-base font-medium text-primary">
                {title || row.title || "Untitled"}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {metaDesc ||
                  content
                    .replace(/[#*_`]/g, "")
                    .slice(0, 160) ||
                  "No description provided."}
              </p>
            </div>
          </Section>

          <Section title="Meta">
            <dl className="space-y-2 text-sm">
              <Row label="ID">#{row.id}</Row>
              <Row label="Author">
                {row.author || row.author_email || "—"}
              </Row>
              <Row label="Views">{row.views ?? 0}</Row>
              <Row label="Created">
                {row.created_at
                  ? new Date(row.created_at).toLocaleString()
                  : "—"}
              </Row>
              <Row label="Updated">
                {row.updated_at
                  ? new Date(row.updated_at).toLocaleString()
                  : "—"}
              </Row>
              <Row label="Status">
                {published ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    Draft
                  </span>
                )}
              </Row>
            </dl>
            {dirty ? (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                Unsaved changes — click Save.
              </p>
            ) : null}
          </Section>
        </div>
      </div>

      {confirmDialog}
    </div>
  );
}

// ───── helpers ─────

function Section({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="mb-1 block text-xs font-medium text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-rose-600">*</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm text-foreground">{children}</dd>
    </div>
  );
}