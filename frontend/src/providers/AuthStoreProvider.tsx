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

  // (root)/layout.tsx가 soft navigation(redirect()) 이후 새 initialUser로 재렌더될 때,
  // 이 Provider 인스턴스는 그대로 유지되므로 위 useRef 가드만으로는 store가 갱신되지 않음.
  // 로그인/로그아웃으로 유저 식별자가 실제로 바뀐 경우에만 store에 반영한다.
  useEffect(() => {
    const store = storeRef.current!;
    if (initialUser?.id !== store.getState().user?.id) {
      if (initialUser) {
        store.getState().setUser(initialUser);
      } else {
        store.getState().clearUser();
      }
    }
  }, [initialUser]);

  return (
    <AuthStoreContext.Provider value={storeRef.current}>
      <AxiosInterceptorSetup />
      {children}
    </AuthStoreContext.Provider>
  );
}
