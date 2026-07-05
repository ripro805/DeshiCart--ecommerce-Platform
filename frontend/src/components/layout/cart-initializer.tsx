"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";

export function CartInitializer() {
  const isAuth = useAuthStore((s) => !!s.accessToken);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isAuth || !user) return;
    // Staff/super-admin users don't have a customer cart; skip the fetch to avoid 404s.
    if (user.is_staff || user.is_superuser) return;
    void useCartStore.getState().fetch();
  }, [isAuth, user]);

  return null;
}
