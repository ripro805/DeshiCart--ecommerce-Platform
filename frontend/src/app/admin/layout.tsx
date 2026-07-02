"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Wallet,
  Undo2, Bell, Megaphone, FileText, Headphones, Truck,
  Heart, BarChart3, FileBarChart2, BookOpen, Palette,
  Settings, ShieldCheck, LogOut, Menu, X, ChevronRight, Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: BookOpen },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/staff", label: "Staff", icon: ShieldCheck, superAdminOnly: true },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/finance", label: "Finance", icon: Wallet },
  { href: "/admin/returns", label: "Returns", icon: Undo2 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
  { href: "/admin/cms", label: "CMS / Pages", icon: FileText },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/wishlists", label: "Wishlists", icon: Heart },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/content", label: "Content Home", icon: BookOpen },
  { href: "/admin/appearance", label: "Appearance", icon: Palette },
  { href: "/admin/store-settings", label: "Store Settings", icon: Settings, superAdminOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, isSuperAdmin, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait for hydration before deciding to redirect
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/admin/dashboard")}`);
      return;
    }
    if (!isAdmin) {
      router.replace("/account");
    }
  }, [hydrated, isAuthenticated, isAdmin, pathname, router]);

  if (!hydrated || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const items = NAV.filter((n) => !n.superAdminOnly || isSuperAdmin);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 transform transition-transform lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <ShieldCheck className="h-6 w-6 text-indigo-400" />
            DeshiCart
            <span className="text-xs text-slate-400 font-normal">Admin</span>
          </Link>
          <button
            className="lg:hidden text-slate-300"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-2 py-4 space-y-0.5 overflow-y-auto h-[calc(100vh-4rem)]">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-rose-600 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </aside>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-900">{user?.email}</div>
              <div className="text-xs text-slate-500">{isSuperAdmin ? "Super Admin" : "Staff"}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">
              {user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}