import { Suspense } from "react";
import { redirect } from "next/navigation";
import Providers from "@/providers/Providers";
import { getMyInfoServer } from "@/apis/services/auth.server";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getMyInfoServer().catch(() => null);
  if (user) redirect("/");

  return (
    <Providers initialUser={null}>
      <main className="grid min-h-screen w-full place-items-center overflow-hidden py-10">
        <Suspense>{children}</Suspense>
      </main>
    </Providers>
  );
}
