"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Product } from "@/types";

/* -- Types ----------------------------------------------------------- */

export interface WishlistItem {
  id: number;
  product: Product;
  product_id: number;
  added_at: string;
}

export interface Wishlist {
  id: number;
  items: WishlistItem[];
  created_at: string;
}

/* -- Query: fetch the current user's wishlist ------------------------ */

export function useWishlist() {
  const isAuth = useAuthStore((s) => !!s.accessToken);

  return useQuery<Wishlist | null>({
    queryKey: ["wishlist"],
    enabled: isAuth,
    queryFn: async () => {
      try {
        const res: any = await apiGet("/customer/wishlists/");
        // DRF router returns a list; take the first (the user's own wishlist).
        if (Array.isArray(res) && res.length > 0) return res[0] as Wishlist;
        if (res?.results?.length) return res.results[0] as Wishlist;
        // No wishlist yet -- that's fine, we'll create on first add.
        return null;
      } catch {
        return null;
      }
    },
  });
}

/* -- Derived: product IDs in the wishlist (for quick lookup) -------- */

export function useWishlistProductIds(): Set<number> {
  const { data } = useWishlist();
  if (!data?.items) return new Set();
  return new Set(data.items.map((i) => i.product?.id ?? i.product_id));
}

/* -- Mutation: add a product to wishlist ----------------------------- */

export function useAddToWishlist() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      // Ensure a wishlist exists (POST /customer/wishlists/ creates one for the user).
      let wishlist: any = null;
      const res: any = await apiGet("/customer/wishlists/");
      if (Array.isArray(res) && res.length > 0) wishlist = res[0];
      else if (res?.results?.length) wishlist = res.results[0];

      if (!wishlist) {
        wishlist = await apiPost("/customer/wishlists/", {});
      }

      // Add the item via the custom action.
      return apiPost(`/customer/wishlists/${wishlist.id}/items/`, {
        product_id: productId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

/* -- Mutation: remove a wishlist item -------------------------------- */

export function useRemoveFromWishlist() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ wishlistId, itemId }: { wishlistId: number; itemId: number }) => {
      return apiDelete(`/customer/wishlists/${wishlistId}/items/${itemId}/`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
