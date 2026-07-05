"use client";

import { apiGet, apiPatch } from "@/lib/api";
import { useEffect, useState } from "react";
import {
  Palette,
  Save,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  Type as TypeIcon,
  Eye,
} from "lucide-react";
import { toast } from "@/components/admin/feedback/toast-store";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { ErrorState, LoadingState } from "@/components/admin/feedback/states";

type Appearance = {
  id?: number;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  accent_color?: string;
  ink_color?: string;
  bg_color?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  hero_cta_label?: string;
  hero_cta_link?: string;
  footer_text?: string;
  updated_at?: string;
};

const FALLBACK: Appearance = {
  logo_url: "",
  favicon_url: "",
  primary_color: "#EA580C",
  accent_color: "#FBBF24",
  ink_color: "#0F172A",
  bg_color: "#FFF7ED",
  hero_title: "Shop the deshi way",
  hero_subtitle: "Handpicked local products, delivered fast.",
  hero_image_url: "",
  hero_cta_label: "Shop now",
  hero_cta_link: "/products",
  footer_text: "",
};

const COLOR_FIELDS: Array<{ key: keyof Appearance; label: string; hint: string }> = [
  { key: "primary_color", label: "Primary", hint: "Main brand / CTA color" },
  { key: "accent_color", label: "Accent", hint: "Highlights and badges" },
  { key: "ink_color", label: "Ink", hint: "Primary text" },
  { key: "bg_color", label: "Background", hint: "Page background" },
];

export default function AppearancePage() {
  const { allowed, loading: permLoading } = usePermissionState("manage_appearance"); // appearance is super-admin only
  const [form, setForm] = useState<Appearance>(FALLBACK);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="Appearance settings are restricted to super admins." />;

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/appearance/appearance/");
        const data = res?.data ?? res ?? {};
        setForm({ ...FALLBACK, ...data });
      } catch (e: any) {
        setError(e?.message || "Failed to load appearance.");
        setForm(FALLBACK);
      } finally {
        setLoaded(false);
        setLoaded(true);
      }
    })();
  }, []);

  function set<K extends keyof Appearance>(k: K, v: Appearance[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res: any = await apiPatch("/appearance/appearance/", form);
      const data = res?.data ?? res ?? form;
      setForm({ ...FALLBACK, ...data });
      setSavedAt(new Date().toLocaleTimeString());
      toast.success("Appearance saved");
    } catch (e: any) {
      const msg = e?.message || "Save failed.";
      setError(msg);
      toast.error("Could not save appearance", msg);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return <LoadingState label="Loading appearance…" />;
  }
  if (error && !loaded) {
    return <ErrorState title="Couldn't load appearance" description={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appearance</h1>
          <p className="text-sm text-muted-foreground">
            Site-wide colors, logos, and hero content
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-emerald-600">
              Saved at {savedAt}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
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
      </div>

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Brand assets */}
        <section className="rounded-lg border border-border bg-surface p-5 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Brand assets</h2>
          </div>
          <div className="space-y-4">
            <Field label="Logo URL">
              <input
                value={form.logo_url ?? ""}
                onChange={(e) => set("logo_url", e.target.value)}
                placeholder="https://…/logo.png"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </Field>
            <Field label="Favicon URL">
              <input
                value={form.favicon_url ?? ""}
                onChange={(e) => set("favicon_url", e.target.value)}
                placeholder="https://…/favicon.ico"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </Field>
            <Field label="Footer text">
              <input
                value={form.footer_text ?? ""}
                onChange={(e) => set("footer_text", e.target.value)}
                placeholder="© 2025 DeshiCart"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </Field>
          </div>
        </section>

        {/* Colors */}
        <section className="rounded-lg border border-border bg-surface p-5 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Color palette</h2>
          </div>
          <div className="space-y-4">
            {COLOR_FIELDS.map((c) => (
              <div key={String(c.key)} className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  {c.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[c.key] || "#000000"}
                    onChange={(e) => set(c.key, e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border border-border bg-background"
                  />
                  <input
                    value={form[c.key] ?? ""}
                    onChange={(e) => set(c.key, e.target.value)}
                    placeholder="#RRGGBB"
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{c.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Hero content */}
        <section className="rounded-lg border border-border bg-surface p-5 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Hero</h2>
          </div>
          <div className="space-y-4">
            <Field label="Hero title">
              <input
                value={form.hero_title ?? ""}
                onChange={(e) => set("hero_title", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </Field>
            <Field label="Hero subtitle">
              <textarea
                rows={2}
                value={form.hero_subtitle ?? ""}
                onChange={(e) => set("hero_subtitle", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </Field>
            <Field label="Hero image URL">
              <input
                value={form.hero_image_url ?? ""}
                onChange={(e) => set("hero_image_url", e.target.value)}
                placeholder="https://…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA label">
                <input
                  value={form.hero_cta_label ?? ""}
                  onChange={(e) => set("hero_cta_label", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </Field>
              <Field label="CTA link">
                <input
                  value={form.hero_cta_link ?? ""}
                  onChange={(e) => set("hero_cta_link", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </Field>
            </div>
          </div>
        </section>
      </div>

      {/* Live preview */}
      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Eye className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Live preview</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            Updates after save
          </span>
        </div>
        <div
          className="p-6"
          style={{ background: form.bg_color, color: form.ink_color }}
        >
          <div className="flex items-center gap-3">
            {form.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logo_url}
                alt="Logo"
                className="h-10 w-10 rounded object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded text-sm font-bold text-white"
                style={{ background: form.primary_color }}
              >
                DC
              </div>
            )}
            <span className="text-lg font-semibold">DeshiCart</span>
            <span
              className="ml-3 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
              style={{ background: form.accent_color, color: form.ink_color }}
            >
              Preview
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3
                className="text-2xl font-bold leading-tight"
                style={{ color: form.ink_color }}
              >
                {form.hero_title}
              </h3>
              <p className="mt-2 text-sm opacity-80">{form.hero_subtitle}</p>
              <a
                href={form.hero_cta_link || "#"}
                className="mt-4 inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{ background: form.primary_color }}
              >
                <LinkIcon className="h-4 w-4" />
                {form.hero_cta_label}
              </a>
            </div>
            <div>
              {form.hero_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.hero_image_url}
                  alt="Hero"
                  className="h-40 w-full rounded-md object-cover"
                />
              ) : (
                <div
                  className="flex h-40 w-full items-center justify-center rounded-md border border-dashed text-xs opacity-60"
                  style={{ borderColor: form.ink_color }}
                >
                  Hero image preview
                </div>
              )}
            </div>
          </div>
        </div>
        {form.footer_text && (
          <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            {form.footer_text}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}