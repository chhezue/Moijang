// src/providers/AuthContextProvider.tsx
"use client";

import { ReactNode } from "react";
import { useAuthSync } from "@/hooks/useAuthSync";

export function AuthContextProvider({ children }: { children: ReactNode }) {
  useAuthSync();
  return <>{children}</>;
}
