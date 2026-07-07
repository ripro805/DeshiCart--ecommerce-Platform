"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { apiGet, apiPost } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import {
  LoadingState,
  ErrorState,
} from "@/components/admin/feedback/states";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { usePermission } from "@/components/admin/layout/role-guard";
import type { Paginated } from "@/types";

/* ------------------------------------------------------------------------- */
/*  Types                                                                    */
/* ------------------------------------------------------------------------- */

type Category = { id: number; name: string; subcategories?: SubCategory[] };
type SubCategory = { id: number; name: string; category?: number };
type Brand = { id: number; name: string };
type Tag = { id: number; name: string };

type GalleryImage = { url: string };

type FormState = {
  name: string;
  slug: string;
  sku: string;
  brand_ref: string; // "" means none
  category: string;
  subcategory: string;
  short_description: string;
  description: string;
  price: string;
  cost_price: string;
  discounted_price: string;
  stock: string;
  low_stock_threshold: string;
  image_external_url: string;
  gallery_urls: string[];
  is_active: boolean;
  is_featured: boolean;
  tag_names: string[];
  specifications: Array<{ key: string; value: string }>;
};

/* ------------------------------------------------------------------------- */
/*  Helpers                                                                  */
/* ------------------------------------------------------------------------- */

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  sku: "",
  brand_ref: "",
  category: "",
  subcategory: "",
  short_description: "",
  description: "",
  price: "",
  cost_price: "",
  discounted_price: "",
  stock: "",
  low_stock_threshold: "5",
  image_external_url: "",
  gallery_urls: [],
  is_active: true,
  is_featured: false,
  tag_names: [],
  specifications: [],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNumber(value: string): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------------------------------------------------- */
/*  Page                                                                     */
/* ------------------------------------------------------------------------- */

export default function NewProductPage() {
  const router = useRouter();
  const { ask, dialog: confirmDialog } = useConfirm();
  const canManage = usePermission("manage_products");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [dirty, setDirty] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [tagInput, setTagInput] = useState("");

  /* ----------------------------- Guard ------------------------------------- */

  useEffect(() => {
    if (!canManage) {
      toast.error("You don't have permission to create products.");
      router.replace("/admin/products");
    }
  }, [canManage, router]);

  /* ----------------------------- Navigation guard -------------------------- */

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  /* ----------------------------- Load metadata ----------------------------- */

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    setMetaError(null);
    try {
      const [catRes, brandRes, tagRes] = await Promise.all([
        apiGet<Paginated<any>>(`/categories/?page_size=200`).catch(() => []),
        apiGet<Paginated<any>>(`/admin/brands/?page_size=200`).catch(() => []),
        apiGet<Paginated<any>>(`/admin/tags/?page_size=200`).catch(() => []),
      ]);

      const catList: Category[] = Array.isArray(catRes)
        ? catRes
        : (catRes?.results ?? []);
      const brandList: Brand[] = Array.isArray(brandRes)
        ? brandRes
        : (brandRes?.results ?? []);
      const tagList: Tag[] = Array.isArray(tagRes)
        ? tagRes
        : (tagRes?.results ?? []);

      setCategories(catList);
      setBrands(brandList);
      setTags(tagList);
    } catch (err: any) {
      setMetaError(err?.message || "Failed to load metadata.");
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  /* ----------------------------- Load subcategories for category ---------- */

  useEffect(() => {
    if (!form.category) {
      setSubcategories([]);
      setForm((f) => ({ ...f, subcategory: "" }));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res: any = await apiGet(
          `/admin/subcategories/?category=${form.category}&page_size=200`,
        );
        if (cancelled) return;
        const list: SubCategory[] = Array.isArray(res)
          ? res
          : (res?.results ?? []);
        setSubcategories(list);
      } catch {
        setSubcategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.category]);

  /* ----------------------------- Form helpers ------------------------------ */

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((f) => {
        const next = { ...f, [key]: value };
        if (key === "name" && autoSlug) {
          next.slug = slugify(String(value));
        }
        return next;
      });
      setDirty(true);
    },
    [autoSlug],
  );

  const handleCancel = useCallback(() => {
    const go = () => router.push("/admin/products");
    if (!dirty) return go();
    void ask({
      tone: "warn",
      title: "Discard unsaved changes?",
      description: "Your changes to this new product will be lost.",
      confirmLabel: "Discard",
      onConfirm: () => go(),
    });
  }, [dirty, ask, router]);

  /* ----------------------------- Tags -------------------------------------- */

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (!t) return;
    setForm((f) =>
      f.tag_names.includes(t)
        ? f
        : { ...f, tag_names: [...f.tag_names, t] },
    );
    setTagInput("");
    setDirty(true);
  }, [tagInput]);

  const removeTag = useCallback((name: string) => {
    setForm((f) => ({ ...f, tag_names: f.tag_names.filter((x) => x !== name) }));
    setDirty(true);
  }, []);

  /* ----------------------------- Gallery ----------------------------------- */

  const addGalleryUrl = useCallback(() => {
    setForm((f) => ({
      ...f,
      gallery_urls: [...f.gallery_urls, ""],
    }));
    setDirty(true);
  }, []);

  const updateGalleryUrl = useCallback((idx: number, value: string) => {
    setForm((f) => {
      const next = f.gallery_urls.slice();
      next[idx] = value;
      return { ...f, gallery_urls: next };
    });
    setDirty(true);
  }, []);

  const removeGalleryUrl = useCallback((idx: number) => {
    setForm((f) => {
      const next = f.gallery_urls.slice();
      next.splice(idx, 1);
      return { ...f, gallery_urls: next };
    });
    setDirty(true);
  }, []);

  /* ----------------------------- Specifications ---------------------------- */

  const addSpec = useCallback(() => {
    setForm((f) => ({
      ...f,
      specifications: [...f.specifications, { key: "", value: "" }],
    }));
    setDirty(true);
  }, []);

  const updateSpec = useCallback(
    (idx: number, field: "key" | "value", value: string) => {
      setForm((f) => {
        const next = f.specifications.slice();
        next[idx] = { ...next[idx], [field]: value };
        return { ...f, specifications: next };
      });
      setDirty(true);
    },
    [],
  );

  const removeSpec = useCallback((idx: number) => {
    setForm((f) => {
      const next = f.specifications.slice();
      next.splice(idx, 1);
      return { ...f, specifications: next };
    });
    setDirty(true);
  }, []);

  /* ----------------------------- Submit ------------------------------------ */

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;

      // Validation
      if (!form.name.trim()) {
        toast.error("Product name is required.");
        return;
      }
      if (!form.category) {
        toast.error("Please choose a category.");
        return;
      }
      const priceNum = parseNumber(form.price);
      if (priceNum === null || priceNum < 0) {
        toast.error("Price must be a non-negative number.");
        return;
      }
      const stockNum = parseNumber(form.stock);
      if (stockNum === null || stockNum < 0) {
        toast.error("Stock must be a non-negative number.");
        return;
      }

      setSubmitting(true);
      try {
        const body: Record<string, any> = {
          name: form.name.trim(),
          slug: form.slug.trim() || slugify(form.name),
          sku: form.sku.trim() || null,
          category: Number(form.category),
          subcategory: form.subcategory ? Number(form.subcategory) : null,
          brand_ref: form.brand_ref ? Number(form.brand_ref) : null,
          short_description: form.short_description.trim(),
          description: form.description.trim(),
          price: priceNum,
          cost_price: parseNumber(form.cost_price),
          discounted_price: parseNumber(form.discounted_price),
          stock: stockNum,
          low_stock_threshold: parseNumber(form.low_stock_threshold) ?? 5,
          image_external_url: form.image_external_url.trim() || null,
          gallery: form.gallery_urls
            .map((u) => u.trim())
            .filter(Boolean)
            .map((url) => ({ url })),
          specifications: form.specifications.filter(
            (s) => s.key.trim() && s.value.trim(),
          ),
          is_active: form.is_active,
          is_featured: form.is_featured,
        };

        // Tags - try names directly (depends on backend)
        if (form.tag_names.length > 0) {
          (body as any).tag_names = form.tag_names;
        }

        const res: any = await apiPost(`/admin/products/`, body);
        const newId = res?.id ?? res?.data?.id;
        toast.success(`Created "${form.name.trim()}".`);
        setDirty(false);
        if (newId) {
          router.push(`/admin/products/${newId}`);
        } else {
          router.push("/admin/products");
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to create product.";
        toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
      } finally {
        setSubmitting(false);
      }
    },
    [form, submitting, router],
  );

  /* ----------------------------- Derived ---------------------------------- */

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === form.category),
    [categories, form.category],
  );

  /* ----------------------------- Render ----------------------------------- */

  if (loadingMeta) {
    return <LoadingState label="Loading form…" />;
  }

  if (metaError && categories.length === 0) {
    return (
      <ErrorState description={metaError} onRetry={() => void loadMeta()} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">New product</h1>
            <p className="text-sm text-muted-foreground">
              Add a new item to your catalog.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Create product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MAIN */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basics */}
          <Section title="Basics" description="The name and description shown to customers.">
            <Field label="Product name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Premium Cotton T-Shirt"
                className={inputCls}
              />
            </Field>
            <Field
              label="Slug"
              hint="URL-friendly identifier. Auto-generated from the name if empty."
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    updateField("slug", e.target.value);
                  }}
                  placeholder="premium-cotton-tshirt"
                  className={inputCls}
                />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={autoSlug}
                    onChange={(e) => {
                      setAutoSlug(e.target.checked);
                      if (e.target.checked) {
                        updateField("slug", slugify(form.name));
                      }
                    }}
                    className="rounded border-border"
                  />
                  Auto
                </label>
              </div>
            </Field>
            <Field label="SKU" hint="Stock keeping unit.">
              <input
                type="text"
                value={form.sku}
                onChange={(e) => updateField("sku", e.target.value)}
                placeholder="TSHIRT-PRM-001"
                className={inputCls}
              />
            </Field>
            <Field label="Short description">
              <input
                type="text"
                value={form.short_description}
                onChange={(e) => updateField("short_description", e.target.value)}
                placeholder="A one-line tagline for product cards."
                className={inputCls}
              />
            </Field>
            <Field label="Full description">
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={6}
                placeholder="Detailed description with features, materials, sizing…"
                className={inputCls}
              />
            </Field>
          </Section>

          {/* Media */}
          <Section title="Media" description="Primary image and gallery.">
            <Field label="Main image URL">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.image_external_url}
                  onChange={(e) => updateField("image_external_url", e.target.value)}
                  placeholder="https://cdn.example.com/product.jpg"
                  className={inputCls}
                />
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
                  {form.image_external_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image_external_url}
                      alt="preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            </Field>
            <Field label="Gallery URLs">
              <div className="space-y-2">
                {form.gallery_urls.map((url, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateGalleryUrl(idx, e.target.value)}
                      placeholder="https://…"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryUrl(idx)}
                      className="rounded p-2 text-rose-500 hover:bg-rose-500/10"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addGalleryUrl}
                  className="inline-flex items-center gap-1.5 rounded border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add image URL
                </button>
              </div>
            </Field>
          </Section>

          {/* Pricing */}
          <Section title="Pricing & stock">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Price" required>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                />
              </Field>
              <Field label="Cost price">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost_price}
                  onChange={(e) => updateField("cost_price", e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                />
              </Field>
              <Field label="Discounted price">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discounted_price}
                  onChange={(e) => updateField("discounted_price", e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                />
              </Field>
              <Field label="Stock" required>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => updateField("stock", e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
              <Field label="Low-stock threshold">
                <input
                  type="number"
                  min="0"
                  value={form.low_stock_threshold}
                  onChange={(e) =>
                    updateField("low_stock_threshold", e.target.value)
                  }
                  placeholder="5"
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* Specifications */}
          <Section
            title="Specifications"
            description="Key/value pairs shown on the product page."
          >
            <div className="space-y-2">
              {form.specifications.map((spec, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => updateSpec(idx, "key", e.target.value)}
                    placeholder="Material"
                    className={inputCls}
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => updateSpec(idx, "value", e.target.value)}
                    placeholder="100% cotton"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(idx)}
                    className="rounded p-2 text-rose-500 hover:bg-rose-500/10"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSpec}
                className="inline-flex items-center gap-1.5 rounded border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add specification
              </button>
            </div>
          </Section>
        </div>

        {/* SIDE */}
        <div className="space-y-6">
          {/* Status */}
          <Section title="Status">
            <ToggleRow
              label="Active"
              hint="Visible on the storefront."
              checked={form.is_active}
              onChange={(v) => updateField("is_active", v)}
            />
            <ToggleRow
              label="Featured"
              hint="Show on home and featured sections."
              checked={form.is_featured}
              onChange={(v) => updateField("is_featured", v)}
            />
          </Section>

          {/* Classification */}
          <Section title="Classification">
            <Field label="Category" required>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={inputCls}
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            {subcategories.length > 0 && (
              <Field label="Subcategory">
                <select
                  value={form.subcategory}
                  onChange={(e) => updateField("subcategory", e.target.value)}
                  className={inputCls}
                >
                  <option value="">None</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Brand">
              <select
                value={form.brand_ref}
                onChange={(e) => updateField("brand_ref", e.target.value)}
                className={inputCls}
              >
                <option value="">No brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          {/* Tags */}
          <Section title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {form.tag_names.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/30"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="hover:text-rose-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag…"
                className={inputCls}
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags
                  .filter((t) => !form.tag_names.includes(t.name))
                  .slice(0, 10)
                  .map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => {
                        updateField("tag_names", [...form.tag_names, t.name]);
                      }}
                      className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      + {t.name}
                    </button>
                  ))}
              </div>
            )}
          </Section>

          {selectedCategory && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <AlertCircle className="h-3.5 w-3.5" />
                Tip
              </div>
              <p className="mt-1">
                Products in <strong>{selectedCategory.name}</strong> inherit
                the category's filters and attributes.
              </p>
            </div>
          )}
        </div>
      </div>

      {confirmDialog}
    </form>
  );
}

/* ------------------------------------------------------------------------- */
/*  Building blocks                                                          */
/* ------------------------------------------------------------------------- */

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </header>
      <div className="space-y-4">{children}</div>
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
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-md p-2 hover:bg-muted">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 flex-shrink-0 rounded-full transition ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}