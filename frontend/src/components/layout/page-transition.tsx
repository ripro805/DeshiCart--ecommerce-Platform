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
    let cancelled = false;
    const run = async () => {
      const state = useAuthStore.getState();
      if (!state.accessToken) return;
      // Make sure we know the role before deciding whether to hit /carts/.
      let user = state.user;
      if (!user) {
        user = await state.fetchMe();
      }
      if (cancelled || !user) return;
      if (user.is_staff || user.is_superuser) return; // admins have no cart
      void useCartStore.getState().fetch();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
