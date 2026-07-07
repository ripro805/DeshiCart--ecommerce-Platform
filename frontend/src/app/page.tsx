"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Zap } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-grid";
import { HeroSlider } from "@/components/hero-slider";
import { BrandTicker } from "@/components/brand-ticker";
import { DiscountSection } from "@/components/discount-section";
import { useCategories, useProducts } from "@/hooks/useProducts";

export default function HomePage() {
  const { data: categories = [] } = useCategories();
  const { data: productsData, isLoading } = useProducts({ ordering: "-created_at", page: 1 });
  const featured = productsData?.results?.slice(0, 10) ?? [];

  return (
    <>
      {/* HERO SLIDER */}
      <HeroSlider />

      {/* BRAND TICKER */}
      <BrandTicker />

      {/* VALUE PROPS */}
      <section>
        <Container className="py-10 sm:py-14">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FeatureCard icon={<Truck className="h-5 w-5" />} title="Free shipping" subtitle="On orders over ৳2,000" />
            <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Secure checkout" subtitle="SSLCommerz protected" />
            <FeatureCard icon={<Zap className="h-5 w-5" />} title="Fast support" subtitle="7 days a week" />
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

      {/* DISCOUNT SECTION */}
      <DiscountSection />
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
