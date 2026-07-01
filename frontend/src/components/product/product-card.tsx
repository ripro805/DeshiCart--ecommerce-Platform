"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, LogIn } from "lucide-react";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { Price } from "@/components/ui/price";
import { StarRating } from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";

interface Props {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: Props) {
  const add = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const isAuth = useAuthStore((s) => !!s.accessToken);
  const router = useRouter();

  async function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuth) {
      toast.message("Sign in required", {
        description: "Please sign in to add items to your cart.",
      });
      router.push(`/login?next=${encodeURIComponent(`/products/${product.id}`)}`);
      return;
    }
    try {
      const cart = await add(product.id, 1);
      if (cart) openDrawer();
      toast.success("Added to cart", { description: product.name });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not add to cart"));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4), ease: [0.28, 0.11, 0.32, 1] }}
      className="group relative overflow-hidden rounded-3xl border border-ink-200/60 bg-white/70 backdrop-blur-xl p-3 transition-all duration-500 hover:shadow-elev hover:-translate-y-1 dark:border-ink-800/60 dark:bg-ink-950/60"
    >
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-ink-100 to-ink-50 dark:from-ink-900 dark:to-ink-950">
          <ProductImage
            src={product.image_url ?? product.image ?? null}
            alt={product.name}
            className="object-cover transition-transform duration-700 ease-apple group-hover:scale-105"
            rounded="rounded-2xl"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 grid place-items-center bg-ink-950/40 backdrop-blur-sm">
              <Badge variant="glass">Out of stock</Badge>
            </div>
          )}
          <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button
              onClick={quickAdd}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink-900 shadow-soft hover:scale-110 transition-transform dark:bg-ink-900/90 dark:text-white"
              aria-label={isAuth ? "Add to cart" : "Sign in to add to cart"}
              title={isAuth ? "Add to cart" : "Sign in to add to cart"}
            >
              {isAuth ? (
                <ShoppingBag className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
            </button>
          </div>
          {product.category?.name && (
            <Badge variant="glass" className="absolute left-2 top-2">
              {product.category.name}
            </Badge>
          )}
        </div>
        <div className="mt-3 px-1">
          <h3 className="truncate text-sm font-semibold tracking-tight">{product.name}</h3>
          <div className="mt-1 flex items-center justify-between gap-2">
            <Price value={product.price} size="sm" />
            <StarRating value={product.average_rating ?? 0} count={product.review_count ?? 0} size={12} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
