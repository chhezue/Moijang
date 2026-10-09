"use client";

import React, { useEffect, useRef } from "react";
import { UserDto } from "@/types/auth";
import { createAuthStore, AuthStoreContext, AuthStoreApi, useAuthStore } from "@/store/authStore";
import api from "@/apis/apiClient";

function AxiosInterceptorSetup() {
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    const id = api.interceptors.response.use(null, async (error) => {
      // 백엔드가 세션(토큰) 자체가 무효할 때만 SESSION_INVALID를 내려줌 —
      // 로그인 실패(INVALID_CREDENTIALS)/가입 토큰 만료(INVALID_SIGNUP_TOKEN) 등
      // 세션과 무관한 401은 각 폼의 자체 에러 처리에 맡기고 여기서 반응하지 않음
      if (error.response?.data?.code === "SESSION_INVALID") {
        clearUser();
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
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

  // (root)/layout.tsx가 soft navigation(router.refresh() 등) 이후 새 initialUser로 재렌더될 때,
  // 이 Provider 인스턴스는 그대로 유지되므로 위 useRef 가드만으로는 store가 갱신되지 않음.
  // 로그인 식별자가 실제로 바뀐 경우(예: 다른 탭 로그아웃 후 이 탭에서 router.refresh())에만 반영한다.
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
