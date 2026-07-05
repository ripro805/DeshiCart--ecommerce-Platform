"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info" | "warn";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  durationMs: number;
};

type ToastState = {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id" | "durationMs"> & { durationMs?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

let counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = `t_${Date.now()}_${++counter}`;
    const item: ToastItem = {
      id,
      title: t.title,
      description: t.description,
      variant: t.variant,
      durationMs: t.durationMs ?? 4000,
    };
    set((s) => ({ toasts: [...s.toasts, item] }));
    if (typeof window !== "undefined" && item.durationMs > 0) {
      window.setTimeout(() => get().dismiss(id), item.durationMs);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Convenience helpers */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({
      title,
      description,
      variant: "error",
      durationMs: 6000,
    }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: "info" }),
  warn: (title: string, description?: string) =>
    useToastStore.getState().push({
      title,
      description,
      variant: "warn",
      durationMs: 5000,
    }),
};