"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useEffect, useState } from "react";
import { Settings, Save, Loader2 } from "lucide-react";
import { toast } from "@/components/admin/feedback/toast-store";
import { usePermission } from "@/components/admin/layout/role-guard";
import { ErrorState, LoadingState } from "@/components/admin/feedback/states";

export default function StoreSettingsPage() {
  const { allowed, loading: permLoading } = usePermission("manage_store_settings");
  const [form, setForm] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/store/settings/");
        setForm(res);
      } catch {
        setForm({
          store_name: "DeshiCart",
          store_email: "",
          store_phone: "",
          store_address: "",
          currency: "BDT",
          currency_symbol: "৳",
          tax_rate: 0,
          social_facebook: "",
          social_instagram: "",
          social_twitter: "",
          social_youtube: "",
          maintenance_mode: false,
        });
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Only send fields that exist on the StoreSettings model — the serializer
      // ignores extras but rejects malformed ones (e.g. invalid emails), so we
      // trim to a known-safe subset.
      const payload = {
        store_name: form.store_name || "",
        store_email: form.store_email || "",
        store_phone: form.store_phone || "",
        store_address: form.store_address || "",
        currency: form.currency || "BDT",
        currency_symbol: form.currency_symbol || "৳",
        tax_rate: Number(form.tax_rate) || 0,
        social_facebook: form.social_facebook || "",
        social_instagram: form.social_instagram || "",
        social_twitter: form.social_twitter || "",
        social_youtube: form.social_youtube || "",
        maintenance_mode: !!form.maintenance_mode,
      };
      await apiPost("/store/settings/", payload);
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error("Save failed", e?.message || "Please try again");
    } finally {
      setSaving(false);
    }
  }

  function set(k: string, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }));
  }

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" message="You need manage_store_settings to edit these." />;
  if (!loaded || !form) return <LoadingState label="Loading settings…" />;

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Store Settings</h1>
        <p className="text-sm text-muted-foreground">General configuration for your store</p>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Settings className="h-4 w-4" /> General
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Store Name">
            <input
              value={form.store_name || ""}
              onChange={(e) => set("store_name", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </Field>
          <Field label="Currency">
            <select
              value={form.currency || "BDT"}
              onChange={(e) => set("currency", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option>BDT</option>
              <option>USD</option>
              <option>INR</option>
            </select>
          </Field>
          <Field label="Support Email">
            <input
              type="email"
              value={form.store_email || ""}
              onChange={(e) => set("store_email", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </Field>
          <Field label="Support Phone">
            <input
              value={form.store_phone || ""}
              onChange={(e) => set("store_phone", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </Field>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold text-foreground">Commerce</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tax Rate (%)">
            <input
              type="number"
              step="0.01"
              value={form.tax_rate ?? 0}
              onChange={(e) => set("tax_rate", parseFloat(e.target.value) || 0)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </Field>
          <Field label="Currency Symbol">
            <input
              value={form.currency_symbol || "৳"}
              onChange={(e) => set("currency_symbol", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </Field>
        </div>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={!!form.maintenance_mode}
            onChange={(e) => set("maintenance_mode", e.target.checked)}
          />
          Maintenance mode (storefront offline)
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}