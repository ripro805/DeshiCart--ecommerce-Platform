"use client";

import { Trash2 } from "lucide-react";
import type { CartItem as CartItemType } from "@/types";
import { ProductImage } from "@/components/ui/product-image";
import { Price } from "@/components/ui/price";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export function CartItemRow({ item }: { item: CartItemType }) {
  const update = useCartStore((s) => s.updateItem);
  const remove = useCartStore((s) => s.removeItem);

  async function onQty(q: number) {
    try { await update(item.id, q); } catch (e) { toast.error(getErrorMessage(e)); }
  }
  async function onRemove() {
    try { await remove(item.id); toast.success("Removed from cart"); } catch (e) { toast.error(getErrorMessage(e)); }
  }

  return (
    <div className="flex gap-4 rounded-3xl border border-ink-200/60 bg-white/70 p-4 dark:border-ink-800/60 dark:bg-ink-950/60">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden">
        <ProductImage src={item.product.image_url ?? item.product.image ?? null} alt={item.product.name} rounded="rounded-2xl" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="truncate text-sm font-semibold">{item.product.name}</h3>
        <p className="text-xs text-ink-500">{item.product.category?.name}</p>
        <Price value={item.product.price} size="sm" className="mt-1" />
        <div className="mt-3 flex items-center justify-between">
          <QtyStepper value={item.quantity} min={1} max={item.product.stock || 99} onChange={onQty} />
          <button onClick={onRemove} className="grid h-9 w-9 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-danger dark:hover:bg-ink-900" aria-label="Remove">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
