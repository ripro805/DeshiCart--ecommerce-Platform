"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Category, Paginated, Product, Review } from "@/types";

export interface ProductFilters {
  search?: string;
  category?: number | string;
  min_price?: number | string;
  max_price?: number | string;
  ordering?: string;
  page?: number | string;
  [key: string]: string | number | undefined;
}

export function useProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== "") params.set(k === "minPrice" ? "min_price" : k === "maxPrice" ? "max_price" : k, String(v));
  }

  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Product>>(`/products/?${params.toString()}`);
      return data;
    },
  });
}

export function useProduct(id: number | string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["products", id],
    queryFn: async () => {
      const { data } = await api.get<Product>(`/products/${id}/`);
      return data;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Category> | Category[]>("/categories/");
      if (Array.isArray(data)) return data;
      return data.results ?? [];
    },
  });
}

export function useProductReviews(productId: number | string | undefined) {
  const qc = useQueryClient();
  const list = useQuery({
    enabled: !!productId,
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Review> | Review[]>(`/products/${productId}/reviews/`);
      if (Array.isArray(data)) return data;
      return data.results ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: { ratings: number; comment: string }) => {
      const { data } = await api.post<Review>(`/products/${productId}/reviews/`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["products", Number(productId)] });
    },
  });

  return { ...list, create };
}
