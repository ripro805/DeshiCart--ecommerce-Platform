"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Paginated } from "@/types";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Box,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  Package2,
  Plus,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

import { apiGet, apiPatch, apiDelete, apiPost } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import {
  LoadingState,
  ErrorState,
} from "@/components/admin/feedback/states";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { usePermission } from "@/components/admin/layout/role-guard";

/* ------------------------------------------------------------------------- */
/*  Types                                                                    */
/* ------------------------------------------------------------------------- */

type Category = { id: number; name: string };
type SubCategory = { id: number; name: string; category?: number };
type Brand = { id: number; name: string };
type Tag = { id: number; name: string };
type Review = {
  id: number;
  user?: { name?: string; email?: string };
  rating: number;
  comment?: string;
  created_at?: string;
  status?: string;
};

type FormState = {
  name: string;
  slug: string;
  sku: string;
  brand_ref: string;
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
  gallery_urls: Array<{ url: string }>;
  is_active: boolean;
  is_featured: boolean;
  tag_names: string[];
  specifications: Array<{ key: string; value: string }>;
};

/* ------------------------------------------------------------------------- */
/*  Page                                                                     */
/* ------------------------------------------------------------------------- */

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = Number(params?.id ?? 0);
  const { ask, dialog: confirmDialog } = useConfirm();

  const canManage = usePermission("manage_products");
  const canDelete = usePermission("delete_product");

  const [form, setForm] = useState<FormState | null>(null);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  const [stockAdjOpen, setStockAdjOpen] = useState(false);
  const [stockChange, setStockChange] = useState("");
  const [stockReason, setStockReason] = useState("ADJUSTMENT");
  const [stockNote, setStockNote] = useState("");
  const [stockAdjusting, setStockAdjusting] = useState(false);

  /* ----------------------------- Navigation guard -------------------------- */

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  /* ----------------------------- Load product ------------------------------ */

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [prodRes] = await Promise.all([
        apiGet(`/admin/products/${productId}/`),
      ]);
      const p: any = prodRes;

      const nextForm: FormState = {
        name: p.name ?? "",
        slug: p.slug ?? "",
        sku: p.sku ?? "",
        brand_ref: p.brand_ref?.id ? String(p.brand_ref.id) : "",
        category: String(p.category?.id ?? p.category ?? ""),
        subcategory: p.subcategory?.id ? String(p.subcategory.id) : "",
        short_description: p.short_description ?? "",
        description: p.description ?? "",
        price: p.price ?? "",
        cost_price: p.cost_price ?? "",
        discounted_price: p.discounted_price ?? "",
        stock: p.stock ?? "",
        low_stock_threshold: p.low_stock_threshold ?? "5",
        image_external_url: p.image_external_url ?? "",
        gallery_urls: Array.isArray(p.gallery)
          ? p.gallery
              .map((g: any) =>
                typeof g === "string" ? { url: g } : { url: g.url ?? "" },
              )
              .filter((g: any) => g.url)
          : [],
        is_active: p.is_active ?? true,
        is_featured: p.is_featured ?? false,
        tag_names: Array.isArray(p.tags)
          ? p.tags.map((t: any) =>
              typeof t === "string" ? t : t.name ?? "",
            )
          : [],
        specifications: Array.isArray(p.specifications)
          ? p.specifications.map((s: any) => ({
              key: s.key ?? "",
              value: s.value ?? "",
            }))
          : [],
      };

      setForm(nextForm);
      setOriginal(nextForm);
      setReviews(Array.isArray(p.recent_reviews) ? p.recent_reviews : []);
      setReviewCount(p.review_count ?? p.total_reviews ?? 0);
      setAverageRating(
        typeof p.average_rating === "number"
          ? p.average_rating
          : typeof p.rating === "number"
            ? p.rating
            : null,
      );
      setDirty(false);
    } catch (err: any) {
      setLoadError(err?.message || "Failed to load product.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  /* ----------------------------- Load metadata + reviews ------------------- */

  const loadMeta = useCallback(async () => {
    try {
      const [catRes, brandRes, tagRes, reviewRes] = await Promise.all([
        apiGet<Paginated<any>>(`/categories/?page_size=200`).catch(() => []),
        apiGet<Paginated<any>>(`/admin/brands/?page_size=200`).catch(() => []),
        apiGet<Paginated<any>>(`/admin/tags/?page_size=200`).catch(() => []),
        apiGet<Paginated<any>>(
          `/admin/reviews/?product=${productId}&page_size=10`,
        ).catch(() => []),
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
      const reviewList: Review[] = Array.isArray(reviewRes)
        ? reviewRes
        : (reviewRes?.results ?? []);

      setCategories(catList);
      setBrands(brandList);
      setTags(tagList);
      setReviews((prev) => (prev.length > 0 ? prev : reviewList));
    } catch {
      /* ignore */
    }
  }, [productId]);

  useEffect(() => {
    void loadProduct();
    void loadMeta();
  }, [loadProduct, loadMeta]);

  /* ----------------------------- Subcategories for category --------------- */

  useEffect(() => {
    if (!form?.category) {
      setSubcategories([]);
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
  }, [form?.category]);

  /* ----------------------------- Form helpers ------------------------------ */

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((f) => (f ? { ...f, [key]: value } : f));
      setDirty(true);
    },
    [],
  );

  const updateGalleryUrl = useCallback((idx: number, value: string) => {
    setForm((f) => {
      if (!f) return f;
      const next = f.gallery_urls.slice();
      next[idx] = { url: value };
      return { ...f, gallery_urls: next };
    });
    setDirty(true);
  }, []);

  const removeGalleryUrl = useCallback((idx: number) => {
    setForm((f) => {
      if (!f) return f;
      const next = f.gallery_urls.slice();
      next.splice(idx, 1);
      return { ...f, gallery_urls: next };
    });
    setDirty(true);
  }, []);

  const addGalleryUrl = useCallback(() => {
    setForm((f) => (f ? { ...f, gallery_urls: [...f.gallery_urls, { url: "" }] } : f));
    setDirty(true);
  }, []);

  const updateSpec = useCallback(
    (idx: number, field: "key" | "value", value: string) => {
      setForm((f) => {
        if (!f) return f;
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
      if (!f) return f;
      const next = f.specifications.slice();
      next.splice(idx, 1);
      return { ...f, specifications: next };
    });
    setDirty(true);
  }, []);

  const addSpec = useCallback(() => {
    setForm((f) =>
      f ? { ...f, specifications: [...f.specifications, { key: "", value: "" }] } : f,
    );
    setDirty(true);
  }, []);

  /* ----------------------------- Save -------------------------------------- */

  const handleSave = useCallback(async () => {
    if (!form || submitting) return;
    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        sku: form.sku.trim() || null,
        category: form.category ? Number(form.category) : null,
        subcategory: form.subcategory ? Number(form.subcategory) : null,
        brand_ref: form.brand_ref ? Number(form.brand_ref) : null,
        short_description: form.short_description,
        description: form.description,
        price: Number(form.price || 0),
        cost_price: form.cost_price === "" ? null : Number(form.cost_price),
        discounted_price:
          form.discounted_price === "" ? null : Number(form.discounted_price),
        stock: Number(form.stock || 0),
        low_stock_threshold: Number(form.low_stock_threshold || 5),
        image_external_url: form.image_external_url || null,
        gallery: form.gallery_urls.filter((g) => g.url.trim()),
        specifications: form.specifications.filter(
          (s) => s.key.trim() && s.value.trim(),
        ),
        is_active: form.is_active,
        is_featured: form.is_featured,
        tag_names: form.tag_names,
      };

      await apiPatch(`/admin/products/${productId}/`, body);
      toast.success("Product updated.");
      setOriginal(form);
      setDirty(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to update product.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  }, [form, submitting, productId]);

  const handleCancel = useCallback(() => {
    if (!dirty) return;
    void ask({
      tone: "warn",
      title: "Discard unsaved changes?",
      description: "Any edits made to this product will be lost.",
      confirmLabel: "Discard",
      onConfirm: () => {
        setForm(original);
        setDirty(false);
      },
    });
  }, [ask, dirty, original]);

  /* ----------------------------- Delete ------------------------------------ */

  const handleDelete = useCallback(() => {
    if (!canDelete || !form) return;
    void ask({
      tone: "danger",
      title: `Delete "${form.name}"?`,
      description:
        "This will permanently remove the product, its variants, and any related data. This cannot be undone.",
      confirmLabel: "Delete product",
      onConfirm: async () => {
        try {
          await apiDelete(`/admin/products/${productId}/`);
          toast.success(`Deleted "${form.name}".`);
          router.push("/admin/products");
        } catch (err: any) {
          toast.error(err?.message || "Failed to delete product.");
          throw err;
        }
      },
    });
  }, [ask, canDelete, form, productId, router]);

  /* ----------------------------- Adjust stock ------------------------------ */

  const handleAdjustStock = useCallback(async () => {
    if (!form) return;
    const change = Number(stockChange);
    if (!Number.isFinite(change) || change === 0) {
      toast.error("Enter a non-zero change value.");
      return;
    }
    setStockAdjusting(true);
    try {
      await apiPost(`/admin/products/${productId}/adjust-stock/`, {
        change,
        reason: stockReason,
        note: stockNote,
      });
      const newStock = Number(form.stock || 0) + change;
      if (newStock < 0) {
        toast.error("Adjustment would result in negative stock. Aborted.");
        return;
      }
      setForm({ ...form, stock: String(newStock) });
      toast.success(
        `Stock ${change > 0 ? "increased" : "decreased"} by ${Math.abs(change)}.`,
      );
      setStockAdjOpen(false);
      setStockChange("");
      setStockNote("");
      setStockReason("ADJUSTMENT");
      void loadProduct();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to adjust stock.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setStockAdjusting(false);
    }
  }, [form, stockChange, stockReason, stockNote, productId, loadProduct]);

  /* ----------------------------- Derived ---------------------------------- */

  const stockTone = useMemo(() => {
    if (!form) return "neutral";
    const stock = Number(form.stock || 0);
    const threshold = Number(form.low_stock_threshold || 5);
    if (stock <= 0) return "rose";
    if (stock <= threshold) return "amber";
    return "emerald";
  }, [form]);

  /* ----------------------------- Render ----------------------------------- */

  if (loading) return <LoadingState label="Loading product…" />;

  if (loadError || !form) {
    return (
      <div className="space-y-4">
        <ErrorState
          description={loadError || "Product not found"}
          onRetry={() => void loadProduct()}
        />
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave();
      }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{form.name}</h1>
              {form.is_active ? (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 ring-1 ring-emerald-500/30">
                  Active
                </span>
              ) : (
                <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-500/30">
                  Hidden
                </span>
              )}
              {form.is_featured && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 ring-1 ring-amber-500/30">
                  Featured
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <span className="font-mono">#{productId}</span> · slug:{" "}
              <span className="font-mono">{form.slug}</span>
              {form.sku && (
                <>
                  {" "}
                  · SKU: <span className="font-mono">{form.sku}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs font-medium text-amber-600">
              Unsaved changes
            </span>
          )}
          {dirty && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
          )}
          {canManage && (
            <button
              type="submit"
              disabled={submitting || !dirty}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi
          icon={<DollarSign className="h-4 w-4" />}
          label="Price"
          value={`৳ ${Number(
            form.discounted_price ?? form.price ?? 0,
          ).toLocaleString()}`}
          tone="indigo"
        />
        <Kpi
          icon={<Box className="h-4 w-4" />}
          label="Stock"
          value={String(form.stock || 0)}
          tone={stockTone === "rose" ? "rose" : stockTone === "amber" ? "amber" : "emerald"}
        />
        <Kpi
          icon={<Star className="h-4 w-4" />}
          label="Rating"
          value={averageRating ? averageRating.toFixed(1) : "—"}
          subValue={reviewCount ? `${reviewCount} reviews` : "no reviews"}
          tone="amber"
        />
        <Kpi
          icon={<TrendingUp className="h-4 w-4" />}
          label="Featured"
          value={form.is_featured ? "Yes" : "No"}
          tone={form.is_featured ? "emerald" : "slate"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MAIN */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Basics">
            <Field label="Product name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Slug" hint="URL identifier.">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="SKU">
              <input
                type="text"
                value={form.sku}
                onChange={(e) => updateField("sku", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Short description">
              <input
                type="text"
                value={form.short_description}
                onChange={(e) => updateField("short_description", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={6}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                className={inputCls}
              />
            </Field>
          </Section>

          <Section title="Media">
            <Field label="Main image URL">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.image_external_url}
                  onChange={(e) =>
                    updateField("image_external_url", e.target.value)
                  }
                  className={inputCls}
                />
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
                  {form.image_external_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image_external_url}
                      alt=""
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
            <Field label="Gallery">
              <div className="space-y-2">
                {form.gallery_urls.map((g, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="url"
                      value={g.url}
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
                  Add gallery URL
                </button>
              </div>
            </Field>
          </Section>

          <Section title="Pricing & stock">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Price">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
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
                  className={inputCls}
                />
              </Field>
              <Field label="Discounted price">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discounted_price}
                  onChange={(e) =>
                    updateField("discounted_price", e.target.value)
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Stock">
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => updateField("stock", e.target.value)}
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
                  className={inputCls}
                />
              </Field>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setStockAdjOpen(true)}
                className="inline-flex items-center gap-2 rounded border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Package2 className="h-4 w-4" />
                Adjust stock
              </button>
            )}
          </Section>

          <Section title="Specifications">
            <div className="space-y-2">
              {form.specifications.map((s, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={s.key}
                    onChange={(e) => updateSpec(idx, "key", e.target.value)}
                    placeholder="Material"
                    className={inputCls}
                  />
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => updateSpec(idx, "value", e.target.value)}
                    placeholder="100% cotton"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(idx)}
                    className="rounded p-2 text-rose-500 hover:bg-rose-500/10"
                  >
                    <X className="h-4 w-4" />
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

          {/* Reviews */}
          <Section
            title="Reviews"
            description={
              reviewCount > 0
                ? `${reviewCount} reviews · average ${averageRating?.toFixed(1) ?? "—"}`
                : "No reviews yet."
            }
          >
            {reviews.length === 0 ? (
              <div className="rounded-md bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                No reviews loaded for this product.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {reviews.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-foreground">
                        {r.user?.name ?? r.user?.email ?? `Reviewer #${r.id}`}
                      </div>
                      <div className="inline-flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < r.rating ? "fill-amber-400" : "opacity-30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {r.comment}
                      </p>
                    )}
                    {r.created_at && (
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {new Date(r.created_at).toLocaleString()}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* SIDE */}
        <div className="space-y-6">
          <Section title="Status">
            <ToggleRow
              label="Active"
              hint="Visible on the storefront."
              checked={form.is_active}
              onChange={(v) => updateField("is_active", v)}
              disabled={!canManage}
            />
            <ToggleRow
              label="Featured"
              hint="Highlight on featured sections."
              checked={form.is_featured}
              onChange={(v) => updateField("is_featured", v)}
              disabled={!canManage}
            />
          </Section>

          <Section title="Classification">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={inputCls}
              >
                <option value="">Select…</option>
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

          <Section title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {form.tag_names.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/30"
                >
                  {t}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          "tag_names",
                          form.tag_names.filter((x) => x !== t),
                        )
                      }
                      className="hover:text-rose-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {tags
              .filter((t) => !form.tag_names.includes(t.name))
              .slice(0, 8)
              .map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() =>
                    updateField("tag_names", [...form.tag_names, t.name])
                  }
                  disabled={!canManage}
                  className="mr-1 mt-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  + {t.name}
                </button>
              ))}
          </Section>

          {canDelete && (
            <Section title="Danger zone">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-600 ring-1 ring-rose-500/40 hover:bg-rose-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete this product
              </button>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
                You can only delete if you have permission.
              </p>
            </Section>
          )}
        </div>
      </div>

      {/* Stock adjust modal */}
      {stockAdjOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Adjust stock
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Current stock:{" "}
                  <span className="font-medium text-foreground">
                    {form.stock || 0}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStockAdjOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Change" hint="Positive to add, negative to remove.">
                <input
                  type="number"
                  value={stockChange}
                  onChange={(e) => setStockChange(e.target.value)}
                  placeholder="10 or -5"
                  className={inputCls}
                />
              </Field>
              <Field label="Reason">
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className={inputCls}
                >
                  <option value="PURCHASE">Purchase</option>
                  <option value="RETURN">Customer return</option>
                  <option value="ADJUSTMENT">Manual adjustment</option>
                  <option value="DAMAGE">Damage / loss</option>
                  <option value="SALE">Sale</option>
                </select>
              </Field>
              <Field label="Note (optional)">
                <textarea
                  rows={2}
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  className={inputCls}
                />
              </Field>
              {Number(stockChange || 0) + Number(form.stock || 0) < 0 && (
                <div className="flex items-start gap-2 rounded-md bg-rose-500/10 p-3 text-sm text-rose-600 ring-1 ring-rose-500/30">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Warning: this will take stock below zero.
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStockAdjOpen(false)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAdjustStock()}
                disabled={stockAdjusting}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {stockAdjusting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Apply adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog}
    </form>
  );
}

/* ------------------------------------------------------------------------- */
/*  Building blocks                                                          */
/* ------------------------------------------------------------------------- */

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
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
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
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start justify-between gap-3 rounded-md p-2 ${
        disabled ? "opacity-60" : "hover:bg-muted"
      }`}
    >
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative h-5 w-9 flex-shrink-0 rounded-full transition ${
          checked ? "bg-primary" : "bg-muted"
        } ${disabled ? "cursor-not-allowed" : ""}`}
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

function Kpi({
  icon,
  label,
  value,
  subValue,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  tone: "indigo" | "emerald" | "amber" | "rose" | "slate";
}) {
  const tones: Record<typeof tone, string> = {
    indigo: "bg-indigo-500/10 text-indigo-600 ring-indigo-500/30",
    emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-600 ring-amber-500/30",
    rose: "bg-rose-500/10 text-rose-600 ring-rose-500/30",
    slate: "bg-slate-500/10 text-slate-600 ring-slate-500/30",
  };
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={`rounded-md p-1.5 ring-1 ${tones[tone]}`}>{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-foreground">
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-muted-foreground">{subValue}</div>
      )}
    </div>
  );
}

void AlertCircle;
void Save;