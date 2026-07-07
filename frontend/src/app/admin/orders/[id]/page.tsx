"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock,
  CreditCard,
  Hash,
  Loader2,
  Mail,
  MailQuestion,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Receipt,
  RefreshCw,
  Save,
  ShieldCheck,
  StickyNote,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react";

import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/admin/feedback/states";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { usePermission } from "@/components/admin/layout/role-guard";

/* -------------------------------------------------------------------------- */
/*  Backend contract                                                          */
/* -------------------------------------------------------------------------- */

const ORDER_STATUSES = [
  "NOT PAID",
  "READY TO SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number] | string;

type OrderItem = {
  id: number;
  product?: { id?: number; name?: string; price?: number; image_url?: string };
  price?: number | string;
  quantity?: number;
  total_price?: number | string;
};

type Order = {
  id: number;
  user?: number | { id?: number; email?: string; name?: string };
  user_email?: string;
  status?: OrderStatus;
  total_price?: number | string;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
  payment?: {
    id?: number;
    status?: string;
    method?: string;
    transaction_id?: string;
    amount?: number | string;
    currency?: string;
  } | null;
  shipping_address?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
  } | null;
};

const STATUS_TONE: Record<string, { pill: string; bg: string; fg: string; bar: string }> = {
  "NOT PAID":       { pill: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/30",  bg: "bg-amber-500/10",  fg: "text-amber-600",  bar: "bg-amber-500" },
  "READY TO SHIP":  { pill: "bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/30",bg: "bg-indigo-500/10",fg: "text-indigo-600",bar: "bg-indigo-500" },
  SHIPPED:          { pill: "bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/30",bg: "bg-violet-500/10",fg: "text-violet-600",bar: "bg-violet-500" },
  DELIVERED:        { pill: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/30",bg: "bg-emerald-500/10",fg: "text-emerald-600",bar: "bg-emerald-500" },
  CANCELLED:        { pill: "bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/30",   bg: "bg-rose-500/10",   fg: "text-rose-600",   bar: "bg-rose-500" },
};

const STATUS_FLOW: OrderStatus[] = [
  "NOT PAID",
  "READY TO SHIP",
  "SHIPPED",
  "DELIVERED",
];

function getStatusKey(status?: OrderStatus): string {
  if (!status) return "NOT PAID";
  const upper = String(status).toUpperCase();
  const match = ORDER_STATUSES.find((s) => s.toUpperCase() === upper);
  return match ?? String(status);
}

function getTone(status?: OrderStatus) {
  return STATUS_TONE[getStatusKey(status)] ?? STATUS_TONE["NOT PAID"];
}

function formatMoney(value: number | string | undefined | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isFinite(n)) {
    return `৳ ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `৳ ${value}`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
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

function getCustomerName(order: Order | null): string {
  if (!order) return "Guest customer";
  const u: any = order.user;
  if (u && typeof u === "object") {
    return u.name || u.full_name || u.email || `Customer #${u.id ?? "?"}`;
  }
  if (order.user_email) return order.user_email;
  if (typeof order.user === "number") return `Customer #${order.user}`;
  return "Guest customer";
}

function getCustomerEmail(order: Order | null): string {
  if (!order) return "";
  const u: any = order.user;
  if (u && typeof u === "object") return u.email || "";
  return order.user_email || "";
}

function getNextStatus(status?: OrderStatus): OrderStatus | null {
  const key = getStatusKey(status);
  if (key === "CANCELLED") return null;
  const idx = STATUS_FLOW.findIndex((s) => s === key);
  if (idx < 0) return STATUS_FLOW[0];
  if (idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

/* -------------------------------------------------------------------------- */
/*  Local-storage helpers (internal notes draft)                              */
/* -------------------------------------------------------------------------- */

const NOTES_KEY = (id: number | string) => `order:internal-notes:${id}`;

function loadNotes(id: number | string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NOTES_KEY(id)) ?? "";
}
function saveNotes(id: number | string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTES_KEY(id), value);
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const orderId = params.id;

  const { ask, dialog: confirmDialog } = useConfirm();
  const canManage = usePermission("manage_orders");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSavedAt, setNotesSavedAt] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("SSLCommerz");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res: any = await apiGet(`/admin/orders/${orderId}/`);
      const data: Order = res?.data ?? res;
      setOrder(data ?? null);
      if (data?.payment) {
        setPaymentStatus(data.payment.status ?? null);
        setPaymentMethod(data.payment.method ?? "SSLCommerz");
      }
    } catch (err: any) {
      setLoadError(err?.message || "Failed to load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
    setNotes(loadNotes(orderId));
  }, [load, orderId]);

  /* ----------------------------- Status actions --------------------------- */

  const changeStatus = useCallback(
    async (next: OrderStatus) => {
      if (!order) return;
      setSavingStatus(true);
      try {
        await apiPatch(`/admin/orders/${order.id}/update_status/`, {
          status: next,
        });
        setOrder({ ...order, status: next });
        toast.success(`Status updated to ${getStatusKey(next)}`);
      } catch (err: any) {
        toast.error(err?.message || "Failed to update status");
      } finally {
        setSavingStatus(false);
      }
    },
    [order],
  );

  const handleAdvance = useCallback(() => {
    const next = getNextStatus(order?.status);
    if (!next) {
      toast.info("Order is already at the final stage.");
      return;
    }
    void changeStatus(next);
  }, [order, changeStatus]);

  const handleCancel = useCallback(() => {
    if (!order) return;
    void ask({
      tone: "danger",
      title: "Cancel this order?",
      description:
        "The order will be marked as CANCELLED. This action cannot be undone from the UI.",
      confirmLabel: "Cancel order",
      onConfirm: async () => {
        setCancelling(true);
        try {
          await apiPost(`/admin/orders/${order.id}/cancel/`, {});
          setOrder({ ...order, status: "CANCELLED" });
          toast.success("Order cancelled.");
        } catch (err: any) {
          toast.error(err?.message || "Failed to cancel order");
          throw err;
        } finally {
          setCancelling(false);
        }
      },
    });
  }, [order, ask]);

  /* ----------------------------- Internal notes --------------------------- */

  const onSaveNotes = useCallback(() => {
    saveNotes(orderId, notes);
    setNotesSavedAt(new Date().toLocaleTimeString());
    toast.success("Internal notes saved locally.");
  }, [orderId, notes]);

  /* ----------------------------- Derived view ----------------------------- */

  const items = order?.items ?? [];
  const itemCount = items.reduce(
    (sum, it) => sum + Number(it.quantity ?? 0),
    0,
  );
  const tone = getTone(order?.status);
  const statusKey = getStatusKey(order?.status);
  const nextStatus = getNextStatus(order?.status);
  const flowIndex = STATUS_FLOW.findIndex((s) => s === statusKey);
  const isCancelled = statusKey === "CANCELLED";

  return (
    <div className="space-y-6">
      {/* --------------------------- Header -------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/orders"
            className="mt-1 inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All orders
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                Order #{order?.id ?? orderId}
              </h1>
              {order?.status ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tone.pill}`}
                >
                  <CircleDot className="h-3 w-3" />
                  {statusKey}
                </span>
              ) : null}
            </div>
            <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Created {formatDateTime(order?.created_at)}
              </span>
              {order?.updated_at ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Updated {formatDateTime(order.updated_at)}
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {!isCancelled && nextStatus && canManage ? (
            <button
              type="button"
              onClick={handleAdvance}
              disabled={savingStatus || cancelling}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {savingStatus ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              Advance to {nextStatus}
            </button>
          ) : null}
          {!isCancelled && canManage ? (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling || savingStatus}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-500/20 disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Ban className="h-3.5 w-3.5" />
              )}
              Cancel order
            </button>
          ) : null}
        </div>
      </div>

      {/* --------------------------- Workflow strip ------------------------- */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Order workflow
          </h2>
          <p className="text-xs text-muted-foreground">
            Click a step to jump the order to that status
          </p>
        </div>
        <div className="relative">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-muted" />
          <div
            className={`absolute left-0 top-4 h-0.5 ${tone.bar} transition-all`}
            style={{
              width: isCancelled
                ? "0%"
                : `${(Math.max(flowIndex, 0) / (STATUS_FLOW.length - 1)) * 100}%`,
            }}
          />
          <ol className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
            {STATUS_FLOW.map((step, idx) => {
              const reached = !isCancelled && idx <= flowIndex;
              const stepTone = STATUS_TONE[step] ?? STATUS_TONE["NOT PAID"];
              return (
                <li key={step} className="flex flex-col items-center">
                  <button
                    type="button"
                    disabled={!canManage || savingStatus || isCancelled}
                    onClick={() => void changeStatus(step)}
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition ${
                      reached
                        ? `${stepTone.bg} ${stepTone.fg} border-transparent`
                        : "border-border bg-surface text-muted-foreground"
                    } ${canManage && !isCancelled ? "hover:scale-105" : ""} disabled:cursor-not-allowed`}
                    title={canManage ? `Set status to ${step}` : step}
                  >
                    {reached ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </button>
                  <span
                    className={`mt-2 text-center text-xs font-medium ${
                      reached ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        {isCancelled ? (
          <p className="mt-4 rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-600">
            This order has been cancelled. Status changes are disabled.
          </p>
        ) : null}
      </section>

      {/* --------------------------- Body grid ------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: items + customer */}
        <div className="space-y-6 lg:col-span-2">
          {loading ? (
            <LoadingState label="Loading order…" />
          ) : loadError ? (
            <ErrorState
              description={loadError}
              onRetry={() => void load()}
            />
          ) : !order ? (
            <EmptyState
              icon={Receipt}
              title="Order not found"
              description="The order you're looking for doesn't exist or has been removed."
              action={
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                >
                  Back to orders
                </Link>
              }
            />
          ) : (
            <>
              {/* Items */}
              <section className="rounded-xl border border-border bg-surface">
                <header className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Order items
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {items.length} product{items.length !== 1 ? "s" : ""} ·{" "}
                      {itemCount} unit{itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </header>
                {items.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="No items"
                    description="This order has no items attached."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3 text-left font-medium">
                            Product
                          </th>
                          <th className="px-3 py-3 text-right font-medium">
                            Unit price
                          </th>
                          <th className="px-3 py-3 text-right font-medium">
                            Quantity
                          </th>
                          <th className="px-5 py-3 text-right font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => (
                          <tr
                            key={it.id}
                            className="border-b border-border last:border-b-0"
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                                  {it.product?.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={it.product.image_url}
                                      alt={it.product?.name ?? "Product"}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <Link
                                    href={`/admin/products/${it.product?.id ?? ""}`}
                                    className="text-sm font-medium text-foreground hover:text-primary"
                                  >
                                    {it.product?.name ?? `Item #${it.id}`}
                                  </Link>
                                  <p className="text-xs text-muted-foreground">
                                    SKU #{it.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right text-sm text-foreground">
                              {formatMoney(it.price)}
                            </td>
                            <td className="px-3 py-3 text-right text-sm text-foreground">
                              × {it.quantity ?? 0}
                            </td>
                            <td className="px-5 py-3 text-right text-sm font-semibold text-foreground">
                              {formatMoney(it.total_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/40">
                          <td
                            colSpan={3}
                            className="px-5 py-3 text-right text-sm font-semibold text-foreground"
                          >
                            Order total
                          </td>
                          <td className="px-5 py-3 text-right text-base font-bold text-foreground">
                            {formatMoney(order.total_price)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </section>

              {/* Customer + shipping */}
              <section className="rounded-xl border border-border bg-surface">
                <header className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Customer &amp; shipping
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Who's receiving this order
                    </p>
                  </div>
                  <User className="h-5 w-5 text-muted-foreground" />
                </header>
                <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <User className="h-3.5 w-3.5" /> Customer
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {getCustomerName(order).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {getCustomerName(order)}
                        </p>
                        {getCustomerEmail(order) ? (
                          <a
                            href={`mailto:${getCustomerEmail(order)}`}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                          >
                            <Mail className="h-3 w-3" />
                            {getCustomerEmail(order)}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> Shipping address
                    </p>
                    {order.shipping_address ? (
                      <div className="space-y-1 text-sm text-foreground">
                        {order.shipping_address.name ? (
                          <p className="font-medium">
                            {order.shipping_address.name}
                          </p>
                        ) : null}
                        {order.shipping_address.phone ? (
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {order.shipping_address.phone}
                          </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {[
                            order.shipping_address.address,
                            order.shipping_address.city,
                            order.shipping_address.region,
                            order.shipping_address.postal_code,
                          ]
                            .filter(Boolean)
                            .join(", ") || "No address on file"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No shipping address captured for this order.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Internal notes (localStorage draft) */}
              <section className="rounded-xl border border-border bg-surface">
                <header className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Internal notes
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Drafts are saved to this browser only (no backend model
                      yet).
                    </p>
                  </div>
                  <StickyNote className="h-5 w-5 text-muted-foreground" />
                </header>
                <div className="space-y-3 px-5 py-5">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Write private notes for the team…"
                    className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {notesSavedAt
                        ? `Saved locally at ${notesSavedAt}`
                        : "Not saved yet"}
                    </p>
                    <button
                      type="button"
                      onClick={onSaveNotes}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Save className="h-3.5 w-3.5" /> Save notes
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* RIGHT: payment + status controls + activity */}
        <div className="space-y-6">
          {/* Summary card */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Summary
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" /> Order ID
                </dt>
                <dd className="font-mono text-xs text-foreground">
                  #{order?.id ?? orderId}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5" /> Status
                </dt>
                <dd>
                  {order?.status ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone.pill}`}
                    >
                      <CircleDot className="h-3 w-3" />
                      {statusKey}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Package className="h-3.5 w-3.5" /> Items
                </dt>
                <dd className="text-foreground">{itemCount}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <dt className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Wallet className="h-4 w-4" /> Total
                </dt>
                <dd className="text-base font-bold text-foreground">
                  {formatMoney(order?.total_price)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4" /> Payment
            </h2>
            {order?.payment ? (
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="text-foreground">
                    {paymentStatus ?? order.payment.status ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd className="text-foreground">
                    {paymentMethod || order.payment.method || "SSLCommerz"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-semibold text-foreground">
                    {formatMoney(order.payment.amount ?? order.total_price)}
                  </dd>
                </div>
                {order.payment.transaction_id ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Transaction</dt>
                    <dd className="truncate font-mono text-xs text-foreground">
                      {order.payment.transaction_id}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground">
                No payment has been recorded yet.
              </p>
            )}
          </section>

          {/* Activity / quick links */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4" /> Quick actions
            </h2>
            <div className="space-y-2">
              <Link
                href={`/admin/support?order=${orderId}`}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground hover:bg-muted"
              >
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Open support thread
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              {getCustomerEmail(order) ? (
                <a
                  href={`mailto:${getCustomerEmail(order)}?subject=Order #${order?.id ?? orderId}`}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground hover:bg-muted"
                >
                  <span className="inline-flex items-center gap-2">
                    <MailQuestion className="h-3.5 w-3.5" />
                    Email customer
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              ) : null}
              <div className="flex items-center justify-between rounded-md border border-dashed border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5" />
                  Tracking editor
                </span>
                <span className="text-[10px] uppercase">Coming soon</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-dashed border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5" />
                  Refund action
                </span>
                <span className="text-[10px] uppercase">Coming soon</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {!canManage ? (
        <p className="text-xs text-muted-foreground">
          You are viewing this order in read-only mode. Ask a manager for
          <span className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono">
            manage_orders
          </span>{" "}
          permission to make changes.
        </p>
      ) : null}

      {confirmDialog}
    </div>
  );
}