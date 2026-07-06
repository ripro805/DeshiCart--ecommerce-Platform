"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Package, Settings, User, MapPin, Heart } from "lucide-react";
import { Container } from "@/components/ui/container";
import { useAuth } from "@/hooks/useAuth";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, user, logout } = useAuth();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.replace("/login?next=" + pathname);
  }, [isHydrated, isAuthenticated, router, pathname]);

  if (!isHydrated || !isAuthenticated) {
    return <Container className="py-32 text-center text-ink-500">Loading…</Container>;
  }

  const nav = [
    { href: "/account", label: "Profile", icon: User },
    { href: "/account/orders", label: "Orders", icon: Package },
    { href: "/account/wishlist", label: "Wishlist", icon: Heart },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/account/settings", label: "Settings", icon: Settings },
  ];

  return (
    <Container className="py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-3">
          <div className="rounded-3xl border border-ink-200/60 bg-white/60 p-5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
            <p className="text-xs uppercase tracking-wide text-ink-500">Signed in as</p>
            <p className="mt-1 truncate font-semibold">{user?.email}</p>
          </div>
          <nav className="rounded-3xl border border-ink-200/60 bg-white/60 p-2 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
            {nav.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition ${
                    active
                      ? "bg-gradient-to-br from-primary to-accent text-secondary shadow-glow"
                      : "text-ink-600 hover:bg-ink-100/60 dark:text-ink-300 dark:hover:bg-ink-900/60"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
            <button
              onClick={() => logout()}
              className="mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50/60 dark:hover:bg-rose-950/30"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </Container>
  );
}

