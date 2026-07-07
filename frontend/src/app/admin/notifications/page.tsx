"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  CheckCircle2,
  Filter,
  Info,
  Loader2,
  PlusCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/admin/feedback/states";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { usePermissionState } from "@/components/admin/layout/role-guard";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type NotificationType = "SYSTEM" | "ORDER" | "PROMO" | "SUPPORT" | "ADMIN";

type Notification = {
  id: number;
  type: NotificationType | string;
  title: string;
  body: string;
  link?: string;
  is_read: boolean;
  created_at: string;
};

const TYPE_META: Record<
  string,
  { label: string; tone: string }
> = {
  SYSTEM: {
    label: "System",
    tone: "bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-300",
  },
  ORDER: {
    label: "Order",
    tone: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30 dark:text-indigo-300",
  },
  PROMO: {
    label: "Promotion",
    tone: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  },
  SUPPORT: {
    label: "Support",
    tone: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30 dark:text-cyan-300",
  },
  ADMIN: {
    label: "Admin",
    tone: "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-300",
  },
};

const TYPES_FOR_FILTER: { value: "" | NotificationType; label: string }[] = [
  { value: "", label: "All types" },
  { value: "SYSTEM", label: "System" },
  { value: "ORDER", label: "Order" },
  { value: "PROMO", label: "Promotion" },
  { value: "SUPPORT", label: "Support" },
  { value: "ADMIN", label: "Admin" },
];

const READ_FILTER: { value: "" | "read" | "unread"; label: string }[] = [
  { value: "", label: "All" },
  { value: "unread", label: "Unread only" },
  { value: "read", label: "Read only" },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatDateTime(value: string) {
  try {
    const d = new Date(value);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function relativeTime(value: string) {
  try {
    const d = new Date(value).getTime();
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return `${Math.max(1, Math.round(diff))}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.round(diff / 86400)}d ago`;
    return formatDateTime(value);
  } catch {
    return value;
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function NotificationsPage() {
  const { allowed, loading: permLoading } = usePermissionState("manage_notifications");
  const { ask, dialog: confirmDialog } = useConfirm();

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"" | NotificationType>("");
  const [readFilter, setReadFilter] = useState<"" | "read" | "unread">("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeType, setComposeType] = useState<NotificationType>("SYSTEM");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeLink, setComposeLink] = useState("");
  const [composeSending, setComposeSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res: any = await apiGet("/notifications/notifications/");
      const list = Array.isArray(res) ? res : res?.results ?? [];
      setItems(list);
    } catch (e: any) {
      setLoadError(e?.response?.data?.message || e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (typeFilter && n.type !== typeFilter) return false;
      if (readFilter === "read" && !n.is_read) return false;
      if (readFilter === "unread" && n.is_read) return false;
      return true;
    });
  }, [items, typeFilter, readFilter]);

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  const markRead = async (n: Notification, isRead: boolean) => {
    setBusyId(n.id);
    try {
      await apiPost(`/notifications/notifications/${n.id}/mark_${isRead ? "unread" : "read"}/`);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: !isRead } : x)));
      toast.success(isRead ? "Marked as unread" : "Marked as read");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setBusyId(-1);
    try {
      await apiPost(`/notifications/notifications/mark_all_read/`);
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const removeOne = async (n: Notification) => {
    const ok = await ask({
      title: "Delete notification?",
      description: `"${n.title}" will be permanently removed.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(n.id);
    try {
      await apiDelete(`/notifications/notifications/${n.id}/`);
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      toast.success("Notification deleted");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const sendCompose = async () => {
    if (!composeTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    setComposeSending(true);
    try {
      await apiPost(`/notifications/notifications/`, {
        type: composeType,
        title: composeTitle.trim(),
        body: composeBody.trim(),
        link: composeLink.trim(),
      });
      toast.success("Notification broadcast");
      setComposeTitle("");
      setComposeBody("");
      setComposeLink("");
      setComposeType("SYSTEM");
      setComposeOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Broadcast failed");
    } finally {
      setComposeSending(false);
    }
  };

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) {
    return (
      <ErrorState
        title="Access denied"
        description="You need manage_notifications to view this page."
      />
    );
  }
  if (loading) return <LoadingState label="Loading notifications…" />;
  if (loadError) {
    return (
      <ErrorState
        title="Couldn't load notifications"
        description={loadError}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} total • {unreadCount} unread
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={busyId === -1}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" />
              {busyId === -1 ? "Marking…" : "Mark all read"}
            </button>
          )}
          <button
            onClick={() => setComposeOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            New broadcast
          </button>
        </div>
      </header>

      {/* Compose panel */}
      {composeOpen && (
        <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Broadcast a new notification
            </h2>
            <button
              onClick={() => setComposeOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close compose"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select
                value={composeType}
                onChange={(e) => setComposeType(e.target.value as NotificationType)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TYPES_FOR_FILTER.filter((t) => t.value !== "").map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
              <input
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
                placeholder="e.g. Weekend flash sale"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Body</label>
            <textarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              rows={3}
              placeholder="Optional details"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Link (optional)</label>
            <input
              value={composeLink}
              onChange={(e) => setComposeLink(e.target.value)}
              placeholder="/admin/orders or https://…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setComposeOpen(false)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={sendCompose}
              disabled={composeSending}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {composeSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {composeSending ? "Sending…" : "Broadcast"}
            </button>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {TYPES_FOR_FILTER.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value as any)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {READ_FILTER.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          Showing {filtered.length} of {items.length}
        </span>
      </section>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <EmptyState
            icon={Bell}
            title="No notifications to show"
            description="When events fire (orders, promos, system alerts), they'll appear here."
          />
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {filtered.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
              const busy = busyId === n.id;
              return (
                <li
                  key={n.id}
                  className={`flex flex-col gap-3 p-4 transition hover:bg-muted/40 sm:flex-row sm:items-start ${
                    !n.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.tone}`}
                    >
                      {meta.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {n.title}
                        </h3>
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
                        )}
                      </div>
                      {n.body && (
                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                          {n.body}
                        </p>
                      )}
                      {n.link && (
                        <a
                          href={n.link}
                          target={n.link.startsWith("http") ? "_blank" : undefined}
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs font-medium text-primary hover:underline break-all"
                        >
                          {n.link}
                        </a>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {relativeTime(n.created_at)} • {formatDateTime(n.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:flex-col sm:items-end">
                    <button
                      onClick={() => markRead(n, n.is_read)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
                      title={n.is_read ? "Mark as unread" : "Mark as read"}
                    >
                      {n.is_read ? (
                        <>
                          <BellRing className="h-3 w-3" /> Unread
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" /> Mark read
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => removeOne(n)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-md border border-danger/30 bg-danger/5 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-60"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {confirmDialog}
    </div>
  );
}