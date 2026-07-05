import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

// Attach access token to every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => {
    r.data = unwrap(r.data);
    return r;
  },
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !original.url?.includes("jwt")) {
      const refresh = useAuthStore.getState().refreshToken;
      if (!refresh) {
        useAuthStore.getState().clear();
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (!token) return reject(error);
            (original.headers as Record<string, string>).Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post("/api/auth/jwt/refresh/", { refresh });
        const newAccess = data.access as string;
        useAuthStore.getState().setAccessToken(newAccess);
        flushQueue(newAccess);
        (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        flushQueue(null);
        useAuthStore.getState().clear();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Unwrap backend envelope { success, data, meta, error } -> data.
// Pass through paginated DRF { count, next, previous, results } unchanged.
export function unwrap<T = unknown>(raw: any): T {
  if (raw == null) return raw as T;
  if (typeof raw === "object" && "success" in raw && "data" in raw) {
    return (raw.data ?? null) as T;
  }
  return raw as T;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function isPaginated<T = unknown>(raw: any): raw is Paginated<T> {
  return raw && typeof raw === "object" && "results" in raw && Array.isArray(raw.results);
}

// Convenience helpers that auto-unwrap backend envelope responses.
async function _call<T = unknown>(p: Promise<{ data: any }>): Promise<T> {
  const res = await p;
  return unwrap<T>(res.data);
}

export function apiGet<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return _call<T>(api.get(url, config));
}

export function apiPost<T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return _call<T>(api.post(url, body, config));
}

export function apiPatch<T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return _call<T>(api.patch(url, body, config));
}

export function apiPut<T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return _call<T>(api.put(url, body, config));
}

export function apiDelete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return _call<T>(api.delete(url, config));
}

export default api;
