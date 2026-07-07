"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, CheckCircle2, FileText, Loader2, Megaphone,
  Percent, Save, Sparkles, Tag, Target, TrendingUp,
} from "lucide-react";
import { apiPost } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { ErrorState, LoadingState } from "@/components/admin/feedback/states";
import { formatDate } from "@/lib/utils";

type CampaignType = "sale" | "seasonal" | "clearance" | "bundle" | "bogo";
type DiscountType = "percentage" | "fixed";

const CAMPAIGN_TYPES: { value: CampaignType; label: string; desc: string; tone: string; icon: any }[] = [
  { value: "sale",       label: "Sale",       desc: "Site-wide or category discount",        tone: "bg-primary/10 text-primary",       icon: Tag },
  { value: "seasonal",   label: "Seasonal",   desc: "Festival or seasonal promotion",       tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: Sparkles },
  { value: "clearance",  label: "Clearance",  desc: "End-of-season stock clear-out",        tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: TrendingUp },
  { value: "bundle",     label: "Bundle",     desc: "Multi-product bundle discount",        tone: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300", icon: Target },
  { value: "bogo",       label: "BOGO",       desc: "Buy one, get one free",                tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300", icon: Percent },
];

function Field({
  label, required, hint, error, children,
}: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  const c = cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";
  return <div className={`grid gap-4 ${c}`}>{children}</div>;
}

function Section({
  title, description, icon: Icon, children,
}: { title: string; description?: string; icon?: any; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <header className="mb-5 flex items-start gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Kpi({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint?: string; icon?: any; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function NewCampaignPage() {
  const router = useRouter();
  const { allowed, loading: permLoading } = usePermissionState("manage_marketing");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    description: "",
    campaign_type: "sale" as CampaignType,
    discount: "10",
    discount_type: "percentage" as DiscountType,
    start_date: "",
    end_date: "",
    is_active: true,
  });

  function setField<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: "" }));
  }

  // Auto-suggest start_date to today on first mount if empty
  useEffect(() => {
    if (!form.start_date) {
      const today = new Date().toISOString().slice(0, 10);
      setField("start_date", today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    const d = Number(form.discount);
    if (!form.discount || isNaN(d) || d <= 0) e.discount = "Enter a positive number";
    if (form.discount_type === "percentage" && d > 100) e.discount = "Cannot exceed 100%";
    if (form.end_date && form.start_date && form.end_date < form.start_date) {
      e.end_date = "End date must be after start date";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/marketing/campaigns/", {
        ...form,
        discount: Number(form.discount),
        discount_value: Number(form.discount),
      });
      toast.success("Campaign created", `"${form.name}" is ready to go.`);
      router.push("/admin/marketing/campaigns");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to create campaign";
      toast.error("Could not create campaign", msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need the manage_marketing permission to create campaigns." />;

  const discountNum = Number(form.discount) || 0;
  const sampleOrders = [250, 500, 1000, 2500];
  const previewTone = form.discount_type === "percentage"
    ? "bg-primary/10 text-primary"
    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/marketing/campaigns"
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Megaphone className="h-4 w-4" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Campaign</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a marketing campaign to promote products and drive conversions.
            </p>
          </div>
        </div>
      </div>

      {/* Campaign type picker */}
      <Section title="Campaign Type" description="Choose how this promotion will be applied." icon={Target}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPAIGN_TYPES.map((t) => {
            const Icon = t.icon;
            const active = form.campaign_type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setField("campaign_type", t.value)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    {active && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Basic info */}
      <Section title="Basic Information" description="Name and describe the campaign." icon={FileText}>
        <div className="space-y-4">
          <Field label="Campaign Name" required error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
              placeholder="e.g. Eid Mega Sale 2026"
              className={inputClass}
            />
          </Field>
          <Field label="Description" hint="Shown to staff; optional internal note.">
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              placeholder="What is this campaign about?"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* Discount */}
      <Section title="Discount" description="How much customers will save." icon={Percent}>
        <Row>
          <Field label="Discount Type">
            <div className="grid grid-cols-2 gap-2">
              {(["percentage", "fixed"] as DiscountType[]).map((dt) => {
                const active = form.discount_type === dt;
                return (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setField("discount_type", dt)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {dt === "percentage" ? "Percentage (%)" : "Fixed amount (BDT)"}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field
            label="Discount Value"
            required
            error={errors.discount}
            hint={form.discount_type === "percentage" ? "0–100" : "Amount in BDT"}
          >
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max={form.discount_type === "percentage" ? 100 : undefined}
                value={form.discount}
                onChange={(e) => setField("discount", e.target.value)}
                required
                className={`${inputClass} pr-12`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                {form.discount_type === "percentage" ? "%" : "৳"}
              </span>
            </div>
          </Field>
        </Row>
      </Section>

      {/* Schedule */}
      <Section title="Schedule" description="Define when the campaign runs." icon={Calendar}>
        <Row>
          <Field label="Start Date">
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setField("start_date", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="End Date" error={errors.end_date}>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setField("end_date", e.target.value)}
              min={form.start_date || undefined}
              className={inputClass}
            />
          </Field>
        </Row>

        <label className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-background p-3.5">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setField("is_active", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Active</p>
            <p className="text-xs text-muted-foreground">
              Inactive campaigns are saved but won't be applied to any orders.
            </p>
          </div>
        </label>
      </Section>

      {/* Live preview */}
      {discountNum > 0 && (
        <Section title="Savings Preview" description="Estimated savings at common order values." icon={TrendingUp}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sampleOrders.map((amt) => {
              const save = form.discount_type === "percentage"
                ? Math.round((amt * discountNum) / 100)
                : Math.min(discountNum, amt);
              return (
                <Kpi
                  key={amt}
                  label={`৳${amt} order`}
                  value={`-৳${save.toLocaleString("en-IN")}`}
                  hint={form.discount_type === "percentage" ? `${discountNum}% off` : "flat off"}
                  icon={TrendingUp}
                  tone={previewTone}
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Create Campaign
        </button>
      </div>
    </form>
  );
}