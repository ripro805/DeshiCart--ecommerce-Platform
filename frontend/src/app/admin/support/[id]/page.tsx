"use client";

import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Send,
  CheckCircle2,
  LifeBuoy,
  AlertTriangle,
  Clock,
  User as UserIcon,
  Mail,
  CalendarClock,
  RotateCcw,
  Tag,
  Activity,
} from "lucide-react";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

type StatusT = (typeof STATUSES)[number];
type PriorityT = (typeof PRIORITIES)[number];

const STATUS_TONE: Record<StatusT, { bg: string; text: string; ring: string; label: string }> = {
  OPEN:        { bg: "bg-amber-500/10",  text: "text-amber-700 dark:text-amber-300",  ring: "ring-amber-500/30",  label: "Open" },
  IN_PROGRESS: { bg: "bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-300", ring: "ring-indigo-500/30", label: "In Progress" },
  RESOLVED:    { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-500/30", label: "Resolved" },
  CLOSED:      { bg: "bg-muted",         text: "text-muted-foreground", ring: "ring-border",          label: "Closed" },
};

const PRIORITY_TONE: Record<PriorityT, { dot: string; text: string; label: string }> = {
  LOW:    { dot: "bg-slate-400",    text: "text-muted-foreground", label: "Low" },
  MEDIUM: { dot: "bg-amber-500",    text: "text-amber-700 dark:text-amber-300", label: "Medium" },
  HIGH:   { dot: "bg-rose-500",     text: "text-rose-700 dark:text-rose-300", label: "High" },
};

const NEXT_STATUS: Record<StatusT, StatusT | null> = {
  OPEN: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: "CLOSED",
  CLOSED: null,
};

export default function SupportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const { ask, dialog: confirmDialog } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiGet(`/support/tickets/${id}/`);
      setTicket(res);
    } catch (err: any) {
      console.error("[SupportDetail] load failed:", err);
      toast.error("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const status: StatusT = useMemo(() => {
    const s = (ticket?.status || "OPEN").toUpperCase();
    return (STATUSES as readonly string[]).includes(s) ? (s as StatusT) : "OPEN";
  }, [ticket?.status]);

  const priority: PriorityT = useMemo(() => {
    const p = (ticket?.priority || "MEDIUM").toUpperCase();
    return (PRIORITIES as readonly string[]).includes(p) ? (p as PriorityT) : "MEDIUM";
  }, [ticket?.priority]);

  async function refresh() {
    try {
      const res: any = await apiGet(`/support/tickets/${id}/`);
      setTicket(res);
    } catch {
      /* silent */
    }
  }

  async function changeStatus(next: StatusT) {
    if (!ticket || next === status) return;
    setBusy(true);
    try {
      await apiPatch(`/support/tickets/${id}/`, { status: next });
      toast.success(`Status set to ${STATUS_TONE[next].label}`);
      await refresh();
    } catch (err: any) {
      const detail = err?.response?.data?.message || err?.message || "unknown error";
      toast.error(`Could not change status: ${detail}`);
    } finally {
      setBusy(false);
    }
  }

  async function changePriority(next: PriorityT) {
    if (!ticket || next === priority) return;
    setBusy(true);
    try {
      await apiPatch(`/support/tickets/${id}/`, { priority: next });
      toast.success(`Priority set to ${PRIORITY_TONE[next].label}`);
      await refresh();
    } catch (err: any) {
      toast.error(`Could not change priority: ${err?.message || "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  async function sendReply() {
    const body = reply.trim();
    if (!body) {
      toast.warn("Reply cannot be empty");
      return;
    }
    setBusy(true);
    try {
      await apiPost(`/support/tickets/${id}/reply/`, { message: body });
      setReply("");
      toast.success("Reply sent to customer");
      await refresh();
    } catch (err: any) {
      const detail = err?.response?.data?.message || err?.message || "unknown error";
      toast.error(`Send failed: ${detail}`);
    } finally {
      setBusy(false);
    }
  }

  function reopen() {
    void ask({
      title: "Reopen ticket?",
      description: "This will move the ticket back to Open so it can be reworked.",
      tone: "warn",
      confirmLabel: "Reopen",
      onConfirm: async () => {
        await changeStatus("OPEN");
      },
    });
  }

  function closeTicket() {
    void ask({
      title: "Close ticket?",
      description: "Closing marks the conversation as resolved. You can reopen later.",
      tone: "default",
      confirmLabel: "Close",
      onConfirm: async () => {
        await changeStatus("CLOSED");
      },
    });
  }

  function saveNote() {
    const body = internalNote.trim();
    if (!body) {
      toast.warn("Note cannot be empty");
      return;
    }
    const drafts = JSON.parse(localStorage.getItem("admin:support-notes") || "{}");
    drafts[id] = body;
    localStorage.setItem("admin:support-notes", JSON.stringify(drafts));
    toast.info("Internal note saved (draft — full notes module pending backend)");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-lg border border-border bg-surface p-12 text-center">
        <LifeBuoy className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium text-foreground">Ticket not found</p>
        <Link
          href="/admin/support"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to tickets
        </Link>
      </div>
    );
  }

  const tone = STATUS_TONE[status];
  const pTone = PRIORITY_TONE[priority];
  const next = NEXT_STATUS[status];
  const customerEmail = ticket.user_email || ticket.user?.email || "—";
  const customerName = ticket.user?.first_name
    ? `${ticket.user.first_name} ${ticket.user.last_name ?? ""}`.trim()
    : customerEmail;
  const draftNote = (() => {
    try {
      const drafts = JSON.parse(localStorage.getItem("admin:support-notes") || "{}");
      return drafts[id] ?? "";
    } catch {
      return "";
    }
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link
            href="/admin/support"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All tickets
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {ticket.subject || `Ticket #${ticket.id}`}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">#{ticket.id}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> {customerEmail}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              {new Date(ticket.created_at).toLocaleString()}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${tone.bg} ${tone.text} ${tone.ring}`}
          >
            <Activity className="h-3.5 w-3.5" />
            {tone.label}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium ${pTone.text}`}
          >
            <span className={`h-2 w-2 rounded-full ${pTone.dot}`} />
            {pTone.label}
          </span>
        </div>
      </div>

      {/* Workflow strip */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Workflow</p>
            <p className="mt-1 text-sm text-foreground">
              {status === "CLOSED"
                ? "This ticket is closed."
                : next
                ? `Next step: move to ${STATUS_TONE[next].label}.`
                : "Workflow complete."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {status === "CLOSED" ? (
              <button
                type="button"
                onClick={reopen}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reopen
              </button>
            ) : (
              <>
                {next && (
                  <button
                    type="button"
                    onClick={() => changeStatus(next)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Advance to {STATUS_TONE[next].label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeTicket}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Close
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {STATUSES.map((s, idx) => {
            const isCurrent = s === status;
            const isPast =
              STATUSES.indexOf(status) > idx ||
              s === "RESOLVED" && status === "CLOSED";
            const t = STATUS_TONE[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => changeStatus(s)}
                disabled={busy || s === status}
                className={`group relative flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                  isCurrent
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : isPast
                    ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="font-mono text-[10px] text-muted-foreground">{idx + 1}</span>
                <span className={`font-medium ${isCurrent ? "text-primary" : ""}`}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conversation */}
        <div className="space-y-4 lg:col-span-2">
          {/* Original */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-warm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Original message</h3>
              <span className="text-xs text-muted-foreground">
                {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {ticket.message || <span className="italic text-muted-foreground">(no message)</span>}
            </p>
          </div>

          {/* Replies */}
          {Array.isArray(ticket.replies) && ticket.replies.length > 0 && (
            <div className="space-y-3">
              <h3 className="px-1 text-sm font-semibold text-foreground">
                Conversation ({ticket.replies.length})
              </h3>
              {ticket.replies.map((r: any) => {
                const isStaff = r.is_staff_reply;
                return (
                  <div
                    key={r.id}
                    className={`rounded-lg border p-4 shadow-warm ${
                      isStaff
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-surface"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${
                            isStaff
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isStaff ? "S" : (r.user_email?.[0] || "C").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {isStaff ? "Support Team" : r.user_email || "Customer"}
                          </p>
                          <p className="text-muted-foreground">
                            {new Date(r.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {isStaff && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          STAFF
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{r.message}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply composer */}
          <div className="rounded-lg border border-border bg-surface p-4 shadow-warm">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reply to customer
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply…"
              rows={4}
              disabled={busy}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Customer will be notified by email.
              </p>
              <button
                type="button"
                onClick={sendReply}
                disabled={busy || !reply.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send reply
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="rounded-lg border border-border bg-surface p-4 shadow-warm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Customer
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{customerName}</p>
                <p className="truncate text-xs text-muted-foreground">{customerEmail}</p>
              </div>
            </div>
            {ticket.user?.id && (
              <Link
                href={`/admin/users`}
                className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View customer profile →
              </Link>
            )}
          </div>

          {/* Properties */}
          <div className="rounded-lg border border-border bg-surface p-4 shadow-warm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Properties
            </h3>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Status</label>
                <select
                  value={status}
                  onChange={(e) => changeStatus(e.target.value as StatusT)}
                  disabled={busy}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_TONE[s].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => changePriority(e.target.value as PriorityT)}
                  disabled={busy}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_TONE[p].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated</p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {ticket.updated_at
                      ? new Date(ticket.updated_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Internal notes */}
          <div className="rounded-lg border border-border bg-surface p-4 shadow-warm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Internal notes
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" /> Drafts only
              </span>
            </div>
            <textarea
              value={internalNote || draftNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Notes only visible to staff…"
              rows={4}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Saved locally as draft
              </span>
              <button
                type="button"
                onClick={saveNote}
                disabled={!internalNote.trim()}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Tag className="h-3.5 w-3.5" />
                Save note
              </button>
            </div>
          </div>
        </div>
      </div>

      {confirmDialog}
    </div>
  );
}