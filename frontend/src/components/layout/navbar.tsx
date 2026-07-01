"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Moon,
  Sun,
  Monitor,
  LogOut,
  Package,
  Heart,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCartStore, cartItemCount } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { cn, getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/",          label: "Home" },
  { href: "/products",  label: "Shop" },
  { href: "/categories", label: "Categories" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const cart = useCartStore((s) => s.cart);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const cartCount = cartItemCount(cart?.items);

  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuth = !!accessToken;
  const clearAuth = () => {
    useAuthStore.getState().clear();
    router.push("/login");
  };

  const theme = useThemeStore((s) => s.theme);
  const cycleTheme = useThemeStore((s) => s.cycle);
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/products?q=${encodeURIComponent(search.trim())}`);
    setSearchOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-apple",
          scrolled
            ? "bg-white/70 backdrop-blur-2xl border-b border-ink-200/50 shadow-soft dark:bg-ink-950/80 dark:border-ink-800/50"
            : "bg-transparent"
        )}
      >
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white font-bold text-sm shadow-glow">
                D
              </div>
              <span className="text-lg font-semibold tracking-tight">DeshiCart</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((l) => {
                const active = pathname === l.href || (l.href !== "/" && pathname?.startsWith(l.href));
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium rounded-full transition-colors",
                      active
                        ? "text-ink-900 dark:text-white"
                        : "text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
                    )}
                  >
                    {l.label}
                    {active && (
                      <span className="absolute inset-x-3 -bottom-0.5 h-px bg-accent" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className="grid h-10 w-10 place-items-center rounded-full text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-900 transition-colors"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={cycleTheme}
                className="grid h-10 w-10 place-items-center rounded-full text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-900 transition-colors"
                aria-label="Toggle theme"
              >
                <ThemeIcon className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={openDrawer}
                className="relative grid h-10 w-10 place-items-center rounded-full text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-900 transition-colors"
                aria-label="Open cart"
              >
                <ShoppingBag className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-accent text-[10px] font-bold text-secondary shadow-glow">
                    {cartCount}
                  </span>
                )}
              </button>

              {isAuth ? (
                <div className="hidden sm:block">
                  <UserMenu user={user} onSignOut={clearAuth} />
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Sign in</Button>
                  </Link>
                  <Link href="/register" className="hidden lg:inline-flex">
                    <Button variant="primary" size="sm">Get started</Button>
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="md:hidden grid h-10 w-10 place-items-center rounded-full text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-900"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search panel */}
          {searchOpen && (
            <div className="border-t border-ink-200/50 dark:border-ink-800/50 py-3 animate-fade-up">
              <form onSubmit={onSearch} className="flex items-center gap-2">
                <Search className="h-4 w-4 text-ink-400" />
                <Input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products, brands, categories…"
                  className="border-0 bg-transparent px-2 focus-visible:ring-0"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-ink-400 hover:text-ink-700">
                  <X className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </Container>
      </header>

      {/* Spacer so content isn't hidden under fixed header */}
      <div aria-hidden className="h-16" />

      {/* Mobile menu */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isAuth={isAuth}
        user={user}
        onSignOut={clearAuth}
      />
    </>
  );
}

function UserMenu({ user, onSignOut }: { user: ReturnType<typeof useAuthStore.getState>["user"]; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-glow"
        aria-label="User menu"
      >
        {getInitials(user?.first_name ? `${user.first_name} ${user.last_name ?? ""}` : "", user?.email)}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-56 origin-top-right rounded-2xl border border-ink-200/60 bg-white/90 backdrop-blur-xl shadow-elev p-2 animate-fade-up dark:border-ink-800 dark:bg-ink-950/90 dark:text-ink-100">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold truncate">{user?.first_name || user?.email}</p>
              <p className="text-xs text-ink-500 truncate">{user?.email}</p>
            </div>
            <div className="my-1 h-px bg-ink-200/60 dark:bg-ink-800" />
            <MenuLink href="/account"      icon={<User className="h-4 w-4" />}    label="Account" />
            <MenuLink href="/account/orders" icon={<Package className="h-4 w-4" />} label="Orders" />
            <MenuLink href="/account/wishlist" icon={<Heart className="h-4 w-4" />}  label="Wishlist" />
            <div className="my-1 h-px bg-ink-200/60 dark:bg-ink-800" />
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-900"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-900"
    >
      <span className="text-ink-400">{icon}</span> {label}
    </Link>
  );
}

function MobileMenu({ open, onClose, isAuth, user, onSignOut }: {
  open: boolean;
  onClose: () => void;
  isAuth: boolean;
  user: ReturnType<typeof useAuthStore.getState>["user"];
  onSignOut: () => void;
}) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-ink-950/60 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-[70] h-full w-[88%] max-w-sm bg-white shadow-elev transition-transform duration-500 ease-apple md:hidden dark:bg-ink-950 dark:text-ink-100",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-ink-200/60 dark:border-ink-800">
          <span className="text-lg font-semibold">Menu</span>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink-100 dark:hover:bg-ink-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-2xl px-4 py-3 text-base font-medium hover:bg-ink-100 dark:hover:bg-ink-900"
            >
              {l.label}
            </Link>
          ))}
          <div className="my-3 h-px bg-ink-200/60 dark:bg-ink-800" />
          {isAuth ? (
            <>
              <p className="px-4 text-xs uppercase tracking-wide text-ink-400">Hello, {user?.first_name || user?.email}</p>
              <Link href="/account"        className="block rounded-2xl px-4 py-3 font-medium hover:bg-ink-100 dark:hover:bg-ink-900">Account</Link>
              <Link href="/account/orders" className="block rounded-2xl px-4 py-3 font-medium hover:bg-ink-100 dark:hover:bg-ink-900">Orders</Link>
              <button onClick={onSignOut} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-medium text-danger hover:bg-ink-100 dark:hover:bg-ink-900">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block">
                <Button variant="glass" className="w-full justify-center" size="lg">
                  <LogIn className="h-4 w-4" /> Sign in
                </Button>
              </Link>
              <Link href="/register" className="block">
                <Button variant="primary" className="w-full justify-center" size="lg">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
