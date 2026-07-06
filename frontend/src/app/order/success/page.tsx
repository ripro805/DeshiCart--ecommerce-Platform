"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Package,
  Truck,
  Receipt,
  ShoppingBag,
  ArrowRight,
  Home,
  Mail,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/ui/product-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/hooks/useOrders";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import api from "@/lib/api";

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("order");
  const tranId = params.get("tran_id");

  const { data: order, isLoading, isError, refetch } = useOrder(orderId ?? undefined);

  // Confetti burst on first mount of a successful order (visual delight).
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Subtle toast confirms SSLCOMMERZ round-trip landed.
    if (orderId) toast.success("Payment confirmed — thank you!");
  }, [orderId]);

  const estimatedDelivery = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d;
  }, []);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      const { data } = await api.get(`/customer/orders/${order.id}/invoice/`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DeshiCart-Invoice-#${order.id}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch {
      toast.error("Invoice download will be available shortly.");
    }
  };

  if (!orderId) {
    return (
      <Container className="py-24 text-center">
        <Card className="mx-auto max-w-xl p-12">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="mt-4 text-display-md">Payment confirmed</h1>
          <p className="mt-2 text-sm text-ink-500">
            Your purchase went through. We&apos;ll email a copy of your invoice.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/account/orders">
              <Button>View my orders</Button>
            </Link>
            <Link href="/products">
              <Button variant="glass">Continue shopping</Button>
            </Link>
          </div>
        </Card>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Container>
    );
  }

  if (isError || !order) {
    return (
      <Container className="py-24 text-center">
        <Card className="mx-auto max-w-xl p-12">
          <Package className="mx-auto h-12 w-12 text-ink-400" />
          <h1 className="mt-4 text-display-md">Order #{orderId}</h1>
          <p className="mt-2 text-sm text-ink-500">
            Your payment went through. We&apos;re still syncing your order details.
          </p>
          <Button className="mt-8" variant="glass" onClick={() => refetch()}>
            <Loader2 className="h-4 w-4" /> Refresh
          </Button>
          <div className="mt-4">
            <Link href="/account/orders" className="text-sm text-accent hover:underline">
              Go to my orders →
            </Link>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      {/* ---------- Hero ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.05 }}
          className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-glow"
        >
          <CheckCircle2 className="h-12 w-12" strokeWidth={1.6} />
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-emerald-400/60"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.div>

        <h1 className="mt-6 text-display-lg">Payment successful</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-500">
          Your order has been confirmed. We&apos;ve sent the details to your inbox and
          our warehouse is already prepping your parcel.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> Paid
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100/60 px-3 py-1 dark:bg-ink-900/60">
            <Mail className="h-3.5 w-3.5" /> Receipt sent
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100/60 px-3 py-1 dark:bg-ink-900/60">
            <Truck className="h-3.5 w-3.5" /> Ships within 24h
          </span>
        </div>
      </motion.div>

      {/* ---------- Order summary ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mx-auto mt-12 max-w-3xl space-y-6"
      >
        <Card className="overflow-hidden">
          {/* gradient strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-primary to-accent" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Order</p>
                <h2 className="mt-1 text-display-md">#{order.id}</h2>
                <p className="mt-1 text-xs text-ink-500">
                  Placed {formatDateTime(order.created_at)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    ORDER_STATUS_COLORS[order.status] ?? ""
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
                {order.payment && (
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      PAYMENT_STATUS_COLORS[order.payment.status] ?? ""
                    }`}
                  >
                    Payment: {PAYMENT_STATUS_LABELS[order.payment.status] ?? order.payment.status}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryTile
                icon={<Receipt className="h-4 w-4" />}
                label="Transaction ID"
                value={order.payment?.transaction_id || tranId || "—"}
                mono
              />
              <SummaryTile
                icon={<Receipt className="h-4 w-4 text-accent" />}
                label="Amount paid"
                value={formatPrice(order.total_price)}
              />
              <SummaryTile
                icon={<Truck className="h-4 w-4" />}
                label="Estimated delivery"
                value={estimatedDelivery.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              />
            </div>

            {order.address && (
              <div className="mt-6 rounded-2xl bg-ink-100/40 p-4 text-sm dark:bg-ink-900/40">
                <p className="font-semibold">Shipping to</p>
                <p className="mt-1 text-ink-600 dark:text-ink-300">{order.address}</p>
              </div>
            )}
          </div>
        </Card>

        {/* ---------- Items ---------- */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Items in this order</h3>
            <span className="text-xs text-ink-500">{order.items.length} item(s)</span>
          </div>
          <ul className="mt-5 divide-y divide-ink-200/60 dark:divide-ink-800/60">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl">
                  <ProductImage
                    src={item.product?.image_url ?? item.product?.image ?? null}
                    alt={item.product?.name ?? `Product ${item.id}`}
                    className="h-full w-full"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.product?.name ?? `Product #${item.id}`}</p>
                  <p className="text-xs text-ink-500">Qty {item.quantity}</p>
                </div>
                <Price value={item.price} size="sm" />
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between border-t border-ink-200/60 pt-5 dark:border-ink-800/60">
            <p className="text-sm font-semibold text-ink-500">Total paid</p>
            <Price value={order.total_price} size="lg" />
          </div>
        </Card>

        {/* ---------- Actions ---------- */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/products">
            <Button variant="ghost">
              <Home className="h-4 w-4" /> Continue shopping
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="glass" onClick={handleDownloadInvoice}>
              <Receipt className="h-4 w-4" /> Download invoice
            </Button>
            <Link href={`/account/orders/${order.id}`}>
              <Button>
                <ShoppingBag className="h-4 w-4" /> View order details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <p className="pt-2 text-center text-xs text-ink-500">
          Need help? Reach our support team and reference order{" "}
          <span className="font-medium text-ink-700 dark:text-ink-200">#{order.id}</span>.
        </p>
      </motion.div>
    </Container>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-ink-100/40 p-4 dark:bg-ink-900/40">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500">
        {icon}
        {label}
      </div>
      <p
        className={`mt-2 text-sm font-semibold ${mono ? "font-mono text-xs sm:text-sm break-all" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-24">
          <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-ink-200/60 dark:bg-ink-800/60" />
        </Container>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
