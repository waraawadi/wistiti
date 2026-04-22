import axios from "axios";

import { useAppStore } from "@/lib/store";

const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (!original || axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (
      error.response?.status !== 401 ||
      String(original.url).includes("/api/token/refresh/")
    ) {
      return Promise.reject(error);
    }

    if (original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const refresh = useAppStore.getState().refreshToken;
    if (!refresh) {
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<{ access: string; refresh?: string }>(
        `${baseURL}/api/token/refresh/`,
        { refresh }
      );
      useAppStore.getState().setAuth({
        token: data.access,
        ...(data.refresh ? { refreshToken: data.refresh } : {}),
      });
      original.headers.Authorization = `Bearer ${data.access}`;
      return api(original);
    } catch (e) {
      useAppStore.getState().setAuth({ token: null, refreshToken: null, user: null });
      return Promise.reject(e);
    }
  }
);
