"use client";

import React from "react";
import { Provider } from "react-redux";
import store from "./store";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/styles/theme";
import { StatusProvider } from "@/providers/StatusProvider";
import { CategoryProvider } from "@/providers/CategoryProvider";
import { SnackbarProvider } from "@/providers/SnackbarProvider";
import AuthInitializer from "@/components/AuthInitializer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <StatusProvider>
          <CategoryProvider>
            <SnackbarProvider>
              <AuthInitializer>{children}</AuthInitializer>
            </SnackbarProvider>
          </CategoryProvider>
        </StatusProvider>
      </ThemeProvider>
    </Provider>
  );
}
