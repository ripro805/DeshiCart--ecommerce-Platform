"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import type { Cart, CartItem } from "@/types";

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  fetch: () => Promise<Cart | null>;
  addItem: (productId: number, quantity?: number) => Promise<Cart | null>;
  updateItem: (itemId: number, quantity: number) => Promise<Cart | null>;
  removeItem: (itemId: number) => Promise<Cart | null>;
  clearLocal: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      isOpen: false,
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),
      toggleDrawer: () => set((s) => ({ isOpen: !s.isOpen })),

      async fetch() {
        set({ isLoading: true });
        try {
          const { data } = await api.get<Cart | Cart[] | { results?: Cart[] }>("/carts/");
          let cart: Cart | null = null;
          if (Array.isArray(data)) {
            cart = data[0] ?? null;
          } else if (data && Array.isArray((data as { results?: Cart[] }).results)) {
            cart = ((data as { results?: Cart[] }).results as Cart[])[0] ?? null;
          } else {
            cart = (data as Cart) ?? null;
          }
          set({ cart });
          return cart;
        } catch {
          set({ cart: null });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      async addItem(productId, quantity = 1) {
        set({ isLoading: true });
        try {
          const cart = get().cart;
          if (!cart) {
            // create cart if not exist
            const { data: created } = await api.post<Cart>("/carts/", {});
            await api.post(`/carts/${created.id}/items/`, { product_id: productId, quantity });
          } else {
            await api.post(`/carts/${cart.id}/items/`, { product_id: productId, quantity });
          }
          return await get().fetch();
        } finally {
          set({ isLoading: false });
        }
      },

      async updateItem(itemId, quantity) {
        set({ isLoading: true });
        try {
          const cart = get().cart;
          if (!cart) return null;
          await api.patch(`/carts/${cart.id}/items/${itemId}/`, { quantity });
          return await get().fetch();
        } finally {
          set({ isLoading: false });
        }
      },

      async removeItem(itemId) {
        set({ isLoading: true });
        try {
          const cart = get().cart;
          if (!cart) return null;
          await api.delete(`/carts/${cart.id}/items/${itemId}/`);
          return await get().fetch();
        } finally {
          set({ isLoading: false });
        }
      },

      clearLocal: () => set({ cart: null }),
    }),
    {
      name: "deshicart-cart",
      partialize: (s) => ({ cart: s.cart }),
    }
  )
);

export function cartItemCount(items?: CartItem[] | null): number {
  if (!items) return 0;
  return items.reduce((sum, it) => sum + (it.quantity || 0), 0);
}
