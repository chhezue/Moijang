"use client";

import React, { useEffect, useRef } from "react";
import { UserDto } from "@/types/auth";
import { createAuthStore, AuthStoreContext, AuthStoreApi, useAuthStore } from "@/store/authStore";
import api from "@/apis/apiClient";

function AxiosInterceptorSetup() {
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    const id = api.interceptors.response.use(null, async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._isRetry) {
        originalRequest._isRetry = true;
        try {
          await api.get("/api/auth/refresh_token");
          return api(originalRequest);
        } catch {
          clearUser();
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(id);
  }, [clearUser]);

  return null;
}

export function AuthStoreProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: UserDto | null;
}) {
  const storeRef = useRef<AuthStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createAuthStore(initialUser ?? null);
  }

  return (
    <AuthStoreContext.Provider value={storeRef.current}>
      <AxiosInterceptorSetup />
      {children}
    </AuthStoreContext.Provider>
  );
}
