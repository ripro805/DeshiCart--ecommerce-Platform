"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Percent,
  Save,
  ShieldAlert,
  Tag,
  Ticket,
  Trash2,
} from "lucide-react";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import type { Paginated } from "@/types";
import { toast } from "@/components/admin/feedback/toast-store";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import {
  ErrorState,
  LoadingState,
} from "@/components/admin/feedback/states";
import { formatPrice } from "@/lib/utils";

type DiscountType = "percent" | "fixed";

type Coupon = {
  id: number;
  code: string;
  discount_type: DiscountType | string;
  value: number | string;
  max_uses?: number | null;
  used?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
  min_cart_value?: number | string | null;
  applicable_products?: number[];
  applicable_categories?: number[];
  applicable_products_names?: string[];
  applicable_categories_names?: string[];
  description?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

type CatOpt = { id: number; name: string };
type ProdOpt = { id: number; name: string };

export default function CouponDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { allowed: canManage, loading: permLoading } = usePermissionState("manage_coupons");
  const { ask, dialog: confirmDialog } = useConfirm();

  const [row, setRow] = useState<Coupon | null>(null);
  const [code, setCode] = useState("");
  const [type, setType] = useState<DiscountType>("percent");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [minCart, setMinCart] = useState<string>("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState("");
  const [products, setProducts] = useState<ProdOpt[]>([]);
  const [categories, setCategories] = useState<CatOpt[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await apiGet(`/coupons/${id}/`);
      const c: Coupon = {
        id: res?.id,
        code: res?.code || "",
        discount_type: (res?.discount_type || "percent") as DiscountType,
        value: res?.value ?? 0,
        max_uses: res?.max_uses ?? null,
        used: res?.used ?? 0,
        valid_from: res?.valid_from ?? null,
        valid_until: res?.valid_until ?? null,
        is_active: res?.is_active ?? true,
        min_cart_value: res?.min_cart_value ?? null,
        applicable_products: Array.isArray(res?.applicable_products)
          ? res.applicable_products
          : [],
        applicable_categories: Array.isArray(res?.applicable_categories)
          ? res.applicable_categories
          : [],
        applicable_products_names: res?.applicable_products_names ?? [],
        applicable_categories_names: res?.applicable_categories_names ?? [],
        description: res?.description ?? "",
        created_at: res?.created_at,
        updated_at: res?.updated_at ?? null,
      };
      setRow(c);
      setCode(c.code);
      setType((c.discount_type as DiscountType) || "percent");
      setValue(String(c.value ?? ""));
      setMaxUses(c.max_uses ? String(c.max_uses) : "");
      setMinCart(
        c.min_cart_value !== null && c.min_cart_value !== undefined
          ? String(c.min_cart_value)
          : ""
      );
      setFrom(toInputDate(c.valid_from));
      setUntil(toInputDate(c.valid_until));
      setActive(!!c.is_active);
      setDescription(c.description || "");
      setSelectedProducts(c.applicable_products || []);
      setSelectedCategories(c.applicable_categories || []);
      setDirty(false);
    } catch (e: any) {
      setError(e?.message || "Failed to load coupon.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadRefs = useCallback(async () => {
    try {
      const [pc, cc] = await Promise.all([
        apiGet<Paginated<any>>("/product/categories/", { params: { page_size: 200 } }),
        apiGet<Paginated<any>>("/product/products/", { params: { page_size: 200 } }),
      ]);
      const catsRaw: any[] = Array.isArray(pc?.results)
        ? pc.results
        : Array.isArray(pc)
            ? pc
            : [];
      const prodsRaw: any[] = Array.isArray(cc?.results)
        ? cc.results
        : Array.isArray(cc)
            ? cc
            : [];
      setCategories(catsRaw.map((c) => ({ id: c.id, name: c.name })));
      setProducts(prodsRaw.map((p) => ({ id: p.id, name: p.name })));
    } catch {
      /* best-effort */
    }
  }, []);

  useEffect(() => {
    if (id) {
      void load();
      void loadRefs();
    }
  }, [id, load, loadRefs]);

  // Live preview of what customer sees
  const previewSummary = useMemo(() => {
    if (!value) return null;
    if (type === "percent") {
      const v = parseFloat(value);
      if (!isFinite(v) || v <= 0) return null;
      const on100 = (100 * Math.min(v, 100)) / 100;
      const on500 = (500 * Math.min(v, 100)) / 100;
      return `On a 100 order: -${formatPrice(on100, true)} | On a 500 order: -${formatPrice(on500, true)}`;
    }
    return `Flat ${formatPrice(parseFloat(value), true)} off every eligible order`;
  }, [type, value]);

  const usagePct = useMemo(() => {
    if (!row?.max_uses) return 0;
    return Math.min(100, Math.round(((row.used || 0) / row.max_uses) * 100));
  }, [row]);

  const onSave = useCallback(async () => {
    if (!row) return;
    if (!canManage) {
      toast.error("You don't have permission to manage coupons.");
      return;
    }
    if (!code.trim()) {
      toast.error("Code is required.");
      return;
    }
    if (!value || isNaN(parseFloat(value))) {
      toast.error("Value must be a number.");
      return;
    }
    if (type === "percent" && (parseFloat(value) <= 0 || parseFloat(value) > 100)) {
      toast.error("Percent must be between 1 and 100.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        code: code.toUpperCase().trim(),
        discount_type: type,
        value: parseFloat(value),
        is_active: active,
        description,
      };
      if (maxUses) payload.max_uses = parseInt(maxUses, 10);
      else payload.max_uses = null;
      if (minCart) payload.min_cart_value = parseFloat(minCart);
      else payload.min_cart_value = null;
      if (from) payload.valid_from = new Date(from).toISOString();
      else payload.valid_from = null;
      if (until) payload.valid_until = new Date(until).toISOString();
      else payload.valid_until = null;
      payload.applicable_products = selectedProducts;
      payload.applicable_categories = selectedCategories;

      const res: any = await apiPatch(`/coupons/${row.id}/`, payload);
      setRow((r) =>
        r
          ? {
              ...r,
              code: payload.code,
              discount_type: type,
              value: payload.value,
              max_uses: payload.max_uses,
              min_cart_value: payload.min_cart_value,
              valid_from: payload.valid_from,
              valid_until: payload.valid_until,
              is_active: active,
              description,
              applicable_products: selectedProducts,
              applicable_categories: selectedCategories,
              updated_at: res?.updated_at ?? new Date().toISOString(),
            }
          : r
      );
      setDirty(false);
      toast.success("Coupon saved.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  }, [
    row,
    canManage,
    code,
    type,
    value,
    maxUses,
    minCart,
    from,
    until,
    active,
    description,
    selectedProducts,
    selectedCategories,
  ]);

  const removeCoupon = useCallback(async () => {
    if (!row) return;
    const ok = await ask({
      title: "Delete this coupon?",
      description: `Coupon “${row.code}” will be permanently removed. Customers will no longer be able to redeem it.`,
      confirmLabel: "Delete coupon",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await apiDelete(`/coupons/${row.id}/`);
      toast.success("Coupon deleted.");
      router.push("/admin/coupons");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete coupon.");
    }
  }, [row, ask, router]);

  if (loading) {
    return <LoadingState label="Loading coupon…" />;
  }
  if (error || !row) {
    return (
      <ErrorState
        title="Couldn't load this coupon"
        description={error || "Coupon not found."}
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
            href="/admin/coupons"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Coupons
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <span className="font-mono">{row.code}</span>
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Coupon #{row.id} · created {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            active
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: form */}
        <div className="space-y-6 lg:col-span-2">
          <Section icon={<Ticket className="h-4 w-4 text-primary" />} title="Code & discount">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code" required>
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setDirty(true);
                  }}
                  disabled={!canManage}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono uppercase tracking-wide text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                  placeholder="E.g. DESHI20"
                />
              </Field>

              <Field label="Discount type">
                <div className="grid grid-cols-2 gap-2">
                  <TypeTile
                    active={type === "percent"}
                    onClick={() => {
                      setType("percent");
                      setDirty(true);
                    }}
                    icon={<Percent className="h-4 w-4" />}
                    label="Percentage"
                    sub="% off"
                    disabled={!canManage}
                  />
                  <TypeTile
                    active={type === "fixed"}
                    onClick={() => {
                      setType("fixed");
                      setDirty(true);
                    }}
                    icon={<Tag className="h-4 w-4" />}
                    label="Fixed amount"
                    sub="flat off"
                    disabled={!canManage}
                  />
                </div>
              </Field>

              <Field
                label={type === "percent" ? "Percent off" : "Amount off"}
                required
              >
                <div className="relative">
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      setDirty(true);
                    }}
                    disabled={!canManage}
                    step={type === "percent" ? "1" : "0.01"}
                    min="0"
                    max={type === "percent" ? "100" : undefined}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
                    {type === "percent" ? "%" : "BDT"}
                  </span>
                </div>
                {previewSummary ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Preview: {previewSummary}
                  </p>
                ) : null}
              </Field>

              <Field label="Maximum uses">
                <input
                  type="number"
                  value={maxUses}
                  onChange={(e) => {
                    setMaxUses(e.target.value);
                    setDirty(true);
                  }}
                  disabled={!canManage}
                  min="0"
                  placeholder="Unlimited"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                />
              </Field>

              <Field label="Minimum cart value">
                <input
                  type="number"
                  value={minCart}
                  onChange={(e) => {
                    setMinCart(e.target.value);
                    setDirty(true);
                  }}
                  disabled={!canManage}
                  step="0.01"
                  min="0"
                  placeholder="No minimum"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Description" hint="Internal — not shown to customers.">
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setDirty(true);
                    }}
                    disabled={!canManage}
                    placeholder="Optional admin-only notes…"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section icon={<Calendar className="h-4 w-4 text-primary" />} title="Validity">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Valid from">
                <input
                  type="datetime-local"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setDirty(true);
                  }}
                  disabled={!canManage}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                />
              </Field>
              <Field label="Valid until">
                <input
                  type="datetime-local"
                  value={until}
                  onChange={(e) => {
                    setUntil(e.target.value);
                    setDirty(true);
                  }}
                  disabled={!canManage}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                />
              </Field>
            </div>

            <div className="mt-3 rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {from || until ? (
                <span>
                  Active from{" "}
                  <span className="font-medium text-foreground">
                    {from ? new Date(from).toLocaleString() : "any time"}
                  </span>
                  {" "}until{" "}
                  <span className="font-medium text-foreground">
                    {until ? new Date(until).toLocaleString() : "forever"}
                  </span>
                  .
                </span>
              ) : (
                <span>No date limits — coupon can be redeemed any time while active.</span>
              )}
            </div>
          </Section>

          <Section icon={<Tag className="h-4 w-4 text-primary" />} title="Eligibility">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Applicable categories" hint="Leave empty for all categories.">
                <select
                  multiple
                  value={selectedCategories.map(String)}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                    setSelectedCategories(opts);
                    setDirty(true);
                  }}
                  disabled={!canManage}
                  className="h-32 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Hold Ctrl / Cmd to select multiple.
                </p>
              </Field>
              <Field label="Applicable products" hint="Leave empty for all products.">
                <select
                  multiple
                  value={selectedProducts.map(String)}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                    setSelectedProducts(opts);
                    setDirty(true);
                  }}
                  disabled={!canManage}
                  className="h-32 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>
        </div>

        {/* Right: meta + usage + actions + danger zone */}
        <div className="space-y-6">
          <Section title="Usage">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{row.used ?? 0}</p>
              <p className="text-xs text-muted-foreground">
                of {row.max_uses ?? "∞"} redemptions
              </p>
              {row.max_uses ? (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              ) : null}
            </div>
          </Section>

          <Section title="Visibility">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
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
              Active and usable by customers
            </label>
          </Section>

          <Section icon={<Save className="h-4 w-4 text-primary" />} title="Actions">
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={!canManage || saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
            {dirty ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                Unsaved changes.
              </p>
            ) : null}
            {!canManage ? (
              <p className="mt-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                You don't have permission to manage coupons.
              </p>
            ) : null}
          </Section>

          {canManage ? (
            <section className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <h2 className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                  Danger zone
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Permanently delete this coupon. Customers will not be able to redeem it any more.
              </p>
              <button
                onClick={() => void removeCoupon()}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-background px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete coupon
              </button>
            </section>
          ) : null}
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

function TypeTile({
  active,
  onClick,
  icon,
  label,
  sub,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-foreground hover:bg-muted"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-md ${
          active ? "bg-primary/15" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-xs font-semibold">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}

function toInputDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}