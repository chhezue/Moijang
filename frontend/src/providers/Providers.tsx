"use client";

import React, { useRef } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/styles/theme";
import { StatusProvider } from "@/providers/StatusProvider";
import { CategoryProvider } from "@/providers/CategoryProvider";
import { SnackbarProvider } from "@/providers/SnackbarProvider";
import { UserDto } from "@/types/auth";
import { useAuthStore } from "@/store/authStore";

export default function Providers({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: UserDto | null;
}) {
  const initialized = useRef(false);

  if (!initialized.current) {
    initialized.current = true;
    if (initialUser) useAuthStore.setState({ user: initialUser });
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StatusProvider>
        <CategoryProvider>
          <SnackbarProvider>{children}</SnackbarProvider>
        </CategoryProvider>
      </StatusProvider>
    </ThemeProvider>
  );
}
