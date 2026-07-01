"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Zap } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "@/components/product/product-grid";
import { useCategories, useProducts } from "@/hooks/useProducts";

export default function HomePage() {
  const { data: categories = [] } = useCategories();
  const { data: productsData, isLoading } = useProducts({ ordering: "-created_at", page: 1 });
  const featured = productsData?.results?.slice(0, 10) ?? [];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-transparent blur-3xl dark:from-primary/20 dark:via-accent/10" />
          <div className="absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary-400/15 to-transparent blur-3xl dark:from-primary-400/10" />
          <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-accent/15 to-transparent blur-3xl dark:from-accent/10" />
        </div>

        <Container className="pt-20 pb-32 sm:pt-32 sm:pb-40">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="glass" className="mb-6">
                <Sparkles className="h-3 w-3" /> Now delivering nationwide
              </Badge>
            </motion.div>

            <motion.h1
              className="text-display-2xl text-balance text-ink-900 dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.28, 0.11, 0.32, 1] }}
            >
              Shop premium.<br />
              <span className="bg-gradient-to-br from-primary via-primary-500 to-accent bg-clip-text text-transparent">
                Made in Bangladesh.
              </span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-6 max-w-2xl text-balance text-lg text-ink-500 dark:text-ink-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.28, 0.11, 0.32, 1] }}
            >
              DeshiCart brings together the finest local craftsmanship and global brands —
              delivered fast, with a checkout you&apos;ll actually enjoy.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.28, 0.11, 0.32, 1] }}
            >
              <Link href="/products">
                <Button size="lg">Shop now <ArrowRight className="h-4 w-4" /></Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" variant="glass">Browse categories</Button>
              </Link>
            </motion.div>

            <motion.div
              className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.28, 0.11, 0.32, 1] }}
            >
              <FeatureCard icon={<Truck className="h-5 w-5" />} title="Free shipping" subtitle="On orders over ৳2,000" />
              <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Secure checkout" subtitle="SSLCommerz protected" />
              <FeatureCard icon={<Zap className="h-5 w-5" />} title="Fast support" subtitle="7 days a week" />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* CATEGORIES STRIP */}
      {categories.length > 0 && (
        <section>
          <Container className="py-12">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-display-md">Shop by category</h2>
                <p className="mt-1 text-sm text-ink-500">Curated collections, hand-picked.</p>
              </div>
              <Link href="/categories" className="text-sm text-accent hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {categories.slice(0, 6).map((c, i) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.id}`}
                  className="group relative overflow-hidden rounded-3xl border border-ink-200/60 bg-white/70 p-6 text-center backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-elev dark:border-ink-800/60 dark:bg-ink-950/60"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/30 text-primary group-hover:scale-110 transition-transform">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold">{c.name}</h3>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* FEATURED */}
      <section>
        <Container className="py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-display-md">New arrivals</h2>
              <p className="mt-1 text-sm text-ink-500">Fresh in this week.</p>
            </div>
            <Link href="/products">
              <Button variant="ghost">See more <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
          <ProductGrid products={featured} loading={isLoading} empty="No products yet — check back soon." />
        </Container>
      </section>
    </>
  );
}

function FeatureCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-ink-200/60 bg-white/60 p-5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
        {icon}
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="text-xs text-ink-500">{subtitle}</p>
    </div>
  );
}
