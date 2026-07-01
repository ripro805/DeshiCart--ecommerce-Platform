"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryChips } from "./category-chips";
import { SORT_OPTIONS } from "@/lib/constants";
import type { Category } from "@/types";

export function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [minP, setMinP] = useState(sp.get("min_price") ?? "");
  const [maxP, setMaxP] = useState(sp.get("max_price") ?? "");
  const ordering = sp.get("ordering") ?? "-created_at";

  useEffect(() => { setQ(sp.get("q") ?? ""); }, [sp]);

  function apply(extra: Record<string, string | null> = {}) {
    const next = new URLSearchParams(sp.toString());
    Object.entries(extra).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k); else next.set(k, v);
    });
    router.push(`${pathname}?${next.toString()}`);
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    apply({ q, page: null });
  }

  function onPrice(e: React.FormEvent) {
    e.preventDefault();
    apply({ min_price: minP, max_price: maxP, page: null });
  }

  const hasFilters = sp.get("q") || sp.get("category") || sp.get("min_price") || sp.get("max_price");

  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Search</h3>
        <form onSubmit={onSearch} className="relative mt-3">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="pl-11" />
        </form>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Categories</h3>
        <div className="mt-3"><CategoryChips categories={categories} /></div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Price (BDT)</h3>
        <form onSubmit={onPrice} className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <Input value={minP} onChange={(e) => setMinP(e.target.value)} type="number" placeholder="Min" />
            <span className="text-ink-400">–</span>
            <Input value={maxP} onChange={(e) => setMaxP(e.target.value)} type="number" placeholder="Max" />
          </div>
          <Button type="submit" variant="outline" className="w-full">Apply</Button>
        </form>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Sort by</h3>
        <div className="mt-3 space-y-1">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => apply({ ordering: s.value, page: null })}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                ordering === s.value
                  ? "bg-ink-100 font-semibold dark:bg-ink-900"
                  : "hover:bg-ink-100 dark:hover:bg-ink-900"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <Button variant="ghost" className="w-full" onClick={() => router.push(pathname)}>
          <X className="h-4 w-4" /> Clear filters
        </Button>
      )}
    </aside>
  );
}
