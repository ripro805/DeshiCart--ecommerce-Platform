"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { useOrders } from "@/hooks/useOrders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-3xl bg-ink-200/60 dark:bg-ink-800/60" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="mx-auto h-10 w-10 text-ink-400" />
        <h2 className="mt-4 text-lg font-semibold">No orders yet</h2>
        <p className="mt-1 text-sm text-ink-500">Place your first order to see it here.</p>
        <Link href="/products" className="mt-6 inline-block text-sm text-accent hover:underline">Shop now</Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-display-md">Orders</h1>
      {orders.map((o) => (
        <Link key={o.id} href={`/account/orders/${o.id}`}>
          <Card className="flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-500">Order #{o.id}</p>
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{formatDate(o.created_at)}</p>
              <p className="mt-2 text-sm">{o.items.length} items</p>
            </div>
            <div className="text-right">
              <Price value={o.total_price} size="md" />
              <div className="mt-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[o.status]}`}>
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
