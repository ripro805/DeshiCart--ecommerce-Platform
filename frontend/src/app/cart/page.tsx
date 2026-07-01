"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";

export default function CartPage() {
  const cart = useCartStore();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) cart.fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const onRemove = async (itemId: number) => {
    try {
      await cart.removeItem(itemId);
      toast.success("Removed");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onUpdate = async (itemId: number, qty: number) => {
    try {
      await cart.updateItem(itemId, qty);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!isAuthenticated) {
    return (
      <Container className="py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-ink-400" />
        <h1 className="mt-4 text-display-lg">Sign in to view your cart</h1>
        <Link href="/login?next=/cart">
          <Button className="mt-6">Sign in</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <h1 className="text-display-lg">Your cart</h1>
      <p className="mt-1 text-sm text-ink-500">{cart.cart?.items.length ?? 0} items</p>

      {cart.isLoading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-200/60 dark:bg-ink-800/60" />
          ))}
        </div>
      ) : !cart.cart || cart.cart.items.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-ink-200/60 bg-white/60 p-12 text-center backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
          <ShoppingBag className="mx-auto h-10 w-10 text-ink-400" />
          <h2 className="mt-4 text-lg font-semibold">Your cart is empty</h2>
          <p className="mt-1 text-sm text-ink-500">Looks like you haven&apos;t added anything yet.</p>
          <Link href="/products">
            <Button className="mt-6">Shop now</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {cart.cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onRemove={() => onRemove(item.id)}
                onChange={(qty) => onUpdate(item.id, qty)}
              />
            ))}
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CartSummary cart={cart.cart} />
            <Link href="/checkout" className="block">
              <Button size="lg" className="mt-4 w-full">Proceed to checkout</Button>
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}
