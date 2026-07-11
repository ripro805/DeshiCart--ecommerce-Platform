import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ShieldCheck, Truck, Zap, Globe2, HeartHandshake } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About DeshiCart — Bangladesh's modern marketplace",
  description:
    "DeshiCart is a Bangladesh-first e-commerce platform connecting local shoppers with trusted local vendors — fast, fair, and transparent.",
};

const VALUES = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Curated, not crowded",
    body: "We feature vendors and products that meet our quality bar. No filler, no fakes.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Secure by default",
    body: "SSLCommerz payments, JWT auth, and a transparent order pipeline you can track.",
  },
  {
    icon: <Truck className="h-5 w-5" />,
    title: "Built for Bangladesh",
    body: "৳ pricing, local couriers, and support that actually picks up the phone.",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Fast & modern",
    body: "A Next.js storefront with sub-second page loads and a clean checkout flow.",
  },
  {
    icon: <Globe2 className="h-5 w-5" />,
    title: "Local-first commerce",
    body: "We give Bangladeshi sellers the same tools that global giants use — for free.",
  },
  {
    icon: <HeartHandshake className="h-5 w-5" />,
    title: "Fair to vendors",
    body: "Clear fees, fast payouts, and a vendor dashboard that actually helps you sell.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-200/60 bg-gradient-to-br from-primary/10 via-white to-accent/10 dark:border-ink-800/60 dark:from-primary/20 dark:via-ink-950 dark:to-accent/20">
        <Container className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200/60 bg-white/70 px-3 py-1 text-xs font-medium backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Our story
            </span>
            <h1 className="mt-5 text-display-lg">A marketplace built for Bangladesh, by Bangladeshis.</h1>
            <p className="mt-5 text-base text-ink-600 dark:text-ink-300 sm:text-lg">
              DeshiCart started with a simple idea: local shoppers deserve a modern, trustworthy
              marketplace, and local vendors deserve world-class tools. We&apos;re bringing both
              together — one cart at a time.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/products">
                <Button>
                  Start shopping <Sparkles className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline">Talk to us</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* STATS */}
      <section>
        <Container className="py-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Products" value="2,400+" />
            <Stat label="Vendors" value="180+" />
            <Stat label="Districts" value="60+" />
            <Stat label="Avg. delivery" value="48 hrs" />
          </div>
        </Container>
      </section>

      {/* MISSION */}
      <section>
        <Container className="py-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-display-md">Our mission</h2>
              <p className="mt-4 text-ink-600 dark:text-ink-300">
                Make online shopping in Bangladesh feel as natural as visiting your favourite local
                bazaar — but faster, safer, and with receipts you can actually keep.
              </p>
              <p className="mt-3 text-ink-600 dark:text-ink-300">
                We&apos;re a small team of engineers, designers, and former vendors building the
                marketplace we wished we had.
              </p>
            </div>
            <div className="rounded-3xl border border-ink-200/60 bg-white/70 p-8 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-500">
                What we believe
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-ink-700 dark:text-ink-200">
                <li>• Trust beats growth hacks — every time.</li>
                <li>• Vendors are partners, not line items.</li>
                <li>• Bangladesh-first isn&apos;t a constraint, it&apos;s our edge.</li>
                <li>• Plain UX beats clever UX.</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* VALUES */}
      <section>
        <Container className="py-16">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-display-md">What we value</h2>
            <p className="mt-2 text-sm text-ink-500">
              The principles we use when we say yes — and the ones we use when we say no.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-3xl border border-ink-200/60 bg-white/70 p-6 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/30 text-primary">
                  {v.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{v.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section>
        <Container className="py-16">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-accent p-10 text-center text-white">
            <h2 className="text-display-md">Ready to explore?</h2>
            <p className="mx-auto mt-2 max-w-xl text-white/80">
              Browse the catalog, or sign up in 30 seconds and unlock wishlist, faster checkout,
              and order tracking.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-primary shadow-soft transition-all hover:bg-white/90 active:scale-[.98]"
              >
                Browse products
              </Link>
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/40 px-6 text-sm font-medium text-white transition-all hover:bg-white/10 active:scale-[.98]"
              >
                Create an account
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-200/60 bg-white/70 p-6 text-center backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
      <div className="text-2xl font-bold sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-ink-500">{label}</div>
    </div>
  );
}