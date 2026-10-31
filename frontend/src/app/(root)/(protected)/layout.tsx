import { Suspense } from "react";
import AuthGate from "@/components/AuthGate";
import ProtectedClient from "@/app/(root)/(protected)/protectedClient";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AuthGate mode="require-auth">
        <ProtectedClient>{children}</ProtectedClient>
      </AuthGate>
    </Suspense>
  );
}
