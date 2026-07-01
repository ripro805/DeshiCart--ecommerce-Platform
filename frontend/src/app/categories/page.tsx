"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { useCategories } from "@/hooks/useProducts";

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();

  return (
    <Container className="py-12">
      <h1 className="text-display-lg">Categories</h1>
      <p className="mt-2 text-ink-500">Browse by what you&apos;re shopping for.</p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-3xl bg-ink-200/60 dark:bg-ink-800/60" />
            ))
          : categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.id}`}
                className="group relative overflow-hidden rounded-3xl border border-ink-200/60 bg-white/60 p-8 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-elev dark:border-ink-800/60 dark:bg-ink-950/60"
              >
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-secondary shadow-glow transition-transform group-hover:scale-110">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{c.name}</h3>
                {c.description && <p className="mt-1 text-xs text-ink-500">{c.description}</p>}
              </Link>
            ))}
      </div>
    </Container>
  );
}
