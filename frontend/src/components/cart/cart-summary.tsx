"use client";

import { formatPrice } from "@/lib/utils";
import type { Cart } from "@/types";

export function CartSummary({ cart }: { cart: Cart | null }) {
  const items = cart?.items ?? [];
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const total = cart?.total_price ?? subtotal;

  return (
    <div className="rounded-3xl border border-ink-200/60 bg-white/70 p-6 dark:border-ink-800/60 dark:bg-ink-950/60 space-y-3">
      <h3 className="text-lg font-semibold">Order summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-500">Items ({totalItems})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-500">Shipping</span>
          <span className="text-emerald-600">Free</span>
        </div>
      </div>
      <div className="h-px bg-ink-200/60 dark:bg-ink-800" />
      <div className="flex justify-between text-base font-semibold">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
