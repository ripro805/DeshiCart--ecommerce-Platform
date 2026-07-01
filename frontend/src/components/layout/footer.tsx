import Link from "next/link";
import { Container } from "@/components/ui/container";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/products",   label: "All products" },
      { href: "/categories", label: "Categories" },
      { href: "/cart",       label: "Cart" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login",           label: "Sign in" },
      { href: "/register",        label: "Create account" },
      { href: "/account/orders",  label: "My orders" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Contact us" },
      { href: "/about",   label: "About DeshiCart" },
      { href: "/terms",   label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-200/60 bg-ink-50/60 dark:border-ink-800/60 dark:bg-ink-950/60">
      <Container className="py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white font-bold text-sm">
                D
              </div>
              <span className="text-lg font-semibold">DeshiCart</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-500 dark:text-ink-400">
              Premium Bangladeshi goods, delivered nationwide. Crafted for a fast, beautiful checkout.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-ink-700 hover:text-ink-900 dark:text-ink-200 dark:hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink-200/60 pt-6 text-xs text-ink-500 dark:border-ink-800 dark:text-ink-400 md:flex-row">
          <p>© {new Date().getFullYear()} DeshiCart. All rights reserved.</p>
          <p>Made with care in Bangladesh 🇧🇩</p>
        </div>
      </Container>
    </footer>
  );
}
