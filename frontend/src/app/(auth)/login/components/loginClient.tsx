"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/app/(auth)/login/components/loginForm";
import { Box } from "@mui/material";
import { useSnackbar } from "@/providers/SnackbarProvider";

export const LoginClient = () => {
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();
  const redirect = searchParams.get("redirect") ?? "/";

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "login_failed") {
      showSnackbar("로그인에 실패하였습니다", "error", 3000);
    }
  }, [searchParams, showSnackbar]);

  return (
    <Box display="flex" justifyContent="center" alignItems="center">
      <LoginForm redirectTo={redirect} />
    </Box>
  );
};
