"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { theme } from "@/styles/theme";
import { StatusProvider } from "@/providers/StatusProvider";
import { CategoryProvider } from "@/providers/CategoryProvider";
import { SnackbarProvider } from "@/providers/SnackbarProvider";
import api from "@/apis/apiClient";
import { useSetMe } from "@/hooks/useSetMe";

function AuthInterceptor() {
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

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInterceptor />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <StatusProvider>
          <CategoryProvider>
            <SnackbarProvider>{children}</SnackbarProvider>
          </CategoryProvider>
        </StatusProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
