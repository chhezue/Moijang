import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getMyInfoServer } from "@/apis/services/auth.server";
import { resolveRedirectTarget } from "@/utils/redirect";

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getMyInfoServer().catch(() => null);
  if (user) {
    // middleware가 x-pathname에 "pathname+search"를 실어줌 (layout은 searchParams prop을 못 받음)
    const currentUrl = headers().get("x-pathname") ?? "";
    const rawRedirect = new URLSearchParams(currentUrl.split("?")[1] ?? "").get("redirect");
    redirect(resolveRedirectTarget(rawRedirect));
  }

  return (
    <main className="grid min-h-screen w-full place-items-center overflow-hidden py-10">
      <Suspense>{children}</Suspense>
    </main>
  );
}
