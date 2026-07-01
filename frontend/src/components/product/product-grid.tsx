"use client";

import type { Product } from "@/types";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductGrid({
  products,
  loading,
  empty = "No products to show yet.",
}: {
  products: Product[];
  loading?: boolean;
  empty?: string;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-3xl border border-ink-200/40 p-3 dark:border-ink-800/60">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-ink-500">{empty}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
