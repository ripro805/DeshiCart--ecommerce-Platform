"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Loader2,
  Package,
  Receipt,
  Save,
  ShieldAlert,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { usePermission } from "@/components/admin/layout/role-guard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/feedback/states";
import { formatDate, formatDateTime, formatPrice } from "@/lib/utils";

type ReturnStatus = "pending" | "approved" | "rejected" | "completed";

type ReturnRow = {
  id: number;
  order?: number | null;
  order_number?: string | null;
  user_email?: string | null;
  user_name?: string | null;
  status: ReturnStatus | string;
  reason?: string | null;
  description?: string | null;
  images?: string[] | null;
  admin_notes?: string | null;
  refund_amount?: number | string | null;
  refund_type?: string | null;
  type?: string | null;
  items?: Array<{
    id: number;
    name?: string;
    quantity?: number;
    price?: number | string;
    image_url?: string;
  }>;
  created_at: string;
  updated_at?: string | null;
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  completed: "bg-primary/10 text-primary",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

const WORKFLOW: Array<{ key: ReturnStatus; label: string; tone: string; dot: string }> = [
  { key: "pending", label: "Requested", tone: "bg-amber-500/15 text-amber-700", dot: "bg-amber-500" },
  { key: "approved", label: "Approved", tone: "bg-emerald-500/15 text-emerald-700", dot: "bg-emerald-500" },
  { key: "completed", label: "Completed", tone: "bg-primary/10 text-primary", dot: "bg-primary" },
];

export default function ReturnDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const canManage = usePermission("manage_returns");
  const { ask, dialog: confirmDialog } = useConfirm();

  const [row, setRow] = useState<ReturnRow | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notesDirty, setNotesDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await apiGet(`/returns/${id}/`);
      const data: ReturnRow = {
        id: res?.id,
        order: res?.order ?? null,
        order_number: res?.order_number ?? null,
        user_email: res?.user_email ?? null,
        user_name: res?.user_name ?? null,
        status: res?.status ?? "pending",
        reason: res?.reason ?? null,
        description: res?.description ?? null,
        images: Array.isArray(res?.images) ? res.images : [],
        admin_notes: res?.admin_notes ?? "",
        refund_amount: res?.refund_amount ?? null,
        refund_type: res?.refund_type ?? null,
        type: res?.type ?? null,
        items: Array.isArray(res?.items) ? res.items : [],
        created_at: res?.created_at ?? new Date().toISOString(),
        updated_at: res?.updated_at ?? null,
      };
      setRow(data);
      setNotes(data.admin_notes || "");
      setNotesDirty(false);
    } catch (e: any) {
      setError(e?.message || "Failed to load return.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void load();
  }, [id, load]);

  const setStatus = useCallback(
    async (status: ReturnStatus, label: string, tone: "danger" | "warn" | "default") => {
      if (!row) return;
      if (!canManage) {
        toast.error("You do not have permission to manage returns.");
        return;
      }
      const ok = await ask({
        title: `${label} this return?`,
        description: `Return #${row.id} will be marked as ${STATUS_LABEL[status] ?? status}.`,
        confirmLabel: label,
        tone,
      });
      if (!ok) return;
      setSubmitting(true);
      try {
        await apiPatch(`/returns/${row.id}/`, { status, admin_notes: notes });
        setRow((r) => (r ? { ...r, status, admin_notes: notes } : r));
        setNotesDirty(false);
        toast.success(`Return marked as ${STATUS_LABEL[status] ?? status}.`);
      } catch (e: any) {
        toast.error(e?.message || "Failed to update return.");
      } finally {
        setSubmitting(false);
      }
    },
    [row, canManage, ask, notes]
  );

  const saveNotes = useCallback(async () => {
    if (!row) return;
    if (!canManage) {
      toast.error("You do not have permission to edit notes.");
      return;
    }
    if (!notesDirty) {
      toast.info("No changes to save.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPatch(`/returns/${row.id}/`, { admin_notes: notes });
      setRow((r) => (r ? { ...r, admin_notes: notes } : r));
      setNotesDirty(false);
      toast.success("Notes saved.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save notes.");
    } finally {
      setSubmitting(false);
    }
  }, [row, canManage, notes, notesDirty, ask]);

  const resetStatus = useCallback(async () => {
    if (!row) return;
    const ok = await ask({
      title: "Reset to pending?",
      description: "The return will be moved back to the request queue.",
      confirmLabel: "Reset",
      tone: "warn",
    });
    if (!ok) return;
    setSubmitting(true);
    try {
      await apiPatch(`/returns/${row.id}/`, { status: "pending", admin_notes: notes });
      setRow((r) => (r ? { ...r, status: "pending", admin_notes: notes } : r));
      setNotesDirty(false);
      toast.success("Return reset to pending.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reset return.");
    } finally {
      setSubmitting(false);
    }
  }, [row, notes, ask]);

  const removeReturn = useCallback(async () => {
    if (!row) return;
    const ok = await ask({
      title: "Delete this return?",
      description: `This will permanently remove return #${row.id}. This cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await apiDelete(`/returns/${row.id}/`);
      toast.success("Return deleted.");
      router.push("/admin/returns");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete return.");
    }
  }, [row, ask, router]);

  const status = row?.status || "pending";
  const statusBadge = STATUS_TONE[status] ?? "bg-muted text-muted-foreground";

  // Map current status to a workflow step.
  const currentStep = useMemo(() => {
    if (status === "rejected") return -1; // off-flow
    if (status === "completed") return 2;
    if (status === "approved") return 1;
    return 0;
  }, [status]);

  if (loading) {
    return <LoadingState label="Loading return…" />;
  }

  if (error || !row) {
    return (
      <ErrorState
        title="Couldn't load this return"
        description={error || "Return not found."}
        onRetry={() => void load()}
      />
    );
  }

  const refundDisplay =
    row.refund_amount === null || row.refund_amount === undefined
      ? "—"
      : formatPrice(row.refund_amount, true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/returns"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Returns
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Return #{row.id}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Order{" "}
              {row.order_number ? (
                <Link
                  href={`/admin/orders/${row.order ?? ""}`}
                  className="font-mono text-foreground hover:text-primary"
                >
                  {row.order_number}
                </Link>
              ) : (
                <span className="font-mono text-foreground">
                  #{row.order ?? "—"}
                </span>
              )}
              {" · "}submitted {formatDateTime(row.created_at)}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge}`}
        >
          {status === "approved" ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : status === "rejected" ? (
            <XCircle className="h-3.5 w-3.5" />
          ) : status === "completed" ? (
            <Package className="h-3.5 w-3.5" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      {/* Workflow strip */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Workflow</h2>
          <span className="text-xs text-muted-foreground">
            Updated {row.updated_at ? formatDateTime(row.updated_at) : "—"}
          </span>
        </div>
        {status === "rejected" ? (
          <div className="flex items-center gap-2 rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
            <XCircle className="h-4 w-4" />
            This return was rejected. Use “Reset” to send it back to pending.
          </div>
        ) : (
          <ol className="flex items-center gap-2">
            {WORKFLOW.map((step, idx) => {
              const done = currentStep >= idx;
              const active = currentStep === idx;
              return (
                <li key={step.key} className="flex flex-1 items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        done
                          ? `${step.tone}`
                          : "bg-muted text-muted-foreground"
                      } ${active ? "ring-2 ring-primary/40" : ""}`}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        done ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < WORKFLOW.length - 1 ? (
                    <span
                      className={`mx-1 h-px flex-1 ${
                        currentStep > idx ? "bg-emerald-500" : "bg-border"
                      }`}
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Customer" value={row.user_email || row.user_name || "—"} tone="indigo" />
        <Kpi label="Refund amount" value={refundDisplay} tone="emerald" />
        <Kpi label="Refund type" value={row.refund_type || row.type || "—"} tone="primary" />
        <Kpi
          label="Submitted"
          value={formatDate(row.created_at)}
          tone="slate"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: reason + items */}
        <div className="space-y-6 lg:col-span-2">
          <Section
            icon={<ShieldAlert className="h-4 w-4 text-primary" />}
            title="Reason"
          >
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {row.reason || row.description || "No reason provided by the customer."}
            </p>
          </Section>

          {(row.images?.length ?? 0) > 0 ? (
            <Section
              icon={<ImageIcon className="h-4 w-4 text-primary" />}
              title={`Customer attachments (${row.images!.length})`}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {row.images!.map((src, i) => (
                  <a
                    key={i}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-md border border-border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Attachment ${i + 1}`}
                      className="h-24 w-full object-cover transition-transform hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </Section>
          ) : null}

          {(row.items?.length ?? 0) > 0 ? (
            <Section
              icon={<Receipt className="h-4 w-4 text-primary" />}
              title="Items in this return"
            >
              <ul className="divide-y divide-border rounded-md border border-border">
                {row.items!.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="h-10 w-10 flex-none overflow-hidden rounded-md bg-muted">
                      {it.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={it.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {it.name || `Item #${it.id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty {it.quantity ?? 0}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {it.price !== undefined
                        ? formatPrice(it.price as any, true)
                        : "—"}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>

        {/* Right: notes + actions + danger zone */}
        <div className="space-y-6">
          {/* Actions */}
          <Section
            icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
            title="Actions"
          >
            <div className="grid gap-2">
              {canManage && status !== "approved" ? (
                <button
                  onClick={() => void setStatus("approved", "Approve", "warn")}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve return
                </button>
              ) : null}
              {canManage && status !== "rejected" ? (
                <button
                  onClick={() => void setStatus("rejected", "Reject", "danger")}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject return
                </button>
              ) : null}
              {canManage && status === "approved" ? (
                <button
                  onClick={() =>
                    void setStatus("completed", "Mark completed", "default")
                  }
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Package className="h-4 w-4" />
                  Mark as completed
                </button>
              ) : null}
              {canManage && status !== "pending" ? (
                <button
                  onClick={() => void resetStatus()}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  <Undo2 className="h-4 w-4" />
                  Reset to pending
                </button>
              ) : null}
              {!canManage ? (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  You don't have permission to manage returns.
                </p>
              ) : null}
            </div>
          </Section>

          {/* Admin notes */}
          <Section
            icon={<Save className="h-4 w-4 text-primary" />}
            title="Internal notes"
          >
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesDirty(true);
              }}
              rows={5}
              disabled={!canManage}
              placeholder="Notes visible to admins only…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              {notesDirty ? (
                <span className="text-xs text-amber-700 dark:text-amber-300">
                  Unsaved changes
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => void saveNotes()}
                disabled={!canManage || submitting || !notesDirty}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save notes
              </button>
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
                Permanently delete this return record. This cannot be undone.
              </p>
              <button
                onClick={() => void removeReturn()}
                disabled={submitting}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-background px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete return
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

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone: "indigo" | "emerald" | "primary" | "slate";
}) {
  const accent: Record<typeof tone, string> = {
    indigo: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    primary: "bg-primary/10 text-primary",
    slate: "bg-muted text-muted-foreground",
  };
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${accent[tone]}`}
        >
          <Receipt className="h-3.5 w-3.5" />
        </span>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}