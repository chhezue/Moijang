"use client";

import React, { useEffect, useRef } from "react";
import { createAuthStore, AuthStoreContext, AuthStoreApi } from "@/store/authStore";
import api from "@/apis/apiClient";
import { useSetMe } from "@/hooks/useSetMe";

function AxiosInterceptorSetup() {
  const setMe = useSetMe();

  useEffect(() => {
    const id = api.interceptors.response.use(null, async (error) => {
      // 백엔드가 세션(토큰) 자체가 무효할 때만 SESSION_INVALID를 내려줌 —
      // 로그인 실패(INVALID_CREDENTIALS)/가입 토큰 만료(INVALID_SIGNUP_TOKEN) 등
      // 세션과 무관한 401은 각 폼의 자체 에러 처리에 맡기고 여기서 반응하지 않음.
      // 여기서는 상태 정리만 하고, 어디로 보낼지는 AuthGate가 ['me']가 null인 걸 보고 알아서 결정함.
      if (error.response?.data?.code === "SESSION_INVALID") {
        await setMe(null);
      }
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(id);
  }, [setMe]);

  return null;
}

// Zustand의 user 소유 역할은 더 이상 없음(인증 상태는 TanStack Query['me']가 단일 소유).
// 이 Provider는 #38에서 완전히 정리될 예정 — 지금은 인터셉터 등록 역할만 남음.
export function AuthStoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AuthStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createAuthStore(null);
  }

  return (
    <AuthStoreContext.Provider value={storeRef.current}>
      <AxiosInterceptorSetup />
      {children}
    </AuthStoreContext.Provider>
  );
}
