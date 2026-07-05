"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// "system" means "follow the global (public navbar) theme store"
export type AdminThemeMode = "light" | "dark" | "system";

interface AdminThemeState {
  mode: AdminThemeMode;
  hydrated: boolean;
  toggle: () => void;
  setMode: (m: AdminThemeMode) => void;
  markHydrated: () => void;
}

/**
 * Scoped theme store for the admin panel.
 * Independent of the public site's useThemeStore so toggling the admin
 * theme never affects the storefront, and vice versa.
 *
 * The admin layout reads `mode` and conditionally adds the
 * `.admin-scope-dark` class to its root <div>, which flips the CSS
 * variables defined in `globals.css` (`.admin-scope-dark` block).
 */
export const useAdminTheme = create<AdminThemeState>()(
  persist(
    (set, get) => ({
      mode: "system",
      hydrated: false,
      toggle: () => set({ mode: get().mode === "dark" ? "light" : "dark" }),
      setMode: (m) => set({ mode: m }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "deshicart-admin-theme",
      onRehydrateStorage: () => (state) => {
        // Migrate: old default was "light" (hard-coded, never a real preference).
        // Treat it as "system" so the admin panel follows the global navbar theme.
        if (state && (state.mode as string) === "light") {
          state.mode = "system";
        }
        state?.markHydrated();
      },
    }
  )
);