"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  cycle: () => void;
  apply: () => void;
}

function systemPref(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolved: "light",
      setTheme: (t) => {
        set({ theme: t });
        get().apply();
      },
      cycle: () => {
        const next: Theme = get().theme === "light" ? "dark" : get().theme === "dark" ? "system" : "light";
        set({ theme: next });
        get().apply();
      },
      apply: () => {
        const t = get().theme;
        const resolved = t === "system" ? systemPref() : t;
        set({ resolved });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", resolved === "dark");
        }
      },
    }),
    { name: "deshicart-theme" }
  )
);
