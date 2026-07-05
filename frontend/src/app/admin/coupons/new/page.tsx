"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Sparkles } from "lucide-react";
import { apiPost } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { ErrorState, LoadingState } from "@/components/admin/feedback/states";
import { formatPrice } from "@/lib/utils";

type Form = {
  code: string;
  description: string;
  discount: string;
  discount_type: "percentage" | "fixed";
  min_order_value: string;
  usage_limit: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
};

export default function NewCouponPage() {
  const router = useRouter();
  const { allowed, loading: permLoading } = usePermissionState("manage_coupons");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Form>({
    code: "",
    description: "",
    discount: "10",
    discount_type: "percentage",
    min_order_value: "0",
    usage_limit: "",
    valid_from: "",
    valid_to: "",
    is_active: true,
  });

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error("Code required", "Please enter a coupon code.");
      return;
    }
    if (form.discount_type === "percentage" && (Number(form.discount) <= 0 || Number(form.discount) > 100)) {
      toast.error("Invalid percent", "Percentage must be between 1 and 100.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/coupons/coupons/", {
        ...form,
        discount: Number(form.discount),
        min_order_value: Number(form.min_order_value),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      });
      toast.success("Coupon created", form.code.toUpperCase());
      router.push("/admin/coupons");
    } catch (e: any) {
      toast.error("Create failed", e?.message || "Please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need manage_coupons to create a coupon." />;

  const exampleOrder = 2500;
  const exampleDiscount =
    form.discount_type === "percentage"
      ? Math.round((exampleOrder * Number(form.discount || 0)) / 100)
      : Number(form.discount || 0);

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Coupon</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a discount code for your customers</p>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <Row>
          <Field label="Code" required>
            <input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              required
              placeholder="e.g. SAVE20"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm uppercase text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </Field>
          <Field label="Discount type">
            <select
              value={form.discount_type}
              onChange={(e) => set("discount_type", e.target.value as Form["discount_type"])}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </Field>
        </Row>

        <Field label="Description (optional)">
          <input
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="e.g. Spring sale 20% off"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Row>
          <Field label={form.discount_type === "percentage" ? "Percent off (%)" : "Amount off (৳)"} required>
            <input
              type="number"
              step="0.01"
              min="0"
              max={form.discount_type === "percentage" ? 100 : undefined}
              value={form.discount}
              onChange={(e) => set("discount", e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </Field>
          <Field label="Min order value (৳)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.min_order_value}
              onChange={(e) => set("min_order_value", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </Field>
          <Field label="Usage limit">
            <input
              type="number"
              min="0"
              value={form.usage_limit}
              onChange={(e) => set("usage_limit", e.target.value)}
              placeholder="Unlimited"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </Field>
        </Row>

        <Row>
          <Field label="Valid from">
            <input
              type="date"
              value={form.valid_from}
              onChange={(e) => set("valid_from", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </Field>
          <Field label="Valid to">
            <input
              type="date"
              value={form.valid_to}
              onChange={(e) => set("valid_to", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </Field>
        </Row>

        <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>Active — visible to customers immediately</span>
        </label>
      </section>

      <aside className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Preview
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          A ৳{formatPrice(exampleOrder)} order will save{" "}
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">৳{formatPrice(exampleDiscount)}</span>{" "}
          with this code.
        </p>
      </aside>

      <footer className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
              Creating…
            </span>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Create Coupon
            </>
          )}
        </button>
      </footer>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}