"use client";

import { useAuthStore } from "@/store/auth";
import type { UserRole } from "@/types";

export type PermissionAction =
  | "manage_users"
  | "set_role"
  | "delete_user"
  | "manage_products"
  | "delete_product"
  | "manage_orders"
  | "manage_inventory"
  | "manage_shipping"
  | "manage_reviews"
  | "manage_support"
  | "manage_coupons"
  | "manage_finance"
  | "manage_marketing"
  | "manage_cms"
  | "manage_content"
  | "manage_appearance"
  | "manage_reports"
  | "manage_analytics"
  | "manage_returns"
  | "manage_notifications"
  | "manage_store_settings"
  | "manage_wishlists";

const MATRIX: Record<PermissionAction, UserRole[]> = {
  // SUPER_ADMIN only
  set_role: ["SUPER_ADMIN"],
  delete_user: ["SUPER_ADMIN"],
  manage_finance: ["SUPER_ADMIN"],
  manage_marketing: ["SUPER_ADMIN"],
  manage_cms: ["SUPER_ADMIN"],
  manage_reports: ["SUPER_ADMIN"],
  manage_store_settings: ["SUPER_ADMIN"],
  manage_appearance: ["SUPER_ADMIN"],
  manage_analytics: ["STAFF_ADMIN", "SUPER_ADMIN"],

  // STAFF + SUPER (also includes coupons and wishlists per ops request —
  // staff need to handle day-to-day promotional codes and review customer
  // wishlists without escalating to a super admin).
  manage_users: ["STAFF_ADMIN", "SUPER_ADMIN"],
  manage_products: ["STAFF_ADMIN", "SUPER_ADMIN"],
  delete_product: ["SUPER_ADMIN"], // gate destructive
  manage_orders: ["STAFF_ADMIN", "SUPER_ADMIN"],
  manage_inventory: ["STAFF_ADMIN", "SUPER_ADMIN"],
  manage_shipping: ["STAFF_ADMIN", "SUPER_ADMIN"],
  manage_reviews: ["STAFF_ADMIN", "SUPER_ADMIN"],
  manage_support: ["STAFF_ADMIN", "SUPER_ADMIN"],
  manage_content: ["STAFF_ADMIN", "SUPER_ADMIN"],
  manage_coupons: ["STAFF_ADMIN", "SUPER_ADMIN"],
  manage_returns: ["STAFF_ADMIN", "SUPER_ADMIN"],
  manage_notifications: ["STAFF_ADMIN", "SUPER_ADMIN"],
  manage_wishlists: ["STAFF_ADMIN", "SUPER_ADMIN"],
};

export function usePermission(action: PermissionAction): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  const role = (user as any).role as UserRole | undefined;
  if (!role) return false;
  return MATRIX[action].includes(role);
}

/**
 * Permission hook that returns a `loading` flag while the auth store is
 * still resolving the current user (e.g. right after navigation, before
 * `fetchMe` finishes). Without this, pages briefly render "Access denied"
 * on every admin route change because `user` is null for a frame.
 */
export function usePermissionState(action: PermissionAction): {
  allowed: boolean;
  loading: boolean;
} {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  // While the persisted store hasn't rehydrated OR we have a token but no
  // user yet (fetchMe in flight), treat as loading — not denied.
  if (!isHydrated) return { allowed: false, loading: true };
  if (accessToken && !user) return { allowed: false, loading: true };

  if (!user) return { allowed: false, loading: false };
  const role = (user as any).role as UserRole | undefined;
  if (!role) return { allowed: false, loading: false };
  return { allowed: MATRIX[action].includes(role), loading: false };
}

export function RoleGuard({
  action,
  children,
  fallback = null,
}: {
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const allowed = usePermission(action);
  return <>{allowed ? children : fallback}</>;
}