"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export function AuthInitializer() {
  useEffect(() => {
    const access = useAuthStore.getState().accessToken;
    if (access && !useAuthStore.getState().user) {
      void useAuthStore.getState().fetchMe();
    }
  }, []);
  return null;
}
