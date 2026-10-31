"use client";

import React, { useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { theme } from "@/styles/theme";
import { StatusProvider } from "@/providers/StatusProvider";
import { CategoryProvider } from "@/providers/CategoryProvider";
import { SnackbarProvider } from "@/providers/SnackbarProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
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
