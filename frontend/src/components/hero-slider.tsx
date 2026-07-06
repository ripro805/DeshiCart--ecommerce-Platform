"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Slide = {
  src: string;
  alt: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  cta: { label: string; href: string };
};

const SLIDES: Slide[] = [
  {
    src: "/image/banner/1600w-02Rswxitl7U.jpg",
    alt: "Premium gadgets and smart devices",
    eyebrow: "Up to 15% off",
    title: (
      <>
        Gear up for
        <br />
        <span className="bg-gradient-to-r from-accent via-primary-300 to-accent bg-clip-text text-transparent">
          Pro Filmmaking
        </span>
      </>
    ),
    subtitle:
      "Discover cutting-edge gadgets, smart devices, and innovations to upgrade every part of your daily life.",
    cta: { label: "Shop now", href: "/products" },
  },
  {
    src: "/image/banner/1600w-3uD1usCaVCQ.jpg",
    alt: "Modern electronics showcase",
    eyebrow: "New season arrivals",
    title: (
      <>
        Built for the
        <br />
        <span className="bg-gradient-to-r from-accent via-primary-300 to-accent bg-clip-text text-transparent">
          Bold & Curious
        </span>
      </>
    ),
    subtitle:
      "Hand-picked premium electronics, designed to elevate every moment of your craft.",
    cta: { label: "Explore collection", href: "/categories" },
  },
  {
    src: "/image/banner/1600w-fPU2GFKPIzU.webp",
    alt: "Featured product highlight",
    eyebrow: "Editor's pick",
    title: (
      <>
        Discover the
        <br />
        <span className="bg-gradient-to-r from-accent via-primary-300 to-accent bg-clip-text text-transparent">
          Latest Tech
        </span>
      </>
    ),
    subtitle:
      "The freshest gear from world-class brands \u2014 available now with fast nationwide delivery.",
    cta: { label: "Browse products", href: "/products" },
  },
  {
    src: "/image/banner/d087d06c9cda1142020f18f2735a0317.jpg",
    alt: "Premium lifestyle collection",
    eyebrow: "Limited time",
    title: (
      <>
        Style meets
        <br />
        <span className="bg-gradient-to-r from-accent via-primary-300 to-accent bg-clip-text text-transparent">
          Performance
        </span>
      </>
    ),
    subtitle:
      "Curated essentials from local and global brands \u2014 crafted for everyday excellence.",
    cta: { label: "Shop the edit", href: "/products" },
  },
  {
    src: "/image/banner/25e27189b622ccc6d8a2b08626d681d8.jpg",
    alt: "Smart home essentials",
    eyebrow: "Trending now",
    title: (
      <>
        Smarter living
        <br />
        <span className="bg-gradient-to-r from-accent via-primary-300 to-accent bg-clip-text text-transparent">
          Starts Here
        </span>
      </>
    ),
    subtitle:
      "From smart lighting to professional audio \u2014 everything you need in one place.",
    cta: { label: "Start shopping", href: "/categories" },
  },
  {
    src: "/image/banner/83ba38494db43b20a71c3863801f06cf.jpg",
    alt: "Audio gear collection",
    eyebrow: "Hot deal",
    title: (
      <>
        Studio-grade
        <br />
        <span className="bg-gradient-to-r from-accent via-primary-300 to-accent bg-clip-text text-transparent">
          Sound & Vision
        </span>
      </>
    ),
    subtitle:
      "Premium audio and imaging tools for creators who refuse to compromise.",
    cta: { label: "View deals", href: "/products" },
  },
  {
    src: "/image/banner/24228c6899390c7a53f67af7f28f9f31.jpg",
    alt: "Featured accessories",
    eyebrow: "Best sellers",
    title: (
      <>
        Accessories that
        <br />
        <span className="bg-gradient-to-r from-accent via-primary-300 to-accent bg-clip-text text-transparent">
          Make the Cut
        </span>
      </>
    ),
    subtitle:
      "Refined accessories designed to complement every device in your setup.",
    cta: { label: "See accessories", href: "/products" },
  },
  {
    src: "/image/banner/aad7827a0e5fc8ff3640be3f26708ed4.jpg",
    alt: "Essential everyday gear",
    eyebrow: "Top picks",
    title: (
      <>
        Essentials for
        <br />
        <span className="bg-gradient-to-r from-accent via-primary-300 to-accent bg-clip-text text-transparent">
          Every Creator
        </span>
      </>
    ),
    subtitle:
      "Reliable, refined, and ready to ship \u2014 handpicked favorites from the DeshiCart team.",
    cta: { label: "Shop essentials", href: "/products" },
  },
  {
    src: "/image/banner/ecf50e2efd43963035ac9256aafe72d8.jpg",
    alt: "New arrivals highlight",
    eyebrow: "Just landed",
    title: (
      <>
        Fresh drops,
        <br />
        <span className="bg-gradient-to-r from-accent via-primary-300 to-accent bg-clip-text text-transparent">
          Faster than ever
        </span>
      </>
    ),
    subtitle:
      "New arrivals every week \u2014 delivered to your door with care across Bangladesh.",
    cta: { label: "See what\u2019s new", href: "/products" },
  },
];

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 50;

export function HeroSlider() {
  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [paused, setPaused] = React.useState(false);
  const total = SLIDES.length;

  const goTo = React.useCallback(
    (next: number) => {
      const wrapped = ((next % total) + total) % total;
      setDirection(wrapped === (index + 1) % total ? 1 : -1);
      setIndex(wrapped);
    },
    [index, total]
  );

  const next = React.useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = React.useCallback(() => goTo(index - 1), [goTo, index]);

  React.useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused, next]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const slide = SLIDES[index];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "8%" : "-8%",
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? "-8%" : "8%",
      opacity: 0,
    }),
  };

  const textContainer = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
  };

  const textItem = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.28, 0.11, 0.32, 1] as [number, number, number, number] },
    },
  };

  return (
    <section
      aria-label="Featured promotions"
      role="region"
      className="relative w-full overflow-hidden bg-secondary-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="relative h-[78vh] min-h-[480px] w-full sm:h-[80vh] sm:min-h-[560px] lg:h-[82vh] lg:min-h-[640px]"
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <AnimatePresence custom={direction} mode="popLayout" initial={false}>
          <motion.div
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.7, ease: [0.28, 0.11, 0.32, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x > SWIPE_THRESHOLD) prev();
              else if (info.offset.x < -SWIPE_THRESHOLD) next();
            }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${total}`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
              draggable={false}
            />

            <div
              className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20 dark:from-black/90 dark:via-black/60 dark:to-black/30"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"
              aria-hidden="true"
            />

            <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8">
              <motion.div
                key={`text-${index}`}
                variants={textContainer}
                initial="hidden"
                animate="show"
                className="max-w-xl text-white sm:max-w-2xl"
              >
                <motion.span
                  variants={textItem}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {slide.eyebrow}
                </motion.span>

                <motion.h1
                  variants={textItem}
                  className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
                  style={{ textShadow: "0 4px 24px rgba(0,0,0,0.45)" }}
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  variants={textItem}
                  className="mt-5 max-w-lg text-base text-white/85 sm:text-lg"
                  style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
                >
                  {slide.subtitle}
                </motion.p>

                <motion.div
                  variants={textItem}
                  className="mt-8 flex flex-wrap items-center gap-3"
                >
                  <Link href={slide.cta.href} tabIndex={-1}>
                    <Button size="lg" className="shadow-glow">
                      {slide.cta.label}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/categories" tabIndex={-1}>
                    <Button size="lg" variant="glass">
                      Browse categories
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          aria-label="Previous slide"
          onClick={prev}
          className={cn(
            "group absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full",
            "border border-white/20 bg-white/10 text-white backdrop-blur-md",
            "transition-all duration-300 hover:scale-105 hover:bg-white hover:text-secondary-900",
            "sm:left-5 sm:h-12 sm:w-12",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          )}
        >
          <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={next}
          className={cn(
            "group absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full",
            "border border-white/20 bg-white/10 text-white backdrop-blur-md",
            "transition-all duration-300 hover:scale-105 hover:bg-white hover:text-secondary-900",
            "sm:right-5 sm:h-12 sm:w-12",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          )}
        >
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
        </button>

        <div
          className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-6"
          role="tablist"
          aria-label="Choose slide"
        >
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-label={`Go to slide ${i + 1}`}
              aria-selected={i === index}
              onClick={() => goTo(i)}
              className="group relative h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{
                width: i === index ? 32 : 8,
                backgroundColor:
                  i === index ? "rgb(251 191 36)" : "rgba(255,255,255,0.45)",
              }}
            >
              {i === index && !paused && (
                <span
                  key={`bar-${index}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-white/80 hero-progress"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes hero-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .hero-progress {
          width: 100%;
          transform-origin: left center;
          animation: hero-progress ${AUTOPLAY_MS}ms linear forwards;
        }
      `}</style>
    </section>
  );
}