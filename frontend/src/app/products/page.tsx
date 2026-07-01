"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductFilters } from "@/components/product/product-filters";
import { useProducts, useCategories } from "@/hooks/useProducts";

export default function ProductsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const filters = useMemo(
    () => ({
      search: sp.get("q") || "",
      category: sp.get("category") || "",
      min_price: sp.get("min_price") || "",
      max_price: sp.get("max_price") || "",
      ordering: sp.get("ordering") || "",
      page: sp.get("page") || "1",
    }),
    [sp]
  );

  const { data, isLoading } = useProducts(filters as Record<string, string>);
  const { data: categories = [] } = useCategories();
  const products = data?.results ?? [];
  const count = data?.count ?? 0;

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-display-lg">All products</h1>
        <p className="mt-1 text-sm text-ink-500">{count > 0 ? `${count} items` : "Browse the catalog"}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <ProductFilters categories={categories} />
        <div>
          <ProductGrid products={products} loading={isLoading} empty="No products match these filters." />
          {data && data.count > (data.results?.length ?? 0) && (
            <Pagination
              page={Number(filters.page) || 1}
              totalPages={Math.ceil((data.count || 0) / (data.results?.length || 12))}
              onChange={(p) => {
                const params = new URLSearchParams(sp.toString());
                params.set("page", String(p));
                router.push(`/products?${params.toString()}`);
              }}
            />
          )}
        </div>
      </div>
    </Container>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) =>
    totalPages <= 7 ? i + 1 : Math.max(1, page - 3) + i
  );
  return (
    <nav className="mt-10 flex items-center justify-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-full border border-ink-200/60 bg-white/70 px-4 py-2 text-sm disabled:opacity-50 dark:border-ink-800/60 dark:bg-ink-950/60"
      >
        Previous
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`grid h-9 w-9 place-items-center rounded-full text-sm transition ${
            p === page
              ? "bg-gradient-to-br from-primary to-accent text-secondary shadow-glow"
              : "border border-ink-200/60 bg-white/70 hover:bg-ink-100/60 dark:border-ink-800/60 dark:bg-ink-950/60 dark:hover:bg-ink-900/60"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-full border border-ink-200/60 bg-white/70 px-4 py-2 text-sm disabled:opacity-50 dark:border-ink-800/60 dark:bg-ink-950/60"
      >
        Next
      </button>
    </nav>
  );
}
