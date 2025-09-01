// src/components/AuthInitializer.tsx

"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSync } from "@/hooks/useAuthSync";

export default function AuthInitializer({
  children,
  requireAuth = false,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const router = useRouter();
  const { user, loading } = useAuthSync();

  useEffect(() => {
    if (requireAuth && !loading && !user) {
      router.push("/login");
    }
  }, [requireAuth, loading, user, router]);

  return <>{children}</>;
}
