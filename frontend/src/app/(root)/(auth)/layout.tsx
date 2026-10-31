import { Suspense } from "react";
import AuthGate from "@/components/AuthGate";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGate mode="require-guest">
      <main className="grid min-h-screen w-full place-items-center overflow-hidden py-10">
        <Suspense>{children}</Suspense>
      </main>
    </AuthGate>
  );
}
