"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Ban,
  RotateCcw,
  ArrowLeft,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder, useInitiatePayment } from "@/hooks/useOrders";
import { formatPrice, getErrorMessage } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

function CancelledInner() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const tranId = params.get("tran_id");

  const { data: order, isLoading } = useOrder(orderId ?? undefined);
  const paymentMutation = useInitiatePayment();
  const cart = useCartStore();
  const [resuming, setResuming] = useState(false);

  const onResume = async () => {
    if (!order) return;
    setResuming(true);
    try {
      const res = await paymentMutation.mutateAsync(order.id);
      if (res.gateway_url) {
        window.location.href = res.gateway_url;
      } else {
        toast.error("Could not restart the payment session.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResuming(false);
    }
  };

  const onClearCart = () => {
    cart.clearLocal?.();
    toast.success("Cart cleared");
  };

  return (
    <Container className="py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.05 }}
          className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-white shadow-glow"
        >
          <Ban className="h-12 w-12" strokeWidth={1.6} />
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-amber-400/60"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.div>

        <h1 className="mt-6 text-display-lg">Payment cancelled</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-500">
          You cancelled the payment at the gateway. No money was charged — your
          order is still reserved if you&apos;d like to come back.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
            <Ban className="h-3.5 w-3.5" /> Cancelled by you
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100/60 px-3 py-1 dark:bg-ink-900/60">
            <Clock className="h-3.5 w-3.5" /> Held for 24 hours
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mx-auto mt-10 max-w-3xl space-y-6"
      >
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold">What happens next</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-600 dark:text-ink-300">
            <ReasonRow>
              Your order is on hold for the next 24 hours — finish payment any time
              before it expires.
            </ReasonRow>
            <ReasonRow>
              No money has been charged to your card, wallet, or bank account.
            </ReasonRow>
            <ReasonRow>
              Items stay in your cart and your reserved prices are locked in.
            </ReasonRow>
            <ReasonRow>
              After 24 hours the reservation expires and stock returns to general
              availability.
            </ReasonRow>
          </ul>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Order summary</h2>
          {isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : order ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Tile label="Order" value={`#${order.id}`} />
              <Tile label="Total" value={formatPrice(order.total_price)} />
              <Tile label="Status" value={order.status} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-500">
              {orderId
                ? `Order #${orderId} is held. Resume payment or browse more products below.`
                : "Your cart is still saved. Pick a product to start a fresh checkout."}
            </p>
          )}
          {tranId && (
            <p className="mt-4 text-xs text-ink-500">
              Reference: <span className="font-mono">{tranId}</span>
            </p>
          )}
        </Card>

        <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Your information is safe</p>
              <p className="text-xs text-ink-500">
                We never store card details — SSLCommerz handles the entire payment.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/cart">
            <Button variant="ghost" onClick={onClearCart}>
              <Trash2 className="h-4 w-4" /> Clear cart
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/products">
              <Button variant="glass">
                <ShoppingBag className="h-4 w-4" /> Keep shopping
              </Button>
            </Link>
            {order && (
              <Button onClick={onResume} loading={resuming}>
                <RotateCcw className="h-4 w-4" /> Resume payment
              </Button>
            )}
            {!order && (
              <Link href="/checkout">
                <Button>
                  <ArrowLeft className="h-4 w-4" /> Back to checkout
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </Container>
  );
}

function ReasonRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
      <span>{children}</span>
    </li>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ink-100/40 p-4 dark:bg-ink-900/40">
      <p className="text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

export default function OrderCancelledPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-24">
          <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-ink-200/60 dark:bg-ink-800/60" />
        </Container>
      }
    >
      <CancelledInner />
    </Suspense>
  );
}
