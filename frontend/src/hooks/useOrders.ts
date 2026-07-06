"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { CheckoutResponse, Order, Paginated } from "@/types";

// All hooks in this file target the customer-facing surface:
//   /api/customer/orders/        (list / retrieve)
//   /api/customer/orders/<id>/cancel/
//   /api/payment/checkout/
// These are blocked for staff / admin so the shopping flow stays customer-only.

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Order>>("/customer/orders/");
      return data.results;
    },
  });
}

export function useOrder(id: number | string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["orders", id],
    queryFn: async () => {
      const { data } = await api.get<Order>(`/customer/orders/${id}/`);
      return data;
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { address_id?: number; address?: string; notes?: string } = {}) => {
      // Create goes through /api/carts/<cart_pk>/checkout/ flow:
      // 1. POST /api/carts/                -> ensure cart exists
      // 2. POST /api/carts/<id>/items/     -> add items (caller does this)
      // 3. POST /api/payment/checkout/     -> create Order + init payment
      const { data } = await api.post<CheckoutResponse>("/payment/checkout/", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<Order>(`/customer/orders/${id}/cancel/`);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orders", data.id] });
    },
  });
}

export function useInitiatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number) => {
      const { data } = await api.post<CheckoutResponse>("/payment/checkout/", { order_id: orderId });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
