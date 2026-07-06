"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type Address = {
  id: number;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
  phone?: string | null;
  is_default_billing: boolean;
  is_default_shipping: boolean;
  created_at: string;
  updated_at: string;
};

export type AddressPayload = Omit<Address, "id" | "created_at" | "updated_at">;

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Address>>("/customer/addresses/");
      return data.results;
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddressPayload) => {
      const { data } = await api.post<Address>("/customer/addresses/", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AddressPayload> & { id: number }) => {
      const { data } = await api.patch<Address>(`/customer/addresses/${id}/`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/customer/addresses/${id}/`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}