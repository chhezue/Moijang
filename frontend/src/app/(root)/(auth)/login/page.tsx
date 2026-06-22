import { Suspense } from "react";
import { LoginForm } from "@/app/(root)/(auth)/login/components/loginForm";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
