"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FolderTree,
  ImageIcon,
  ImagePlus,
  Loader2,
  Save,
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

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  parent?: number | null;
  parent_name?: string | null;
  is_active?: boolean;
  product_count?: number;
  created_at?: string;
  updated_at?: string | null;
};

type CategoryOpt = { id: number; name: string };

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const canManage = usePermission("manage_products");
  const { ask, dialog: confirmDialog } = useConfirm();

  const [row, setRow] = useState<Category | null>(null);
  const [categories, setCategories] = useState<CategoryOpt[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parent, setParent] = useState<string>("");
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await apiGet(`/product/categories/${id}/`);
      const c: Category = {
        id: res?.id,
        name: res?.name || "",
        slug: res?.slug || "",
        description: res?.description ?? "",
        image: res?.image ?? null,
        image_url: res?.image_url ?? null,
        parent: res?.parent ?? null,
        parent_name: res?.parent_name ?? null,
        is_active: res?.is_active ?? true,
        product_count: res?.product_count ?? 0,
        created_at: res?.created_at,
        updated_at: res?.updated_at,
      };
      setRow(c);
      setName(c.name);
      setSlug(c.slug);
      setDescription(c.description || "");
      setParent(c.parent ? String(c.parent) : "");
      setActive(!!c.is_active);
      setImageFile(null);
      setImagePreview(c.image_url || null);
      setDirty(false);
    } catch (e: any) {
      setError(e?.message || "Failed to load category.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadCategories = useCallback(async () => {
    try {
      const res: any = await apiGet("/product/categories/", {
        params: { page_size: 200 },
      });
      const list: any[] = Array.isArray(res?.results)
        ? res.results
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
      setCategories(
        list
          .filter((c) => String(c.id) !== String(id))
          .map((c) => ({ id: c.id, name: c.name }))
      );
    } catch {
      // best-effort; dropdown just stays empty
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      void load();
      void loadCategories();
    }
  }, [id, load, loadCategories]);

  // Auto-slug when only name is touched.
  useEffect(() => {
    if (!row) return;
    if (name && !slug) {
      const s = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const onPickImage = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setDirty(true);
  };

  const save = useCallback(async () => {
    if (!row) return;
    if (!canManage) {
      toast.error("You don't have permission to manage categories.");
      return;
    }
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("slug", slug);
      if (description) fd.append("description", description);
      fd.append("is_active", active ? "true" : "false");
      if (parent) fd.append("parent", parent);
      if (imageFile) fd.append("image", imageFile);
      const res: any = await apiPatch(`/product/categories/${row.id}/`, fd, {
        isForm: true,
      });
      setRow((r) =>
        r
          ? {
              ...r,
              name,
              slug,
              description,
              parent: parent ? Number(parent) : null,
              is_active: active,
              image_url: res?.image_url || r.image_url,
            }
          : r
      );
      setImageFile(null);
      setDirty(false);
      toast.success("Category saved.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }, [
    row,
    canManage,
    name,
    slug,
    description,
    parent,
    active,
    imageFile,
  ]);

  const removeCategory = useCallback(async () => {
    if (!row) return;
    const ok = await ask({
      title: "Delete this category?",
      description: `Category “${row.name}” will be permanently removed. Products in this category will be moved to “Uncategorized”.`,
      confirmLabel: "Delete category",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await apiDelete(`/product/categories/${row.id}/`);
      toast.success("Category deleted.");
      router.push("/admin/categories");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete category.");
    }
  }, [row, ask, router]);

  const parentDisplay = useMemo(() => {
    if (!row?.parent) return "—";
    if (row.parent_name) return row.parent_name;
    return categories.find((c) => String(c.id) === String(row.parent))?.name || `#${row.parent}`;
  }, [row, categories]);

  if (loading) {
    return <LoadingState label="Loading category…" />;
  }
  if (error || !row) {
    return (
      <ErrorState
        title="Couldn't load this category"
        message={error || "Category not found."}
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
            href="/admin/categories"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Categories
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{row.name}</h1>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              /{row.slug}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!canManage || saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-2">
          <Section icon={<FolderTree className="h-4 w-4 text-primary" />} title="Basic info">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setDirty(true);
                  }}
                  disabled={!canManage}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                />
              </Field>
              <Field
                label="Slug"
                hint="Used in URL. Lowercase, hyphens."
              >
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

              <Field label="Parent category">
                <select
                  value={parent}
                  onChange={(e) => {
                    setParent(e.target.value);
                    setDirty(true);
                  }}
                  disabled={!canManage}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                >
                  <option value="">— Top level —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Status">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => {
                      setActive(e.target.checked);
                      setDirty(true);
                    }}
                    disabled={!canManage}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  />
                  Active and visible in storefront
                </label>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setDirty(true);
                    }}
                    disabled={!canManage}
                    placeholder="Optional description shown to customers…"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                  />
                </Field>
              </div>
            </div>
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
                Deleting a category moves its products to “Uncategorized”. This cannot be undone.
              </p>
              <button
                onClick={() => void removeCategory()}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-background px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete category
              </button>
            </section>
          ) : null}
        </div>

        {/* Right: image + meta */}
        <div className="space-y-6">
          <Section icon={<ImageIcon className="h-4 w-4 text-primary" />} title="Image">
            <div className="overflow-hidden rounded-md border border-border bg-muted">
              {imagePreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
              <ImagePlus className="h-3.5 w-3.5" />
              {imageFile ? "Replace image" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                disabled={!canManage}
                className="hidden"
              />
            </label>
            {imageFile ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {imageFile.name} · {Math.round(imageFile.size / 1024)} KB
              </p>
            ) : null}
          </Section>

          <Section title="Summary">
            <dl className="space-y-2 text-sm">
              <Row label="Parent">
                {row.parent ? (
                  <Link
                    href={`/admin/categories/${row.parent}`}
                    className="text-primary hover:underline"
                  >
                    {parentDisplay}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Top level</span>
                )}
              </Row>
              <Row label="Products">{row.product_count ?? "—"}</Row>
              <Row label="Status">
                {active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Inactive
                  </span>
                )}
              </Row>
              {dirty ? (
                <p className="pt-2 text-xs text-amber-700 dark:text-amber-300">
                  Unsaved changes — click Save at the top right.
                </p>
              ) : null}
            </dl>
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
    <div>
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
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}