"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { ProductImage } from "@/components/ui/product-image";
import { Container } from "@/components/ui/container";
import { cn, formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const cart = useCartStore((s) => s.cart);
  const isLoading = useCartStore((s) => s.isLoading);
  const update = useCartStore((s) => s.updateItem);
  const remove = useCartStore((s) => s.removeItem);
  const fetch = useCartStore((s) => s.fetch);

  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const totalItems = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const totalPrice =
    cart?.total_price ??
    cart?.items?.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0) ??
    0;

  function goCheckout() {
    close();
    if (!accessToken) {
      router.push("/login?next=/checkout");
    } else {
      router.push("/checkout");
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[80] bg-ink-950/60 backdrop-blur-sm transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-[90] flex h-full w-full max-w-md flex-col bg-white shadow-elev transition-transform duration-500 ease-apple dark:bg-ink-950 dark:text-ink-100",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between border-b border-ink-200/60 px-6 py-4 dark:border-ink-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Your Cart</h2>
            <span className="text-sm text-ink-400">({totalItems})</span>
          </div>
          <button onClick={close} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink-100 dark:hover:bg-ink-900">
            <X className="h-5 w-5" />
          </button>
        </header>

        {!accessToken ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-ink-100 dark:bg-ink-900">
              <ShoppingBag className="h-7 w-7 text-ink-500" />
            </div>
            <h3 className="text-lg font-semibold">Sign in to use your cart</h3>
            <p className="text-sm text-ink-500 max-w-xs">
              Save items, sync across devices and checkout in seconds.
            </p>
            <Link href="/login" onClick={close}>
              <Button>Sign in</Button>
            </Link>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-ink-100 dark:bg-ink-900">
              <ShoppingBag className="h-7 w-7 text-ink-500" />
            </div>
            <h3 className="text-lg font-semibold">Your cart is empty</h3>
            <p className="text-sm text-ink-500 max-w-xs">Discover products hand-picked for you.</p>
            <Link href="/products" onClick={close}>
              <Button variant="primary">Browse products</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="space-y-4">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex gap-3 rounded-2xl p-2 hover:bg-ink-50 dark:hover:bg-ink-900/50">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden">
                      <ProductImage
                        src={item.product.image_url ?? item.product.image ?? null}
                        alt={item.product.name}
                        rounded="rounded-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate text-sm font-medium">{item.product.name}</h4>
                      <p className="text-xs text-ink-500 truncate">{item.product.category?.name}</p>
                      <Price value={item.product.price} size="sm" className="mt-1" />
                      <div className="mt-2 flex items-center justify-between">
                        <QtyStepper
                          value={item.quantity}
                          min={1}
                          max={item.product.stock || 99}
                          size="sm"
                          onChange={(q) => update(item.id, q)}
                        />
                        <button
                          onClick={() => remove(item.id)}
                          disabled={isLoading}
                          className="grid h-8 w-8 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-danger dark:hover:bg-ink-900"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-ink-200/60 p-6 dark:border-ink-800 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">Subtotal</span>
                <span className="font-semibold">{formatPrice(totalPrice)}</span>
              </div>
              <Button onClick={goCheckout} variant="primary" size="lg" className="w-full justify-center">
                Checkout
              </Button>
              <button onClick={() => { fetch(); }} className="text-xs text-ink-500 hover:text-ink-900 dark:hover:text-white mx-auto block">
                Refresh cart
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
