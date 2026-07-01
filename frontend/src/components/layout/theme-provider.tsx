"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

export function ThemeApplier() {
  const apply = useThemeStore((s) => s.apply);
  useEffect(() => {
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const onSystemChange = () => {
      if (useThemeStore.getState().theme === "system") apply();
    };
    mq.addEventListener("change", onSystemChange);

    // Subscribe to manual theme changes and run apply() so the .dark class flips
    const unsub = useThemeStore.subscribe((s, prev) => {
      if (s.theme !== prev.theme) {
        document.documentElement.classList.add("theme-transition");
        apply();
        window.setTimeout(
          () => document.documentElement.classList.remove("theme-transition"),
          320
        );
      }
    });

    return () => {
      mq.removeEventListener("change", onSystemChange);
      unsub();
    };
  }, [apply]);
  return null;
}
