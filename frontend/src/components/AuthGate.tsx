"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useMe } from "@/hooks/useMe";

interface AuthGateProps {
  /** require-auth: 미인증이면 /login으로. require-guest: 인증돼있으면 /로. */
  mode: "require-auth" | "require-guest";
  children: React.ReactNode;
}

function CenteredBox({ children }: { children: React.ReactNode }) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      {children}
    </Box>
  );
}

export default function AuthGate({ mode, children }: AuthGateProps) {
  const { data: user, isPending, isError } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isPending || isError) return;
    if (mode === "require-auth" && user === null) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (mode === "require-guest" && user) {
      router.replace("/");
    }
  }, [mode, isPending, isError, user, pathname, router]);

  if (isPending) {
    return (
      <CenteredBox>
        <CircularProgress />
      </CenteredBox>
    );
  }

  // 401 아닌 에러(네트워크/5xx) — 로그아웃으로 오판하지 않고 별도 에러 UI로 분기.
  // 단, require-guest(로그인/가입 폼)는 "이미 로그인됐는지 확인 실패"가 치명적이지 않음 —
  // 최악의 경우 이미 로그인된 사람이 폼을 또 보는 정도라, 막지 않고 그냥 보여줌.
  if (isError && mode === "require-auth") {
    return (
      <CenteredBox>
        <Typography color="error">
          일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.
        </Typography>
      </CenteredBox>
    );
  }

  if (mode === "require-auth" && !user) return null; // redirect 진행 중
  if (mode === "require-guest" && !isError && user) return null; // redirect 진행 중

  return <>{children}</>;
}
