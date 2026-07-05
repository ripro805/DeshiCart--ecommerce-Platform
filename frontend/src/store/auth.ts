"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import type { AuthTokens, User } from "@/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isHydrated: boolean;

  setTokens: (t: AuthTokens) => void;
  setAccessToken: (t: string) => void;
  setUser: (u: User | null) => void;
  clear: () => void;
  fetchMe: () => Promise<User | null>;
  logout: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isHydrated: false,

      setTokens: (t) => set({ accessToken: t.access, refreshToken: t.refresh }),
      setAccessToken: (t) => set({ accessToken: t }),
      setUser: (u) => set({ user: u }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      markHydrated: () => set({ isHydrated: true }),

      async fetchMe() {
        if (!get().accessToken) return null;
        try {
          const { data } = await api.get<User>("/customer/me/");
          set({ user: data });
          return data;
        } catch {
          get().clear();
          return null;
        }
      },

      logout() {
        get().clear();
      },
    }),
    {
      name: "deshicart-auth",
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);
