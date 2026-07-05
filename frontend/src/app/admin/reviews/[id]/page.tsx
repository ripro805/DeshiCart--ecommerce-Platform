"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  EyeOff,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Star,
  ImageOff,
  Mail,
  Calendar,
  Package,
  ThumbsUp,
  ShieldCheck,
} from "lucide-react";

import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { toast } from "@/components/admin/feedback/toast-store";
import {
  LoadingState,
  ErrorState,
} from "@/components/admin/feedback/states";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import type { AdminReview, ReviewStatus } from "@/types";

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
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${meta.tone}`}
    >
      {meta.label}
    </span>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i <= value
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/40"
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">{value}/5</span>
    </span>
  );
}

function ProductThumb({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className="h-16 w-16 rounded-lg border border-border object-cover"
    />
  );
}

function displayName(r: AdminReview): string {
  const first = r.user_first_name?.trim();
  const last = r.user_last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  if (r.name?.trim()) return r.name;
  if (r.user_email) return r.user_email.split("@")[0];
  return `User #${r.user}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function unwrap<T>(res: Envelope<T> | T): T {
  if (res && typeof res === "object" && "data" in (res as object)) {
    return (res as Envelope<T>).data;
  }
  return res as T;
}

export default function ReviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const { ask, dialog } = useConfirm();

  const [review, setReview] = useState<AdminReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<Envelope<AdminReview> | AdminReview>(
        `/admin/reviews/${id}/`
      );
      setReview(unwrap(res));
    } catch (e) {
      setError(getErrorMessage(e, "Failed to load review"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (Number.isFinite(id)) fetchReview();
  }, [id, fetchReview]);

  async function setStatus(
    action: "approve" | "reject" | "hide" | "spam" | "restore"
  ) {
    if (!review) return;
    setBusy(true);
    try {
      const res = await apiPost<Envelope<AdminReview> | AdminReview>(
        `/admin/reviews/${review.id}/${action}/`
      );
      setReview(unwrap(res));
      toast.success(`Review ${action}d`);
    } catch (e) {
      toast.error(getErrorMessage(e, `Could not ${action} review`));
    } finally {
      setBusy(false);
    }
  }

  async function deleteReview() {
    if (!review) return;
    await ask({
      title: "Delete review?",
      description: `This will permanently delete the review by ${displayName(
        review
      )}. This action cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        await apiDelete(`/admin/reviews/${review.id}/`);
        toast.success("Review deleted");
        window.location.href = "/admin/reviews";
      },
    });
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading review…" />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="space-y-4 p-6">
        <Link
          href="/admin/reviews"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to reviews
        </Link>
        <ErrorState
          title="Could not load review"
          description={error ?? "Review not found."}
          onRetry={fetchReview}
        />
        {dialog}
      </div>
    );
  }

  const status = (review.status as ReviewStatus) ?? "PENDING";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/reviews"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Review #{review.id}
            </h1>
            <p className="text-sm text-muted-foreground">
              Posted {formatDate(review.created_at)}
              {review.updated_at && review.updated_at !== review.created_at && (
                <> · Updated {formatDate(review.updated_at)}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchReview}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <StatusPill status={status} />
        </div>
      </div>

      {/* Grid: Product + Customer */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Package className="h-3.5 w-3.5" /> Product
          </div>
          <div className="flex items-center gap-3">
            <ProductThumb
              src={review.product_image_url}
              alt={review.product_name ?? "Product"}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {review.product_name ?? `Product #${review.product}`}
              </p>
              {review.product_sku && (
                <p className="text-xs text-muted-foreground">
                  SKU: {review.product_sku}
                </p>
              )}
              <Link
                href={`/admin/products/${review.product}`}
                className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
              >
                View product →
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> Customer
          </div>
          <div className="flex items-center gap-3">
            {review.user_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={review.user_avatar}
                alt={displayName(review)}
                className="h-12 w-12 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold uppercase text-muted-foreground">
                {initials(displayName(review))}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {displayName(review)}
              </p>
              {review.user_email && (
                <p className="truncate text-xs text-muted-foreground">
                  {review.user_email}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                User ID: {review.user}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Review body */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StarRating value={review.ratings} />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {review.verified_purchase && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3 w-3" /> Verified purchase
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5">
              <ThumbsUp className="h-3 w-3" /> {review.helpful_count ?? 0} helpful
            </span>
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {review.comment || (
            <span className="italic text-muted-foreground">(no comment)</span>
          )}
        </p>

        <div className="mt-5 grid gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-2">
          <div className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Created{" "}
            {formatDate(review.created_at)}
          </div>
          {review.updated_at && (
            <div className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Updated{" "}
              {formatDate(review.updated_at)}
            </div>
          )}
        </div>
      </div>

      {/* Moderation */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Moderation
        </div>
        <div className="flex flex-wrap gap-2">
          {status !== "APPROVED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus("approve")}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve
            </button>
          )}
          {status !== "REJECTED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus("reject")}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-300"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
          )}
          {status !== "HIDDEN" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus("hide")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <EyeOff className="h-4 w-4" /> Hide
            </button>
          )}
          {status !== "SPAM" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus("spam")}
              className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-500/20 disabled:opacity-50 dark:text-orange-300"
            >
              <AlertTriangle className="h-4 w-4" /> Mark spam
            </button>
          )}
          {(status === "HIDDEN" ||
            status === "SPAM" ||
            status === "REJECTED") && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus("restore")}
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-500/20 disabled:opacity-50 dark:text-indigo-300"
            >
              <AlertTriangle className="h-4 w-4" /> Restore
            </button>
          )}
          <div className="ml-auto" />
          <button
            type="button"
            disabled={busy}
            onClick={deleteReview}
            className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-300"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {dialog}
    </div>
  );
}
