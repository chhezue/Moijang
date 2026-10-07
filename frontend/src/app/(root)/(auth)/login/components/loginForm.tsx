"use client";

import { useEffect } from "react";
import { Box, TextField, Button, Typography, CircularProgress } from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GradientTitle } from "@/components/GradientTitle";
import { login } from "@/apis/services/auth";
import { useSnackbar } from "@/providers/SnackbarProvider";
import { usernameSchema, passwordSchema } from "@/schemas/auth";
import { useAuthStore } from "@/store/authStore";

const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

type LoginFormInput = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();
  const setUser = useAuthStore((s) => s.setUser);

  const redirectTo = searchParams.get("redirect") ?? "/";

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (searchParams.get("error") === "login_failed") {
      showSnackbar("로그인에 실패하였습니다", "error", 3000);
    }
  }, []);

  const onSubmit = async (data: LoginFormInput) => {
    try {
      const user = await login({ loginId: data.username, password: data.password });
      setUser(user);
      window.location.href = redirectTo;
    } catch {
      showSnackbar("아이디 또는 비밀번호가 올바르지 않습니다.", "error", 3000);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center">
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{
          width: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          p: 4,
          borderRadius: 3,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <GradientTitle size="3rem" center>
          MOIJANG
        </GradientTitle>

        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
          <Controller
            name="username"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="아이디"
                fullWidth
                autoComplete="username"
                disabled={isSubmitting}
                error={!!fieldState.error}
                helperText={fieldState.error?.message ?? " "}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="비밀번호"
                type="password"
                fullWidth
                autoComplete="current-password"
                disabled={isSubmitting}
                error={!!fieldState.error}
                helperText={fieldState.error?.message ?? " "}
              />
            )}
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "로그인"}
        </Button>

        <Typography variant="body2" color="text.secondary">
          계정이 없으신가요?{" "}
          <Link href="/signup" style={{ color: "#8B5CF6", fontWeight: 600 }}>
            회원가입
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};
