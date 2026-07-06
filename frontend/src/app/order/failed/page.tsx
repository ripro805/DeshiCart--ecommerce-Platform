"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  XCircle,
  RefreshCcw,
  ArrowLeft,
  HelpCircle,
  ShoppingBag,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder, useInitiatePayment } from "@/hooks/useOrders";
import { formatPrice, getErrorMessage } from "@/lib/utils";

function FailedInner() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("order");
  const tranId = params.get("tran_id");

  const { data: order, isLoading } = useOrder(orderId ?? undefined);
  const paymentMutation = useInitiatePayment();
  const [retrying, setRetrying] = useState(false);

  const onRetry = async () => {
    if (!order) return;
    setRetrying(true);
    try {
      const res = await paymentMutation.mutateAsync(order.id);
      if (res.gateway_url) {
        window.location.href = res.gateway_url;
      } else {
        toast.error("Could not restart the payment session. Please try again.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRetrying(false);
    }
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
          className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-glow"
        >
          <XCircle className="h-12 w-12" strokeWidth={1.6} />
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-rose-400/60"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.div>

        <h1 className="mt-6 text-display-lg">Payment failed</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-500">
          We couldn&apos;t complete your transaction. No money has been charged and your
          cart is safe — try again with another payment method.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mx-auto mt-10 max-w-3xl space-y-6"
      >
        {/* What likely happened */}
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold">What likely happened</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-600 dark:text-ink-300">
            <ReasonRow>
              Your card was declined by the issuing bank — common for first-time
              international transactions.
            </ReasonRow>
            <ReasonRow>
              The card number, CVV, or expiry date didn&apos;t match your bank&apos;s
              records.
            </ReasonRow>
            <ReasonRow>
              Your bank flagged the charge as suspicious and blocked it for safety.
            </ReasonRow>
            <ReasonRow>
              The session timed out before you confirmed — try again from the start.
            </ReasonRow>
          </ul>
        </Card>

        {/* Order status (if known) */}
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Your order</h2>
          {isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : order ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Tile label="Order" value={`#${order.id}`} />
              <Tile
                label="Total"
                value={formatPrice(order.total_price)}
              />
              <Tile
                label="Status"
                value={order.status === "NOT PAID" ? "Awaiting payment" : order.status}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-500">
              {orderId
                ? `Order #${orderId} is held for 24 hours — no charges have been made.`
                : "Your cart is still saved. You can pick up where you left off."}
            </p>
          )}
          {tranId && (
            <p className="mt-4 text-xs text-ink-500">
              Reference: <span className="font-mono">{tranId}</span>
            </p>
          )}
        </Card>

        {/* Trust strip */}
        <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Secure payments by SSLCommerz</p>
              <p className="text-xs text-ink-500">
                Industry-standard encryption on every transaction.
              </p>
            </div>
          </div>
          <Link href="/support" className="text-xs text-accent hover:underline">
            <HelpCircle className="mr-1 inline h-3.5 w-3.5" /> Need help? Contact support
          </Link>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/cart">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4" /> Back to cart
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/products">
              <Button variant="glass">
                <ShoppingBag className="h-4 w-4" /> Keep shopping
              </Button>
            </Link>
            <Button onClick={onRetry} loading={retrying} disabled={!order}>
              <RefreshCcw className="h-4 w-4" /> Retry payment
            </Button>
          </div>
        </div>

        <p className="pt-2 text-center text-xs text-ink-500">
          Still stuck? Reach out at{" "}
          <a
            href="mailto:support@deshicart.local"
            className="font-medium text-accent hover:underline"
          >
            <Mail className="mr-1 inline h-3.5 w-3.5" />
            support@deshicart.local
          </a>{" "}
          with the order number and we&apos;ll sort it out.
        </p>
      </motion.div>
    </Container>
  );
}

function ReasonRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-rose-400" />
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

export default function OrderFailedPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-24">
          <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-ink-200/60 dark:bg-ink-800/60" />
        </Container>
      }
    >
      <FailedInner />
    </Suspense>
  );
}
