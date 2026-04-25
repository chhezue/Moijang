"use client";

import React, { useEffect } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/styles/theme";
import { StatusProvider } from "@/providers/StatusProvider";
import { CategoryProvider } from "@/providers/CategoryProvider";
import { SnackbarProvider } from "@/providers/SnackbarProvider";
import { IUser } from "@/apis/interfaces";
import { useAuthStore } from "@/store/authStore";

export default function Providers({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: IUser | null;
}) {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    if (initialUser) setUser(initialUser);
    else clearUser();
  }, []);

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
