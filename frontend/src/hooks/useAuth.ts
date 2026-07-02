"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { isAdmin, isSuperAdmin, roleOf, type AuthTokens, type User, type UserRole } from "@/types";

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (store.accessToken && !store.user) {
      void store.fetchMe();
    }
  }, [store.accessToken]);

  async function login(email: string, password: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>("/auth/jwt/create/", { email, password });
    store.setTokens(data);
    await store.fetchMe();
    return data;
  }

  async function register(payload: {
    email: string;
    password: string;
    re_password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<User> {
    const { data } = await api.post<User>("/auth/users/", payload);
    return data;
  }

  async function activate(uid: string, token: string): Promise<void> {
    await api.post("/auth/users/activation/", { uid, token });
  }

  async function logout() {
    const refresh = store.refreshToken;
    if (refresh) {
      try { await api.post("/auth/jwt/logout/", { refresh }); } catch {}
    }
    store.logout();
  }

  async function requestPasswordReset(email: string): Promise<void> {
    await api.post("/auth/users/reset_password/", { email });
  }

  async function confirmPasswordReset(uid: string, token: string, new_password: string, re_new_password: string): Promise<void> {
    await api.post("/auth/users/reset_password_confirm/", {
      uid, token, new_password, re_new_password,
    });
  }

  async function changePassword(current_password: string, new_password: string, re_new_password: string): Promise<void> {
    await api.post("/auth/users/set_password/", {
      current_password, new_password, re_new_password,
    });
  }

  async function updateProfile(patch: Partial<User>): Promise<User> {
    const { data } = await api.patch<User>("/auth/users/me/", patch);
    store.setUser(data);
    return data;
  }

  const user = store.user;
  const role: UserRole = roleOf(user);
  return {
    ...store,
    user,
    role,
    isAuthenticated: !!store.accessToken,
    isAdmin: isAdmin(user),
    isSuperAdmin: isSuperAdmin(user),
    isBlocked: !!user?.is_blocked,
    login,
    register,
    activate,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
    changePassword,
    updateProfile,
  };
}
