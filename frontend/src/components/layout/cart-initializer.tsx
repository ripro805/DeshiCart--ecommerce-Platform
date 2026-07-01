"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";

export function CartInitializer() {
  const isAuth = useAuthStore((s) => !!s.accessToken);

  useEffect(() => {
    if (!isAuth) return;
    void useCartStore.getState().fetch();
  }, [isAuth]);

  return null;
}
