"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";

/**
 * Run once on mount + hydrate auth/cart from localStorage
 * and refetch the cart whenever the path changes between auth-aware pages.
 */
export function StoreSyncer() {
  const pathname = usePathname();

  useEffect(() => {
    const access = useAuthStore.getState().accessToken;
    if (access && !useAuthStore.getState().user) {
      void useAuthStore.getState().fetchMe();
    }
  }, [pathname]);

  useEffect(() => {
    if (useAuthStore.getState().accessToken) {
      void useCartStore.getState().fetch();
    }
  }, [pathname]);

  return null;
}
