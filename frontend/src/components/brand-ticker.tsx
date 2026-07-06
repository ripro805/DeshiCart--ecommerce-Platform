"use client";

import * as React from "react";
import Image from "next/image";
import { Sparkles, Star, Award, Globe2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type Brand = {
  src: string;
  alt: string;
  label: string;
  tag: string;
  rating: string;
};

// Use every image from /image/banner/ as a brand showcase
const BRANDS: Brand[] = [
  { src: "/image/banner/1600w-02Rswxitl7U.jpg",  alt: "Featured brand",  label: "Aurelia",     tag: "Editor's Pick",  rating: "4.9" },
  { src: "/image/banner/1600w-3uD1usCaVCQ.jpg",  alt: "Editor's pick",   label: "Noor Co.",    tag: "Trending",       rating: "4.8" },
  { src: "/image/banner/1600w-fPU2GFKPIzU.webp", alt: "Top seller",      label: "Lumen",       tag: "Top Seller",     rating: "4.9" },
  { src: "/image/banner/24228c6899390c7a53f67af7f28f9f31.jpg", alt: "Trending",  label: "Mela Studio", tag: "New Drop",       rating: "4.7" },
  { src: "/image/banner/25e27189b622ccc6d8a2b08626d681d8.jpg", alt: "Premium",  label: "Kantha",      tag: "Premium",        rating: "5.0" },
  { src: "/image/banner/83ba38494db43b20a71c3863801f06cf.jpg",  alt: "Studio",   label: "Dhaka Loom",  tag: "Studio",         rating: "4.8" },
  { src: "/image/banner/aad7827a0e5fc8ff3640be3f26708ed4.jpg", alt: "Pick",     label: "Sundor",      tag: "Pick",           rating: "4.9" },
  { src: "/image/banner/d087d06c9cda1142020f18f2735a0317.jpg", alt: "New",      label: "Megh",        tag: "Just In",        rating: "4.7" },
  { src: "/image/banner/ecf50e2efd43963035ac9256aafe72d8.jpg", alt: "Hot",      label: "Angan",       tag: "Hot",            rating: "4.8" },
];

// Two directions, two copies each for seamless loops
const ROW_A = [...BRANDS, ...BRANDS];
const ROW_B = [...BRANDS.slice().reverse(), ...BRANDS.slice().reverse()];

const ROW_A_DURATION_S = 42;
const ROW_B_DURATION_S = 52;

export function BrandTicker({
  className,
}: {
  className?: string;
}) {
  const [paused, setPaused] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // Live progress indicator 0-100
  React.useEffect(() => {
    if (paused) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setProgress((p) => (p + dt / (ROW_A_DURATION_S * 1000) * 100) % 100);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  return (
    <section
      aria-label="Featured brand highlights"
      className={cn(
        "relative w-full overflow-hidden",
        // Layered premium backdrop: warm light + dark fallback
        "bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(234,88,12,0.14),transparent_60%),linear-gradient(180deg,#FFFBF5_0%,#FFF7ED_100%)]",
        "dark:bg-[radial-gradient(ellipse_at_top,rgba(234,88,12,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(251,191,36,0.10),transparent_60%),linear-gradient(180deg,#0B0B12_0%,#111118_100%)]",
        className
      )}
    >
      {/* Subtle grid pattern overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          color: "rgb(31 41 55)",
        }}
      />

      {/* Decorative corner glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-accent/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
      />

      <Container className="relative pt-14 pb-8 sm:pt-20 sm:pb-10">
        {/* Header */}
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary shadow-[0_1px_2px_rgba(234,88,12,0.10)] backdrop-blur-md dark:bg-ink-900/60">
            <Sparkles className="h-3 w-3" />
            Curated brand showcase
          </div>

          <h2 className="mt-4 text-balance text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
            Trusted by <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">creators &amp; shoppers</span> across Bangladesh
          </h2>

          <p className="mt-2 max-w-xl text-sm text-ink-500 dark:text-ink-400 sm:text-[15px]">
            Nine hand-picked houses delivering craftsmanship, design, and authenticity — straight from local studios to your doorstep.
          </p>

          {/* Stats strip */}
          <div className="mt-6 grid w-full max-w-2xl grid-cols-3 gap-2 sm:gap-3">
            <Stat icon={<Star className="h-3.5 w-3.5" />} value="4.8★" label="Avg. rating" />
            <Stat icon={<Award className="h-3.5 w-3.5" />} value="120k+" label="Orders shipped" />
            <Stat icon={<Globe2 className="h-3.5 w-3.5" />} value="9" label="Partner brands" />
          </div>
        </div>
      </Container>

      {/* Marquee rows */}
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Edge fades */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-[#FFF7ED] via-[#FFF7ED]/80 to-transparent dark:from-[#0B0B12] dark:via-[#0B0B12]/80 sm:w-32"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-[#FFF7ED] via-[#FFF7ED]/80 to-transparent dark:from-[#0B0B12] dark:via-[#0B0B12]/80 sm:w-32"
          aria-hidden="true"
        />

        {/* Row A — forward */}
        <div
          className="brand-row-a flex w-max items-center gap-4 px-4 will-change-transform sm:gap-6"
          role="marquee"
          aria-label="Featured brand showcase"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {ROW_A.map((b, i) => (
            <BrandCard key={`a-${b.src}-${i}`} brand={b} index={i} />
          ))}
        </div>

        {/* Row B — reverse */}
        <div className="mt-4 sm:mt-6">
          <div
            className="brand-row-b flex w-max items-center gap-4 px-4 will-change-transform sm:gap-6"
            role="marquee"
            aria-label="More featured brands"
            style={{ animationPlayState: paused ? "paused" : "running" }}
          >
            {ROW_B.map((b, i) => (
              <BrandCard key={`b-${b.src}-${i}`} brand={b} index={i} subtle />
            ))}
          </div>
        </div>
      </div>

      {/* Footer progress bar */}
      <Container className="relative pt-6 pb-12 sm:pt-8 sm:pb-16">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-ink-500 dark:text-ink-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Live · Curated · Local · Global · Delivered
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          </div>

          <div className="relative h-[2px] w-full max-w-md overflow-hidden rounded-full bg-ink-200/60 dark:bg-ink-800/60">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary"
              style={{ width: `${progress}%`, transition: paused ? "width 200ms ease" : undefined }}
            />
          </div>
        </div>
      </Container>

      <style jsx>{`
        @keyframes brand-ticker-a {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes brand-ticker-b {
          from { transform: translate3d(-50%, 0, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }
        .brand-row-a { animation: brand-ticker-a ${ROW_A_DURATION_S}s linear infinite; }
        .brand-row-b { animation: brand-ticker-b ${ROW_B_DURATION_S}s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .brand-row-a, .brand-row-b { animation: none; }
        }
      `}</style>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="group/stat relative overflow-hidden rounded-xl border border-ink-200/60 bg-white/70 px-3 py-2.5 backdrop-blur-md transition-colors hover:border-primary/40 dark:border-ink-800/60 dark:bg-ink-900/60 sm:px-4 sm:py-3">
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover/stat:opacity-100" />
      <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
        {icon}
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-medium tracking-wide text-ink-500 dark:text-ink-400">
        {label}
      </div>
    </div>
  );
}

function BrandCard({
  brand,
  index,
  subtle = false,
}: {
  brand: Brand;
  index: number;
  subtle?: boolean;
}) {
  const initial = brand.label.charAt(0);
  return (
    <div
      className={cn(
        "group/card relative flex h-20 w-56 shrink-0 items-center gap-3 rounded-2xl border px-4",
        // Glass surface with ring
        "border-white/40 bg-white/70 backdrop-blur-xl",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(31,41,55,0.04),0_8px_24px_-12px_rgba(31,41,55,0.10)]",
        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-1 hover:border-primary/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_4px_rgba(234,88,12,0.10),0_24px_48px_-16px_rgba(234,88,12,0.28)]",
        "dark:border-white/10 dark:bg-ink-900/60",
        subtle && "h-[68px] w-52 sm:h-[72px] sm:w-60",
        "sm:h-24 sm:w-64 sm:gap-4 sm:px-5"
      )}
      style={{ animationDelay: `${(index % 9) * 60}ms` }}
    >
      {/* Hover shimmer line */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
      />

      {/* Monogram tile (reveals image on hover) */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary-100 via-accent/40 to-primary-50 ring-1 ring-inset ring-white/60 dark:from-primary-950/70 dark:via-primary-900/50 dark:to-ink-900 sm:h-14 sm:w-14">
        {/* Initials visible by default */}
        <span className="absolute inset-0 flex items-center justify-center font-bold text-primary dark:text-accent text-base sm:text-lg">
          {initial}
        </span>
        {/* Image fades in on hover */}
        <Image
          src={brand.src}
          alt={brand.alt}
          fill
          sizes="(max-width: 640px) 48px, 56px"
          className="object-cover opacity-0 transition-opacity duration-500 ease-apple group-hover/card:opacity-100"
          loading="lazy"
        />
      </div>

      {/* Text */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold tracking-tight text-ink-900 dark:text-white">
            {brand.label}
          </span>
          <Star className="h-3 w-3 shrink-0 fill-accent text-accent" />
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            {brand.tag}
          </span>
          <span className="h-0.5 w-0.5 rounded-full bg-ink-300 dark:bg-ink-700" />
          <span className="text-[10px] font-medium tabular-nums text-ink-500 dark:text-ink-400">
            {brand.rating}
          </span>
        </div>
      </div>

      {/* Subtle rank chip on the right */}
      <div className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-200/60 bg-white/60 text-[10px] font-bold text-ink-500 backdrop-blur-sm group-hover/card:border-primary/40 group-hover/card:bg-primary/10 group-hover/card:text-primary sm:flex dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300">
        #{String((index % 9) + 1).padStart(2, "0")}
      </div>
    </div>
  );
}