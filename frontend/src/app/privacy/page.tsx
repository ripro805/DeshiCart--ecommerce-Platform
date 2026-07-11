import type { Metadata } from "next";
import { ShieldCheck, Database, Eye, Share2, Lock, Trash2, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy — DeshiCart",
  description:
    "How DeshiCart collects, uses, and protects your personal data — written in plain language, not legalese.",
};

const SECTIONS: Array<{ icon: React.ReactNode; title: string; body: React.ReactNode }> = [
  {
    icon: <Database className="h-5 w-5" />,
    title: "1. What we collect",
    body: (
      <>
        We collect information you give us directly — your name, email, phone, shipping address,
        and order details — plus basic device and usage data (browser, IP, pages visited) to keep
        the site running and improve it.
      </>
    ),
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: "2. Why we use it",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>To process and deliver your orders.</li>
        <li>To send you order updates, receipts, and support replies.</li>
        <li>To prevent fraud and keep accounts secure.</li>
        <li>To improve the site — via aggregate, non-personal analytics.</li>
      </ul>
    ),
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    title: "3. Who we share it with",
    body: (
      <>
        We share only what&apos;s needed with: our payment partner (SSLCommerz) to charge your
        card, our logistics partners to deliver your order, and our hosting provider to run the
        site. We do not sell your personal data — ever.
      </>
    ),
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "4. How we protect it",
    body: (
      <>
        Industry-standard encryption in transit (HTTPS) and at rest, JWT-based authentication, and
        least-privilege access for staff. No system is 100% secure, but we work hard to keep yours
        safe and notify you promptly if anything goes wrong.
      </>
    ),
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "5. Cookies",
    body: (
      <>
        We use a small number of essential cookies to keep you signed in and remember your cart.
        We don&apos;t use third-party advertising cookies on DeshiCart.
      </>
    ),
  },
  {
    icon: <Trash2 className="h-5 w-5" />,
    title: "6. Your rights",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Access a copy of your personal data.</li>
        <li>Correct inaccurate information.</li>
        <li>Request deletion of your account and order history.</li>
        <li>Opt out of marketing emails at any time via the unsubscribe link.</li>
      </ul>
    ),
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: "7. Contact our privacy team",
    body: (
      <>
        For any privacy request, email{" "}
        <a href="mailto:privacy@deshicart.bd" className="font-medium text-primary underline">
          privacy@deshicart.bd
        </a>
        . We respond within 7 business days.
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-200/60 bg-gradient-to-br from-primary/10 via-white to-accent/10 dark:border-ink-800/60 dark:from-primary/20 dark:via-ink-950 dark:to-accent/20">
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200/60 bg-white/70 px-3 py-1 text-xs font-medium backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Privacy
            </span>
            <h1 className="mt-5 text-display-lg">Privacy Policy</h1>
            <p className="mt-3 text-ink-600 dark:text-ink-300">
              We collect the minimum data we need to run DeshiCart, we never sell it, and we make
              it easy to leave.
            </p>
            <p className="mt-3 text-xs uppercase tracking-wider text-ink-500">
              Last updated · January 2026
            </p>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-16">
          <div className="mx-auto max-w-3xl space-y-4">
            {SECTIONS.map((s) => (
              <article
                key={s.title}
                className="rounded-3xl border border-ink-200/60 bg-white/70 p-6 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60 sm:p-7"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/30 text-primary">
                    {s.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{s.title}</h2>
                    <div className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                      {s.body}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}