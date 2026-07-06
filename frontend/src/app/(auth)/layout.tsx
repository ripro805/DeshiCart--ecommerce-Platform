import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * (auth) route group layout.
 *
 * Production-ready split layout that mirrors the Luxora reference:
 *   - LEFT:  white glassmorphism card with brand mark + auth form (children)
 *   - RIGHT: full-bleed lifestyle image (/image/login.jpg) with a soft warm
 *            vignette for depth — no overlay text on the image.
 *
 * The image right-panel sits inside a soft warm background that harmonizes
 * with the existing Orange Marketplace palette
 * (primary #EA580C / accent #FBBF24 / secondary #1F2937).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top_left,#FFF7ED_0%,#FFEDD5_45%,#FED7AA_100%)] dark:bg-[radial-gradient(ellipse_at_top_left,#1F1208_0%,#110A05_55%,#000_100%)]">
      {/* Ambient color blobs (theme-aware) */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-accent/25 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] items-center justify-center px-5 py-10 sm:px-8 lg:py-0">
        {/* Mobile brand mark (only shown on small screens) */}
        <Link
          href="/"
          className="absolute top-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 text-base font-bold tracking-[0.22em] lg:hidden"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="bg-gradient-to-br from-primary via-primary-500 to-accent bg-clip-text text-transparent">
            LUXORA
          </span>
        </Link>

        {/* ========================= UNIFIED CARD: FORM + IMAGE ========================= */}
        {/* The login card (460px) and the lifestyle image share one rounded shell
            so the image reshapes to match the card exactly. On mobile, only the
            form card is shown (the aside is `hidden lg:block`). */}
        <div className="relative w-full max-w-[460px] lg:flex lg:w-[920px] lg:max-w-[920px] lg:items-stretch">
          {/* Glow ring */}
          <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-white/60 via-white/10 to-white/40 blur-[0.5px] opacity-70 dark:from-white/10 dark:via-white/5 dark:to-white/10" />

          {/* Form card (login card width stays as-is: max-w-[460px]) */}
          <div className="relative w-full max-w-[460px] flex-none rounded-[28px] border border-white/40 bg-white/65 p-7 shadow-elev backdrop-blur-2xl dark:border-white/10 dark:bg-ink-900/65 sm:p-9 lg:rounded-r-none lg:border-r-0">
            {children}
          </div>

          {/* Image panel — fills the remaining 460px on lg+, reshaped to the
              form card's exact height via `self-stretch` + `h-full` */}
          <aside className="relative hidden overflow-hidden rounded-[28px] border border-white/40 shadow-elev lg:block lg:flex-1 lg:rounded-l-none lg:border-l-0">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url(/image/login.jpg)" }}
              aria-hidden
            />
            {/* Soft inner vignette for depth — keeps image natural-looking */}
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.18)_100%)]"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}