"use client";

import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GradientTitle } from "@/components/GradientTitle";
import { login } from "@/apis/services/auth";
import { useSnackbar } from "@/providers/SnackbarProvider";
import { usernameSchema, passwordSchema, getError } from "@/schemas/auth";

interface Props {
  redirectTo?: string;
}

export const LoginForm = ({ redirectTo = "/" }: Props) => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });

  const usernameError = touched.username
    ? getError(usernameSchema, username)
    : null;
  const passwordError = touched.password
    ? getError(passwordSchema, password)
    : null;

  const handleLogin = async () => {
    if (!username || !password) return;
    setLoading(true);
    try {
      await login({ loginId: username, password });
      router.push(redirectTo);
    } catch {
      showSnackbar("아이디 또는 비밀번호가 올바르지 않습니다.", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
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

      <Box
        sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, username: true }))}
          fullWidth
          autoComplete="username"
          disabled={loading}
          error={!!usernameError}
          helperText={usernameError ?? " "}
        />
        <TextField
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          fullWidth
          autoComplete="current-password"
          disabled={loading}
          error={!!passwordError}
          helperText={passwordError ?? " "}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
      </Box>

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleLogin}
        disabled={!username || !password || loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "로그인"}
      </Button>

      <Typography variant="body2" color="text.secondary">
        계정이 없으신가요?{" "}
        <Link href="/signup" style={{ color: "#8B5CF6", fontWeight: 600 }}>
          회원가입
        </Link>
      </Typography>
    </Box>
  );
};
