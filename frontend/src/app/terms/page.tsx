import type { Metadata } from "next";
import { FileText, ShieldCheck, Truck, RefreshCcw, CreditCard, AlertTriangle, Scale } from "lucide-react";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms of Service — DeshiCart",
  description:
    "The rules of the road for using DeshiCart: accounts, orders, payments, shipping, returns, and your responsibilities as a shopper.",
};

const SECTIONS: Array<{ icon: React.ReactNode; title: string; body: string }> = [
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "1. Acceptance of terms",
    body:
      "By creating an account, browsing, or placing an order on DeshiCart you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the service.",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "2. Accounts",
    body:
      "You must provide accurate information when registering and keep your password secure. You are responsible for activity on your account. Notify us immediately at support@deshicart.bd if you suspect unauthorised access.",
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: "3. Orders & payment",
    body:
      "All prices are listed in Bangladeshi Taka (৳) and include applicable VAT unless stated otherwise. Orders are confirmed only after successful payment via our payment partner (SSLCommerz). We reserve the right to cancel orders that fail fraud screening or stock validation.",
  },
  {
    icon: <Truck className="h-5 w-5" />,
    title: "4. Shipping & delivery",
    body:
      "We ship across Bangladesh via partner couriers. Estimated delivery times shown at checkout are indicative, not guaranteed. Risk of loss passes to you upon delivery to the address you provide.",
  },
  {
    icon: <RefreshCcw className="h-5 w-5" />,
    title: "5. Returns & refunds",
    body:
      "If your item arrives damaged, defective, or not as described, contact us within 48 hours of delivery with photos. We will arrange a replacement or refund in line with our Refund Policy. Change-of-mind returns are accepted for eligible categories within 7 days, in original condition.",
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: "6. Vendor content",
    body:
      "Product listings, images, and descriptions are provided by vendors. While we curate our catalog, DeshiCart is not the manufacturer of products sold through the marketplace and warranties (where any) are provided by the vendor or original manufacturer.",
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "7. Prohibited use",
    body:
      "You agree not to misuse the service: no fraudulent orders, no scraping, no attempts to interfere with security, no resale of vouchers/promos for cash, and no content that is unlawful, hateful, or infringing.",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "8. Limitation of liability",
    body:
      "To the fullest extent permitted by law, DeshiCart is not liable for indirect, incidental, or consequential damages. Our total liability for any claim related to a purchase is capped at the amount you paid for that order.",
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: "9. Governing law",
    body:
      "These terms are governed by the laws of the People's Republic of Bangladesh. Any dispute will be subject to the exclusive jurisdiction of the courts of Dhaka.",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "10. Changes",
    body:
      "We may update these terms from time to time. The 'Last updated' date below will reflect the latest revision. Continued use of DeshiCart after changes constitutes acceptance.",
  },
];

export default function TermsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-200/60 bg-gradient-to-br from-primary/10 via-white to-accent/10 dark:border-ink-800/60 dark:from-primary/20 dark:via-ink-950 dark:to-accent/20">
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200/60 bg-white/70 px-3 py-1 text-xs font-medium backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
              <FileText className="h-3.5 w-3.5 text-accent" /> Legal
            </span>
            <h1 className="mt-5 text-display-lg">Terms of Service</h1>
            <p className="mt-3 text-ink-600 dark:text-ink-300">
              The plain-English rules for using DeshiCart. We try to keep them short and fair.
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
                    <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                      {s.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            <div className="rounded-3xl border border-ink-200/60 bg-gradient-to-br from-primary/5 to-accent/5 p-6 text-center dark:border-ink-800/60 sm:p-8">
              <p className="text-sm text-ink-600 dark:text-ink-300">
                Questions about these terms? Email{" "}
                <a
                  href="mailto:legal@deshicart.bd"
                  className="font-medium text-primary underline"
                >
                  legal@deshicart.bd
                </a>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}