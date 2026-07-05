"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Star,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  EyeOff,
  AlertTriangle,
  Trash2,
  Filter,
  ChevronUp,
  ChevronDown,
  ImageOff,
  Inbox,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/admin/feedback/toast-store";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/admin/feedback/states";
import { ConfirmDialog } from "@/components/admin/feedback/confirm-dialog";
import type { Paginated } from "@/lib/api";
import type { AdminReview } from "@/types";
import type { ReviewStatus } from "@/types";
import { REVIEW_STATUSES } from "@/types";

const PAGE_SIZE = 20;
type SortKey =
  | "-created_at"
  | "created_at"
  | "-ratings"
  | "ratings"
  | "-helpful_count"
  | "helpful_count";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

const STATUS_META: Record<ReviewStatus, { label: string; tone: string }> = {
  PENDING: {
    label: "Pending",
    tone: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  },
  APPROVED: {
    label: "Approved",
    tone: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  },
  REJECTED: {
    label: "Rejected",
    tone: "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-300",
  },
  HIDDEN: {
    label: "Hidden",
    tone: "bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-300",
  },
  SPAM: {
    label: "Spam",
    tone: "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-300",
  },
};

function StatusPill({ status }: { status?: ReviewStatus }) {
  const meta = STATUS_META[status as ReviewStatus] ?? STATUS_META.PENDING;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.tone}`}
    >
      {meta.label}
    </span>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= value
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/40"
          }`}
        />
      ))}
    </span>
  );
}

interface RowActionsProps {
  review: AdminReview;
  busy: boolean;
  onAction: (action: "approve" | "reject" | "hide" | "spam" | "restore") => void;
  onDelete: () => void;
}

function RowActions({ review, busy, onAction, onDelete }: RowActionsProps) {
  const status = review.status as ReviewStatus;
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status !== "APPROVED" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("approve")}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-300"
          title="Approve"
        >
          <CheckCircle2 className="h-3 w-3" />
          Approve
        </button>
      )}
      {status !== "REJECTED" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("reject")}
          className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-300"
          title="Reject"
        >
          <XCircle className="h-3 w-3" />
          Reject
        </button>
      )}
      {status !== "HIDDEN" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("hide")}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
          title="Hide"
        >
          <EyeOff className="h-3 w-3" />
          Hide
        </button>
      )}
      {(status === "HIDDEN" || status === "SPAM" || status === "REJECTED") && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("restore")}
          className="inline-flex items-center gap-1 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] font-medium text-indigo-600 hover:bg-indigo-500/20 disabled:opacity-50 dark:text-indigo-300"
          title="Restore"
        >
          <AlertTriangle className="h-3 w-3" />
          Restore
        </button>
      )}
      <Link
        href={`/admin/reviews/${review.id}`}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
      >
        <Eye className="h-3 w-3" />
        View
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={onDelete}
        className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-300"
        title="Delete"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState<"" | ReviewStatus>("");
  const [ratingFilter, setRatingFilter] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [ordering, setOrdering] = useState<SortKey>("-created_at");

  const [busyId, setBusyId] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdminReview | null>(null);
  const [confirmBulk, setConfirmBulk] = useState<{
    ids: number[];
    action: "approve" | "reject" | "hide" | "spam";
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const buildParams = () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(PAGE_SIZE));
    params.set("ordering", ordering);
    if (statusFilter) params.set("status", statusFilter);
    if (ratingFilter !== "") params.set("ratings", String(ratingFilter));
    if (debounced) params.set("search", debounced);
    return params.toString();
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Paginated<AdminReview>>(
        `admin/reviews/?${buildParams()}`,
      );
      setItems(data.results ?? []);
      setTotal(data.count ?? 0);
    } catch (e: unknown) {
      let msg = "Failed to load reviews.";
      if (e && typeof e === "object") {
        const anyE = e as {
          response?: { data?: { detail?: string } };
          message?: string;
        };
        if (typeof anyE.response?.data?.detail === "string") {
          msg = anyE.response.data.detail;
        } else if (typeof anyE.message === "string") {
          msg = anyE.message;
        }
      }
      setError(msg);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, ratingFilter, debounced, ordering]);

  const runStatus = async (
    review: AdminReview,
    action: "approve" | "reject" | "hide" | "spam" | "restore",
  ) => {
    setBusyId(review.id);
    try {
      const envelope = await apiPost<Envelope<AdminReview>>(
        `admin/reviews/${review.id}/${action}/`,
      );
      const updated = envelope.data;
      setItems((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
      );
      toast.success(`Review ${action}d`);
    } catch (e: unknown) {
      let msg = `Could not ${action} review.`;
      if (e && typeof e === "object") {
        const anyE = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        if (typeof anyE.response?.data?.message === "string") {
          msg = anyE.response.data.message;
        } else if (typeof anyE.message === "string") {
          msg = anyE.message;
        }
      }
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (review: AdminReview) => {
    setBusyId(review.id);
    try {
      await apiDelete(`admin/reviews/${review.id}/`);
      setItems((prev) => prev.filter((r) => r.id !== review.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Review deleted");
    } catch (e: unknown) {
      let msg = "Could not delete review.";
      if (e && typeof e === "object") {
        const anyE = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        if (typeof anyE.response?.data?.message === "string") {
          msg = anyE.response.data.message;
        } else if (typeof anyE.message === "string") {
          msg = anyE.message;
        }
      }
      toast.error(msg);
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  };

  const performBulk = async (
    ids: number[],
    action: "approve" | "reject" | "hide" | "spam",
  ) => {
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      await apiPost(`admin/reviews/bulk/`, { ids, action });
      toast.success(
        `${ids.length} review${ids.length !== 1 ? "s" : ""} updated`,
      );
      await load();
    } catch (e: unknown) {
      let msg = "Bulk update failed.";
      if (e && typeof e === "object") {
        const anyE = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        if (typeof anyE.response?.data?.message === "string") {
          msg = anyE.response.data.message;
        } else if (typeof anyE.message === "string") {
          msg = anyE.message;
        }
      }
      toast.error(msg);
    } finally {
      setBulkBusy(false);
      setConfirmBulk(null);
    }
  };

  const onSort = (key: "created_at" | "ratings" | "helpful_count") => {
    setOrdering((cur) => {
      if (key === "ratings") return cur === "ratings" ? "-ratings" : "ratings";
      if (key === "helpful_count")
        return cur === "helpful_count" ? "-helpful_count" : "helpful_count";
      return cur === "-created_at" ? "created_at" : "-created_at";
    });
  };

  const sortIndicator = (key: "created_at" | "ratings" | "helpful_count") => {
    if (key === "created_at" && ordering.startsWith("created_at")) {
      return ordering.startsWith("-") ? (
        <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronUp className="h-3 w-3" />
      );
    }
    if (key === "ratings" && (ordering === "ratings" || ordering === "-ratings")) {
      return ordering.startsWith("-") ? (
        <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronUp className="h-3 w-3" />
      );
    }
    if (
      key === "helpful_count" &&
      (ordering === "helpful_count" || ordering === "-helpful_count")
    ) {
      return ordering.startsWith("-") ? (
        <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronUp className="h-3 w-3" />
      );
    }
    return null;
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pendingOrSpamIds = items
    .filter((r) => r.status === "PENDING" || r.status === "SPAM")
    .map((r) => r.id);

  const filtersActive =
    !!debounced || !!statusFilter || ratingFilter !== "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Reviews
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Moderate {total} review{total !== 1 ? "s" : ""} directly from the
            database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingOrSpamIds.length > 0 && (
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() =>
                setConfirmBulk({ ids: pendingOrSpamIds, action: "approve" })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-500/25 disabled:opacity-50 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve {pendingOrSpamIds.length} pending/spam
            </button>
          )}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by product, SKU, customer, or text…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "" | ReviewStatus);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All statuses</option>
              {REVIEW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
            <select
              value={ratingFilter === "" ? "" : String(ratingFilter)}
              onChange={(e) => {
                setRatingFilter(e.target.value === "" ? "" : Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={String(n)}>
                  {n} star{n !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {loading ? (
          <LoadingState label="Loading reviews…" />
        ) : error ? (
          <ErrorState description={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={(filtersActive ? Filter : Inbox) as LucideIcon}
            title={
              filtersActive
                ? "No reviews match your filters."
                : "No reviews yet."
            }
            description={
              filtersActive
                ? "Try clearing the search or filters to see more."
                : "Reviews submitted by customers will appear here for moderation."
            }
            action={
              filtersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setRatingFilter("");
                    setPage(1);
                  }}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Customer</th>
                    <th className="px-5 py-3 text-left font-medium">Product</th>
                    <th className="px-5 py-3 text-left font-medium">
                      <button
                        type="button"
                        onClick={() => onSort("ratings")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Rating {sortIndicator("ratings")}
                      </button>
                    </th>
                    <th className="px-5 py-3 text-left font-medium">Comment</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Verified</th>
                    <th className="px-5 py-3 text-left font-medium">
                      <button
                        type="button"
                        onClick={() => onSort("helpful_count")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Helpful {sortIndicator("helpful_count")}
                      </button>
                    </th>
                    <th className="px-5 py-3 text-left font-medium">
                      <button
                        type="button"
                        onClick={() => onSort("created_at")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Submitted {sortIndicator("created_at")}
                      </button>
                    </th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((r) => (
                    <tr key={r.id} className="transition hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {r.user_avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.user_avatar}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                              {(r.user_email || "?")[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {r.user_first_name
                                ? `${r.user_first_name} ${r.user_last_name ?? ""}`.trim()
                                : r.user_email}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {r.user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {r.product_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.product_image_url}
                              alt=""
                              className="h-10 w-10 rounded-lg border border-border object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground">
                              <ImageOff className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${r.product}`}
                              className="line-clamp-1 font-medium text-foreground hover:underline"
                            >
                              {r.product_name}
                            </Link>
                            {r.product_sku && (
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {r.product_sku}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StarRating value={r.ratings} />
                      </td>
                      <td className="max-w-xs px-5 py-3 text-foreground">
                        <p className="line-clamp-2 text-xs">{r.comment}</p>
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={r.status as ReviewStatus} />
                      </td>
                      <td className="px-5 py-3">
                        {r.verified_purchase ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-foreground">
                        {r.helpful_count ?? 0}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {r.created_at ? formatDate(r.created_at) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <RowActions
                          review={r}
                          busy={busyId === r.id}
                          onAction={(action) => void runStatus(r, action)}
                          onDelete={() => setConfirmDelete(r)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3 text-sm">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} review
                {total !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this review?"
        description={
          confirmDelete
            ? `This will permanently remove the review for "${confirmDelete.product_name ?? "this product"}".`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        loading={busyId === confirmDelete?.id}
        onConfirm={() => {
          if (confirmDelete) void handleDelete(confirmDelete);
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={!!confirmBulk}
        title={
          confirmBulk
            ? `Bulk ${confirmBulk.action} reviews?`
            : "Confirm bulk action"
        }
        description={
          confirmBulk
            ? `${confirmBulk.ids.length} review${confirmBulk.ids.length !== 1 ? "s" : ""} will be moved to ${STATUS_META[actionToStatus(confirmBulk.action)].label}.`
            : ""
        }
        confirmLabel="Apply"
        loading={bulkBusy}
        onConfirm={() => {
          if (confirmBulk) void performBulk(confirmBulk.ids, confirmBulk.action);
        }}
        onCancel={() => setConfirmBulk(null)}
      />
    </div>
  );
}

function actionToStatus(a: "approve" | "reject" | "hide" | "spam"): ReviewStatus {
  switch (a) {
    case "approve":
      return "APPROVED";
    case "reject":
      return "REJECTED";
    case "hide":
      return "HIDDEN";
    case "spam":
      return "SPAM";
  }
}
