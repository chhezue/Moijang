"use client";

import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/styles/theme";
import { StatusProvider } from "@/providers/StatusProvider";
import { CategoryProvider } from "@/providers/CategoryProvider";
import { SnackbarProvider } from "@/providers/SnackbarProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
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
