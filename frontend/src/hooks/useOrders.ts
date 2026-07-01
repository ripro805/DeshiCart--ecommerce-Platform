"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { CheckoutResponse, Order, Paginated } from "@/types";

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Order>>(`/orders/`);
      return data.results;
    },
  });
}

export function useOrder(id: number | string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["orders", id],
    queryFn: async () => {
      const { data } = await api.get<Order>(`/orders/${id}/`);
      return data;
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { address?: string; notes?: string } = {}) => {
      const { data } = await api.post<Order>("/orders/", payload);
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
      const { data } = await api.post<Order>(`/orders/${id}/cancel/`);
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
