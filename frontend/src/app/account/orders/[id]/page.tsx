"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Package, MapPin, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { useOrder, useCancelOrder } from "@/hooks/useOrders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, CANCELLABLE_ORDER_STATUSES } from "@/lib/constants";
import { formatDate, getErrorMessage } from "@/lib/utils";

interface Props {
  params: { id: string };
}

export default function OrderDetailPage({ params }: Props) {
  const { id } = params;
  const router = useRouter();
  const { data: order, isLoading } = useOrder(id);
  const cancelMutation = useCancelOrder();
  const [cancelling, setCancelling] = useState(false);

  const onCancel = async () => {
    setCancelling(true);
    try {
      await cancelMutation.mutateAsync(order!.id);
      toast.success("Order cancelled");
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-ink-200/60 dark:bg-ink-800/60" />;
  }

  if (!order) {
    return (
      <Card className="p-12 text-center">
        <Package className="mx-auto h-10 w-10 text-ink-400" />
        <h2 className="mt-4 text-lg font-semibold">Order not found</h2>
        <Link href="/account/orders" className="mt-6 inline-block text-sm text-accent hover:underline">Back to orders</Link>
      </Card>
    );
  }

  const canCancel = !!order.status && CANCELLABLE_ORDER_STATUSES.has(order.status);

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-700 dark:hover:text-ink-200">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Order</p>
            <h1 className="mt-1 text-display-md">#{order.id}</h1>
            <p className="mt-1 text-sm text-ink-500">Placed {formatDate(order.created_at)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
            {order.payment && (
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${PAYMENT_STATUS_COLORS[order.payment.status]}`}>
                Payment: {PAYMENT_STATUS_LABELS[order.payment.status] ?? order.payment.status}
              </span>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-ink-100/40 p-4 dark:bg-ink-900/40">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4" /> Delivery address
            </div>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{order.address || "—"}</p>
          </div>
          {order.notes && (
            <div className="rounded-2xl bg-ink-100/40 p-4 dark:bg-ink-900/40">
              <p className="text-sm font-semibold">Notes</p>
              <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{order.notes}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Items</h2>
        <ul className="mt-4 divide-y divide-ink-200/60 dark:divide-ink-800/60">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{item.product?.name ?? `Product #${item.product?.id ?? item.id}`}</p>
                <p className="text-sm text-ink-500">Qty: {item.quantity}</p>
              </div>
              <Price value={item.price} size="sm" />
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center justify-between border-t border-ink-200/60 pt-4 dark:border-ink-800/60">
          <p className="text-sm font-semibold">Total</p>
          <Price value={order.total_price} size="lg" />
        </div>
      </Card>

      {canCancel && (
        <Button variant="outline" loading={cancelling} onClick={onCancel} className="text-rose-600">
          <XCircle className="h-4 w-4" /> Cancel order
        </Button>
      )}
    </div>
  );
}
