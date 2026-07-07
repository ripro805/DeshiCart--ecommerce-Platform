"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Flame,
  Sparkles,
  Tag,
  Timer,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Countdown helpers                                                          */
/* -------------------------------------------------------------------------- */

function defaultTarget(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(23, 59, 59, 0);
  return d;
}

function diff(target: Date, now: Date) {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { ms, days, hours, minutes, seconds, expired: ms === 0 };
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

type Props = {
  /** ISO string or Date. Defaults to 3 days from now. */
  endsAt?: Date | string;
  eyebrow?: string;
  /** Big headline line one. */
  headline?: string;
  /** Big headline line two, with gradient accent. */
  highlightLabel?: string;
  /** Percentage suffix that glows in primary (e.g. "50%"). */
  highlight?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
};

/* -------------------------------------------------------------------------- */
/*  Static background particles (decorative, no JS)                            */
/* -------------------------------------------------------------------------- */

function Particles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 14 }).map((_, i) => {
        const size = 4 + ((i * 7) % 8); // 4–11px
        const left = ((i * 73) % 100) + 1;
        const top = ((i * 41) % 90) + 5;
        const dur = 8 + ((i * 3) % 10);
        const delay = ((i * 5) % 12) * 0.4;
        const tone = i % 3 === 0 ? "bg-accent/70" : i % 2 === 0 ? "bg-primary/60" : "bg-white/40";
        return (
          <motion.span
            key={i}
            className={cn("absolute rounded-full blur-[1.5px]", tone)}
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 0.9, 0.2, 0.8], y: [0, -12, 0, -6] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Floating glass orb (right-side decorative composition)                     */
/* -------------------------------------------------------------------------- */

function VisualStack() {
  const reduce = useReducedMotion();
  const float = reduce ? {} : { animate: { y: [0, -10, 0] }, transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } };
  const floatSlower = reduce ? {} : { animate: { y: [0, 8, 0] }, transition: { duration: 8, repeat: Infinity, ease: "easeInOut" } };
  const spinSlow = reduce ? {} : { animate: { rotate: 360 }, transition: { duration: 30, repeat: Infinity, ease: "linear" } };

  return (
    <div aria-hidden="true" className="relative h-[480px] w-full sm:h-[560px] lg:h-[680px]">
      {/* Outer glow */}
      <motion.div
        {...spinSlow}
        className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_90deg,rgba(234,88,12,0.0),rgba(234,88,12,0.45),rgba(251,191,36,0.4),rgba(234,88,12,0.0))] opacity-70 blur-2xl sm:h-[540px] sm:w-[540px] lg:h-[620px] lg:w-[620px]"
      />
      {/* Concentric rings */}
      <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 sm:h-[480px] sm:w-[480px] lg:h-[560px] lg:w-[560px]" />
      <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 sm:h-[360px] sm:w-[360px] lg:h-[440px] lg:w-[440px]" />

      {/* Floating glass card — primary offer chip */}
      <motion.div
        {...float}
        className="absolute left-1/2 top-[14%] w-[280px] -translate-x-1/2 rounded-3xl border border-white/15 bg-white/10 p-6 text-white shadow-[0_24px_60px_-16px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:w-[310px] sm:p-7 lg:left-[42%] lg:top-[12%] lg:w-[340px] lg:p-8"
      >
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">
          <Sparkles className="h-3 w-3" /> Featured Deal
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-6xl font-bold leading-none">50</span>
          <span className="text-3xl font-semibold text-primary">%</span>
          <span className="ml-1 pb-1 text-sm uppercase tracking-[0.18em] text-white/60">Off</span>
        </div>
        <div className="mt-2 text-xs text-white/70">Premium picks · limited window</div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-accent via-primary to-primary-700" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/60">
          <span>Stock</span>
          <span>68% Claimed</span>
        </div>
      </motion.div>

      {/* Floating glass card — mini stat */}
      <motion.div
        {...floatSlower}
        className="absolute right-[6%] top-[58%] w-[190px] rounded-2xl border border-white/15 bg-white/8 p-5 text-white shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:w-[210px] sm:p-6 lg:right-[2%] lg:w-[230px]"
      >
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-white/75">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Free express shipping
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 7-day easy returns
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Secure checkout
        </div>
      </motion.div>

      {/* Floating tag chip — SAVE chip */}
      <motion.div
        {...float}
        transition={{ ...(float.transition as object), duration: 7 }}
        className="absolute left-[6%] top-[68%] flex items-center gap-2 rounded-full border border-white/15 bg-primary/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-glow backdrop-blur-md sm:left-[10%]"
      >
        <Tag className="h-3 w-3" /> Save ৳2,500
      </motion.div>

      {/* Tiny pulsing accent dot */}
      <span className="absolute right-[14%] top-[20%] h-3 w-3 animate-ping rounded-full bg-accent/70" />
      <span className="absolute right-[14%] top-[20%] h-2 w-2 rounded-full bg-accent" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Countdown cell                                                             */
/* -------------------------------------------------------------------------- */

function CountdownCell({
  value,
  label,
  delayMs,
}: {
  value: number;
  label: string;
  delayMs: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.28, 0.11, 0.32, 1], delay: delayMs }}
      className="rounded-2xl border border-white/12 bg-white/[0.07] px-3 py-5 text-center shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:rounded-3xl sm:px-4 sm:py-6"
    >
      {/* Soft inner highlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />
      {/* Subtle hover tint */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/0 transition-colors duration-300 group-hover:bg-primary/10 sm:rounded-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent opacity-70"
      />
      <div className="tabular-nums text-3xl font-bold leading-none text-white sm:text-5xl">
        {pad2(value)}
      </div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65 sm:text-xs">
        {label}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Ripple CTA button (pure CSS ripple, no extra deps)                         */
/* -------------------------------------------------------------------------- */

function RippleCta({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const [ripples, setRipples] = React.useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const counter = React.useRef(0);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = ++counter.current;
    setRipples((r) => [...r, { id, x, y, size }]);
    window.setTimeout(() => {
      setRipples((r) => r.filter((p) => p.id !== id));
    }, 650);
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full",
        "bg-primary px-10 py-5 text-base font-bold uppercase tracking-[0.16em] text-white sm:px-12 sm:py-6 sm:text-lg",
        "shadow-glow transition-all duration-300 ease-apple",
        "hover:scale-[1.03] hover:bg-primary-600 hover:shadow-[0_24px_60px_-16px_rgba(234,88,12,0.6)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-secondary-900",
        "active:scale-[0.98]",
        "w-full sm:w-auto",
      )}
    >
      {/* Pulse halo */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 rounded-full bg-primary/40 opacity-0 transition-opacity duration-500 group-hover:opacity-60 group-hover:animate-ping"
      />
      {/* Ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full bg-white/35"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
            transform: "scale(0)",
            opacity: 1,
            animation: "ripple 650ms ease-out forwards",
          }}
        />
      ))}
      <span className="relative z-10 flex items-center gap-2">
        {label}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
      {/* Sheen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.25)_50%,transparent_65%)] bg-[length:200%_100%] bg-[position:-100%_0] transition-[background-position] duration-700 ease-apple group-hover:bg-[position:200%_0]"
      />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function DiscountSection({
  endsAt,
  eyebrow = "Limited Deal",
  headline = "Mega Sale",
  highlightLabel = "Up To",
  highlight = "50%",
  description = "Discover exclusive offers on premium gadgets, electronics, and lifestyle essentials. Limited time campaign available only while stocks last.",
  ctaHref = "/products",
  ctaLabel = "Shop the sale",
  imageSrc = "/image/discout.jpg",
  imageAlt = "Premium products in warm cinematic light",
  className,
}: Props) {
  const target = React.useMemo(() => {
    if (!endsAt) return defaultTarget();
    return typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  }, [endsAt]);

  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Avoid SSR/CSR hydration mismatch by waiting until client clock is set
  const remaining = now ? diff(target, now) : null;

  return (
    <section
      aria-label="Limited-time promotional offer"
      className={cn(
        "relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden",
        "py-20 sm:py-32 lg:py-44",
        className,
      )}
    >
      {/* Inject the ripple keyframes once. Plain CSS so it costs nothing. */}
      <style jsx global>{`
        @keyframes ripple {
          to {
            transform: scale(2.4);
            opacity: 0;
          }
        }
      `}</style>

      {/* Inner content stays aligned with the rest of the site */}
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {/* Surface wrapper */}
        <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-secondary-950 shadow-elev sm:rounded-[2.5rem] lg:rounded-[3rem]">
          {/* ---- Layered background -------------------------------------- */}
          <div aria-hidden="true" className="absolute inset-0 -z-30 bg-secondary-950" />

          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority={false}
            sizes="100vw"
            className="absolute inset-0 -z-20 h-full w-full select-none object-cover object-center"
            loading="lazy"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-r from-secondary-950 via-secondary-950/85 to-secondary-900/30"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-secondary-950/85 via-secondary-950/10 to-secondary-950/55"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_left,rgba(234,88,12,0.28),transparent_55%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_32%,rgba(251,191,36,0.18),transparent_45%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:3px_3px]"
          />

          <Particles />

          {/* ---- Content grid ------------------------------------------- */}
          <div className="relative grid min-h-[820px] grid-cols-1 gap-14 p-8 sm:min-h-[900px] sm:p-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-20 lg:p-24">
            {/* LEFT — copy column */}
            <div className="flex max-w-xl flex-col items-start text-white">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.28, 0.11, 0.32, 1] }}
                className="flex flex-wrap items-center gap-2"
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1",
                    "text-[11px] font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-md",
                  )}
                >
                  <Sparkles className="h-3 w-3 text-accent" />
                  {eyebrow}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-glow">
                  <Flame className="h-3 w-3" /> Save {highlight}
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: [0.28, 0.11, 0.32, 1], delay: 0.05 }}
                className="mt-8 text-balance font-display text-4xl font-bold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-[5rem] xl:text-[5.5rem]"
              >
                <span className="block">{headline}</span>
                <span className="mt-3 block text-2xl font-semibold text-white/80 sm:text-3xl lg:text-[3rem] xl:text-[3.5rem]">
                  {highlightLabel}{" "}
                  <span
                    className={cn(
                      "relative inline-block bg-gradient-to-br from-accent via-primary-400 to-primary bg-clip-text text-transparent",
                      "drop-shadow-[0_4px_24px_rgba(234,88,12,0.45)]",
                    )}
                  >
                    {highlight}
                  </span>{" "}
                  OFF
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.28, 0.11, 0.32, 1], delay: 0.1 }}
                className="mt-7 max-w-md text-base leading-relaxed text-white/75 sm:text-lg"
              >
                {description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.28, 0.11, 0.32, 1], delay: 0.15 }}
                className="mt-10 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center"
              >
                <RippleCta href={ctaHref} label={ctaLabel} />
                <Link
                  href="/products"
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-8 py-5",
                    "text-sm font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md",
                    "transition-all duration-300 ease-apple hover:bg-white/15",
                    "w-full sm:w-auto",
                  )}
                >
                  <Zap className="h-3.5 w-3.5 text-accent" /> Explore deals
                </Link>
              </motion.div>

              {/* ---- Live countdown ------------------------------------- */}
              <div className="mt-14 w-full">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                  <Timer className="h-3.5 w-3.5 text-primary" />
                  {remaining?.expired ? "Offer status" : "Offer ends in"}
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Live
                  </span>
                </div>

                {remaining === null ? (
                  <div className="grid grid-cols-4 gap-3 sm:max-w-md sm:gap-4" aria-hidden="true">
                    {["Days", "Hours", "Minutes", "Seconds"].map((l) => (
                      <div
                        key={l}
                        className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-5 text-center backdrop-blur-md sm:rounded-3xl sm:px-4 sm:py-6"
                      >
                        <div className="tabular-nums text-3xl font-bold leading-none text-white sm:text-5xl">
                          --
                        </div>
                        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 sm:text-xs">
                          {l}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : remaining.expired ? (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-5 py-4 text-sm font-semibold text-white/90 backdrop-blur-md">
                    <Timer className="h-4 w-4 text-white/60" />
                    Offer expired — check back soon for the next deal.
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-4 gap-3 sm:max-w-md sm:gap-4"
                    role="timer"
                    aria-live="off"
                    aria-atomic="false"
                  >
                    <CountdownCell value={remaining.days} label="Days" delayMs={0} />
                    <CountdownCell value={remaining.hours} label="Hours" delayMs={0.05} />
                    <CountdownCell value={remaining.minutes} label="Minutes" delayMs={0.1} />
                    <CountdownCell value={remaining.seconds} label="Seconds" delayMs={0.15} />
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — visual composition */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.28, 0.11, 0.32, 1], delay: 0.1 }}
              className="relative mx-auto w-full max-w-[460px] lg:max-w-none"
            >
              <VisualStack />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}