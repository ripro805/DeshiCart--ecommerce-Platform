"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Warehouse,
  Star,
  Headphones,
  Truck,
  Bell,
  Wallet,
  Undo2,
  Megaphone,
  FileText,
  Heart,
  BarChart3,
  FileBarChart2,
  BookOpen,
  Palette,
  Settings,
  ShieldCheck,
  ChevronRight,
  LogOut,
  UserCircle,
  X,
  Loader2,
  Search,
  Calendar,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth";
import { useAdminTheme } from "@/store/adminTheme";
import { useThemeStore } from "@/store/theme";
import { cn } from "@/lib/utils";
import { AdminProviders } from "@/components/admin/layout/admin-providers";

// Sidebar menu definitions.
//
// Visibility rules:
//   `staff: true`  → SUPER_ADMIN only (hidden from Staff Admin)
//   `staff: false` → visible to both Staff Admin and Super Admin
//
// Per the latest spec, the Staff Admin sidebar must show ONLY:
//   Dashboard, Products, Inventory, Orders, Customers,
//   Shipping, Reviews, Support Center, Notifications
// (plus Profile/Logout in the footer area).
// Super Admin sees the full list.
const NAV = [
  { href: "/admin/dashboard",       label: "Dashboard",     icon: LayoutDashboard, staff: false },
  { href: "/admin/products",        label: "Products",      icon: Package,         staff: false },
  { href: "/admin/inventory",       label: "Inventory",     icon: Warehouse,       staff: false },
  { href: "/admin/orders",          label: "Orders",        icon: ShoppingCart,    staff: false },
  { href: "/admin/users",           label: "Customers",     icon: Users,           staff: false },
  { href: "/admin/shipping",        label: "Shipping",      icon: Truck,           staff: false },
  { href: "/admin/reviews",         label: "Reviews",       icon: Star,            staff: false },
  { href: "/admin/support",         label: "Support Center",icon: Headphones,      staff: false },
  { href: "/admin/notifications",   label: "Notifications", icon: Bell,            staff: false },
  // Super-admin-only sections.
  { href: "/admin/categories",      label: "Categories",    icon: Tag,             staff: true  },
  { href: "/admin/staff",           label: "Staff",         icon: ShieldCheck,     staff: true  },
  { href: "/admin/coupons",         label: "Coupons",       icon: Tag,             staff: true  },
  { href: "/admin/returns",         label: "Returns",       icon: Undo2,           staff: true  },
  { href: "/admin/wishlists",       label: "Wishlists",     icon: Heart,           staff: true  },
  { href: "/admin/analytics",       label: "Analytics",     icon: BarChart3,       staff: true  },
  { href: "/admin/content",         label: "Content",       icon: BookOpen,        staff: true  },
  { href: "/admin/reports",         label: "Reports",       icon: FileBarChart2,   staff: true  },
  { href: "/admin/finance",         label: "Finance",       icon: Wallet,          staff: true  },
  { href: "/admin/marketing",       label: "Marketing",     icon: Megaphone,       staff: true  },
  { href: "/admin/cms",             label: "CMS / Pages",   icon: FileText,        staff: true  },
  { href: "/admin/appearance",      label: "Appearance",    icon: Palette,         staff: true  },
  { href: "/admin/store-settings",  label: "Settings",      icon: Settings,        staff: true  },
];

// Role-aware panel title used in the sidebar header + document title.
function panelTitle(isSuperAdmin: boolean): string {
  return isSuperAdmin ? "Super Admin Panel" : "Staff Admin Panel";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSuperAdmin: isSuperAdminHook, logout } = useAuth();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { mode: adminMode, toggle: toggleAdminTheme, hydrated } = useAdminTheme();
  // Follow the global (customer navbar) theme so a single click on the
  // nav bar's dark-mode button also darkens the admin panel. The admin
  // toggle below remains available as a manual override.
  const globalTheme = useThemeStore((s) => s.resolved);
  const setGlobalTheme = useThemeStore((s) => s.setTheme);

  // Compute the effective dark flag:
  // - "dark"   → always dark
  // - "light"  → always light
  // - "system" → mirror the global (navbar) theme
  const isAdminDark =
    adminMode === "dark" ? true : adminMode === "light" ? false : globalTheme === "dark";

  // Toggle: if currently dark → go light, if currently light/system-light → go dark,
  // if currently system-dark → go light. Also keep global in sync.
  const handleThemeToggle = () => {
    const nextDark = !isAdminDark;
    toggleAdminTheme();
    setGlobalTheme(nextDark ? "dark" : "light");
  };

  const isSuperAdmin = isSuperAdminHook;
  const staffBlockedPrefixes = useMemo(
    () => NAV.filter((i) => i.staff).map((i) => i.href),
    []
  );

  useEffect(() => {
    if (!isHydrated) fetchMe().catch(() => {});
  }, [isHydrated, fetchMe]);

  useEffect(() => {
    if (isHydrated && !user) router.replace("/login?next=/admin/dashboard");
  }, [isHydrated, user, router]);

  useEffect(() => {
    if (!user || isSuperAdmin) return;
    const blocked = staffBlockedPrefixes.find((p) => pathname?.startsWith(p));
    if (blocked) router.replace("/admin/dashboard");
  }, [pathname, user, isSuperAdmin, staffBlockedPrefixes, router]);

  // Browser tab title — reflects the authenticated role.
  useEffect(() => {
    if (!user) return;
    const base = "DeshiCart";
    const title = pathname?.startsWith("/admin")
      ? `${panelTitle(isSuperAdmin)} · ${base}`
      : base;
    document.title = title;
  }, [user, isSuperAdmin, pathname]);

  const handleLogout = async () => {
    try { await logout(); } finally { router.replace("/login"); }
  };

  const items = useMemo(
    () =>
      NAV.filter((i) =>
        isSuperAdmin ? true : !staffBlockedPrefixes.includes(i.href)
      ),
    [isSuperAdmin, staffBlockedPrefixes]
  );

  const todayLabel = () =>
    new Date().toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });

  const showLoading = !hydrated || !mounted || !isHydrated;

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "admin-scope min-h-screen flex bg-background",
        isAdminDark && "admin-scope-dark"
      )}
    >
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border text-foreground transform transition-transform lg:relative lg:translate-x-0 shadow-xl flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile-only close affordance — branding lives in the Navbar */}
        <div className="flex lg:hidden items-center justify-end px-3 pt-3 shrink-0">
          <button
            className="text-foreground/70 hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search is the first functional element of the sidebar */}
        <div className="px-3 pt-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <input
              type="text"
              placeholder="Search products, orders, users..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface focus:border-primary transition"
            />
          </div>
        </div>

        <nav className="px-2 py-4 space-y-0.5 overflow-y-auto flex-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  active
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-warm"
                    : "text-foreground/70 hover:bg-muted hover:text-primary"
                )}
              >
                <span
                  className={cn(
                    "h-7 w-7 rounded-md flex items-center justify-center transition",
                    active ? "bg-white/20" : "bg-muted group-hover:bg-muted"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium">{item.label}</span>
                {active && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-90" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-3 space-y-2 shrink-0 bg-surface">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-sm font-semibold ring-2 ring-surface shadow-warm">
              {user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {user?.email}
              </div>
              <div className="text-[11px] text-primary leading-tight">
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-0.5 text-primary font-semibold">
                    <Sparkles className="h-3 w-3" /> Super Admin Panel
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-primary font-semibold">
                    <ShieldCheck className="h-3 w-3" /> Staff Admin Panel
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 px-1">
            <div className="hidden sm:inline-flex items-center gap-1 text-[11px] text-foreground bg-muted px-2 py-1 rounded-full border border-border">
              <Calendar className="h-3 w-3 text-primary" />
              {todayLabel()}
            </div>
            <button
              className="relative h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-foreground ml-auto"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
            </button>
            <button
              onClick={handleThemeToggle}
              className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-foreground transition-colors"
              aria-label={isAdminDark ? "Switch admin to light mode" : "Switch admin to dark mode"}
              title={isAdminDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isAdminDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <Link
            href="/account"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="h-7 w-7 rounded-md flex items-center justify-center bg-muted">
              <UserCircle className="h-3.5 w-3.5" />
            </span>
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground/70 hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <span className="h-7 w-7 rounded-md flex items-center justify-center bg-muted">
              <LogOut className="h-3.5 w-3.5" />
            </span>
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden bg-background">
          {children}
        </main>
      </div>
      <AdminProviders />    </div>
  );
}