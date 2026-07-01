"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

export function CategoryChips({ categories }: { categories: Category[] }) {
  const sp = useSearchParams();
  const active = sp.get("category");
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
      <Link href="/products" className={cn(
        "shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all",
        !active ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900" : "border border-ink-200 hover:border-ink-400 dark:border-ink-800 dark:hover:border-ink-600"
      )}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/products?category=${c.id}`}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all",
            String(active) === String(c.id)
              ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900"
              : "border border-ink-200 hover:border-ink-400 dark:border-ink-800 dark:hover:border-ink-600"
          )}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
