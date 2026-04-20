import { Suspense } from "react";
import Providers from "@/redux/Provider";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <main className="grid min-h-screen w-full place-items-center overflow-hidden py-10">
        <Suspense>{children}</Suspense>
      </main>
    </Providers>
  );
}
